// lib/ai/client.ts
//
// Single entry point for all AI text generation in kotoba.
// Uses Groq API with Qwen3-32B (best for Japanese).
// Rate limit warnings help you monitor free tier usage.

export interface GenerateOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
}

// ─── Rate limit helpers ────────────────────────────────────────────────

interface GroqRateLimitInfo {
  remainingRequestsDay: number | null;
  limitRequestsDay: number | null;
  remainingTokensMinute: number | null;
  limitTokensMinute: number | null;
}

function readGroqRateLimitHeaders(response: Response): GroqRateLimitInfo {
  const parse = (header: string): number | null => {
    const value = response.headers.get(header);
    if (!value) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  return {
    remainingRequestsDay: parse("x-ratelimit-remaining-requests"),
    limitRequestsDay: parse("x-ratelimit-limit-requests"),
    remainingTokensMinute: parse("x-ratelimit-remaining-tokens"),
    limitTokensMinute: parse("x-ratelimit-limit-tokens"),
  };
}

function warnIfLow(info: GroqRateLimitInfo): void {
  const {
    remainingRequestsDay,
    limitRequestsDay,
    remainingTokensMinute,
    limitTokensMinute,
  } = info;

  if (
    remainingRequestsDay !== null &&
    limitRequestsDay !== null &&
    limitRequestsDay > 0
  ) {
    const pct = remainingRequestsDay / limitRequestsDay;
    if (remainingRequestsDay === 0) {
      console.error(
        "[groq] ⛔ Daily request limit reached. Quota resets in 24h.",
      );
    } else if (pct < 0.05) {
      console.warn(
        `[groq] 🔴 Daily requests critically low: ${remainingRequestsDay} / ${limitRequestsDay} (${Math.round(pct * 100)}%)`,
      );
    } else if (pct < 0.2) {
      console.warn(
        `[groq] 🟡 Daily requests running low: ${remainingRequestsDay} / ${limitRequestsDay} (${Math.round(pct * 100)}%)`,
      );
    }
  }

  if (
    remainingTokensMinute !== null &&
    limitTokensMinute !== null &&
    limitTokensMinute > 0
  ) {
    const pct = remainingTokensMinute / limitTokensMinute;
    if (remainingTokensMinute === 0) {
      console.warn(
        "[groq] 🟠 Per-minute token limit reached. Next request may be rate limited (429).",
      );
    } else if (pct < 0.2) {
      console.warn(
        `[groq] 🟡 Per-minute tokens low: ${remainingTokensMinute} / ${limitTokensMinute} TPM (${Math.round(pct * 100)}%)`,
      );
    }
  }
}

// ─── Groq provider ────────────────────────────────────────────────────

async function generateWithGroq(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Get a free key at console.groq.com and add to .env.local",
    );
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        max_tokens: options.maxTokens ?? 1200,
        temperature: 0.7,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.prompt },
        ],
      }),
    },
  );

  const rateLimitInfo = readGroqRateLimitHeaders(response);
  warnIfLow(rateLimitInfo);

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      throw new Error(
        `Groq rate limit exceeded (429).${retryAfter ? ` Retry after ${retryAfter}s.` : ""} Check quota at console.groq.com.`,
      );
    }
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(
      `Groq request failed: ${response.status} ${response.statusText}\n${body}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message: string };
  };
  if (data.error) throw new Error(`Groq error: ${data.error.message}`);
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) {
    console.error(
      "[groq] Empty response. Full API response:",
      JSON.stringify(data, null, 2),
    );
    throw new Error("Groq returned an empty response");
  }

  // ✅ IMPORTANT: Return the result object
  return { text };
}

// ─── Public interface ─────────────────────────────────────────────────

export async function generateText(
  options: GenerateOptions,
): Promise<GenerateResult> {
  return generateWithGroq(options);
}
