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
  let visibilityHandlerAttached = false;
  let visibilityHandler: ((this: Document, ev: Event) => any) | null = null;

  const runOnce = async () => {
    try {
      try {
        // Avoid background polling when the tab is hidden; it wastes quotas.
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      } catch {
        // ignore
      }
      const data = await fetcher();
      try { onData(data); } catch (e) { /* swallow onData errors */ }
    } catch (err) {
      if (onError) onError(err);
      else console.error('Polling error', err);
    }
  };

  const ensureVisibilityHandler = () => {
    if (visibilityHandlerAttached) return;
    if (typeof document === 'undefined') return;
    visibilityHandlerAttached = true;
    visibilityHandler = () => {
      if (!running) return;
      if (document.visibilityState === 'visible') {
        void runOnce();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  };

  const teardownVisibilityHandler = () => {
    if (!visibilityHandlerAttached) return;
    if (typeof document === 'undefined') return;
    if (visibilityHandler) {
      try { document.removeEventListener('visibilitychange', visibilityHandler); } catch { }
    }
    visibilityHandler = null;
    visibilityHandlerAttached = false;
  };

  return {
    start() {
      if (running) return { stop };
      running = true;
      ensureVisibilityHandler();
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
        teardownVisibilityHandler();
      }
      return { stop };
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      running = false;
      teardownVisibilityHandler();
    },
    async refresh() {
      await runOnce();
    }
  } as Poller;
}
