import { useSyncExternalStore } from "react";
import { getGroqRateInfo, subscribeToGroqRate } from "@/lib/groq-rate";

export function useGroqRate() {
  return useSyncExternalStore(subscribeToGroqRate, getGroqRateInfo);
}
