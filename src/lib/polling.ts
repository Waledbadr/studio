export type Poller = {
  start: () => { stop: () => void };
  stop: () => void;
  refresh: () => Promise<void>;
};

export function createPoller<T = any>(
  fetcher: () => Promise<T>,
  onData: (data: T) => void,
  options?: {
    intervalMs?: number;
    onError?: (err: any) => void;
    immediate?: boolean;
  }
) {
  const intervalMs = options?.intervalMs ?? 7000;
  const onError = options?.onError;
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const runOnce = async () => {
    try {
      const data = await fetcher();
      try { onData(data); } catch (e) { /* swallow onData errors */ }
    } catch (err) {
      if (onError) onError(err);
      else console.error('Polling error', err);
    }
  };

  return {
    start() {
      if (running) return { stop };
      running = true;
      if (options?.immediate ?? true) {
        // fire-and-forget; caller handles state
        void runOnce();
      }
      timer = setInterval(() => { void runOnce(); }, intervalMs);
      function stop() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        running = false;
      }
      return { stop };
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      running = false;
    },
    async refresh() {
      await runOnce();
    }
  } as Poller;
}
