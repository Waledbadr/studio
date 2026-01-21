// Polyfill for Edge/browser runtimes where `setImmediate` is not available.
// bcryptjs uses setImmediate internally; mapping it to setTimeout(0) is sufficient.

if (typeof (globalThis as any).setImmediate !== 'function') {
  (globalThis as any).setImmediate = (cb: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(cb, 0, ...args);
}

export {};
