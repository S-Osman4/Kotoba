// Simple external store for Groq rate‑limit info.
// Components/hooks can subscribe via useSyncExternalStore.

interface GroqRateInfo {
  remainingTokensMinute: number | null;
  limitTokensMinute: number | null;
}

let state: GroqRateInfo = {
  remainingTokensMinute: null,
  limitTokensMinute: null,
};

const listeners = new Set<() => void>();

export function setGroqRateInfo(info: GroqRateInfo) {
  state = { ...info };
  listeners.forEach((l) => l());
}

export function getGroqRateInfo(): GroqRateInfo {
  return state;
}

export function subscribeToGroqRate(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
