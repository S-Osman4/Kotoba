// app/api/chat/route.ts
//
// POST /api/chat
//
// Streams an AI tutor response back to the client.
//
// Request body:
//   {
//     message: string        — the user's message
//     context: SessionContext — mode, current question, answered state, etc.
//   }
//
// Response:
//   text/plain stream — tokens arrive as plain text chunks.
//   The client reads this with a ReadableStream reader.
//
// Error responses (non-streaming):
//   400 — missing or malformed body
//   500 — AI provider error
//
// Edge runtime:
//   Streaming requires edge or Node.js streaming runtime.
//   Edge gives lower latency and works on Vercel free tier.
//
// Why plain text stream instead of SSE or JSON stream:
//   The client only needs the text content — no event names, no metadata.
//   Plain text is the simplest format for the useStream hook to consume.
//   If richer events are needed later (e.g. citations), switch to SSE.

import { type NextRequest, NextResponse } from "next/server";
import { composeSystemPrompt } from "@/lib/prompts/system";
import type { SessionContext } from "@/types/session";

export const runtime = "edge";

// ─── Request body ─────────────────────────────────────────────────────────────

interface ChatRequestBody {
  message: string;
  context: SessionContext;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: ChatRequestBody;

  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "invalid_request_body",
        detail: "Expected JSON with message and context",
      },
      { status: 400 },
    );
  }

  if (
    !body.message ||
    typeof body.message !== "string" ||
    body.message.trim() === ""
  ) {
    return NextResponse.json(
      {
        error: "missing_message",
        detail: "message field is required and must be a non-empty string",
      },
      { status: 400 },
    );
  }

  if (!body.context || typeof body.context.mode !== "string") {
    return NextResponse.json(
      { error: "missing_context", detail: "context.mode is required" },
      { status: 400 },
    );
  }

  // 2. Compose system prompt from context
  const systemPrompt = composeSystemPrompt(body.context);

  // 3. Call Groq with streaming enabled
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "missing_api_key", detail: "GROQ_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let groqResponse: Response;

  try {
    groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen/qwen3-32b",
          max_tokens: 512,
          temperature: 0.7,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: body.message },
          ],
        }),
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[chat] Groq fetch failed:", message);
    return NextResponse.json(
      { error: "provider_error", detail: message },
      { status: 500 },
    );
  }

  if (!groqResponse.ok) {
    const errorText = await groqResponse.text().catch(() => "(unreadable)");
    console.error(`[chat] Groq returned ${groqResponse.status}:`, errorText);

    if (groqResponse.status === 429) {
      return NextResponse.json(
        {
          error: "rate_limited",
          detail: "AI provider rate limit reached — try again shortly",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "provider_error",
        detail: `Groq returned ${groqResponse.status}`,
      },
      { status: 500 },
    );
  }

  // 4. Transform Groq's SSE stream into a plain text stream
  //
  // Groq streams Server-Sent Events in OpenAI format:
  //   data: {"choices":[{"delta":{"content":"hello"}}]}
  //   data: [DONE]
  //
  // We parse each line, extract the content delta, and forward
  // raw text to the client. This keeps the client-side useStream
  // hook simple — it just reads text, no SSE parsing needed.

  const groqBody = groqResponse.body;
  if (!groqBody) {
    return NextResponse.json(
      { error: "empty_stream", detail: "Groq returned an empty response body" },
      { status: 500 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqBody.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines from the buffer
          const lines = buffer.split("\n");

          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines and SSE comments
            if (!trimmed || trimmed.startsWith(":")) continue;

            // Strip the "data: " prefix
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);

            // End of stream sentinel
            if (data === "[DONE]") {
              controller.close();
              return;
            }

            // Parse the JSON delta
            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{
                  delta?: { content?: string };
                  finish_reason?: string | null;
                }>;
              };

              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }

              // Some providers signal end via finish_reason
              if (parsed.choices?.[0]?.finish_reason === "stop") {
                controller.close();
                return;
              }
            } catch {
              // Malformed JSON in a single chunk — skip and continue
              // This can happen with keep-alive pings or partial chunks
            }
          }
        }

        // Flush any remaining buffer content
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ") && trimmed.slice(6) !== "[DONE]") {
            try {
              const parsed = JSON.parse(trimmed.slice(6)) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            } catch {
              // Ignore malformed final chunk
            }
          }
        }

        controller.close();
      } catch (err) {
        console.error("[chat] Stream read error:", err);
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no", // Disable nginx buffering on Vercel
    },
  });
}
