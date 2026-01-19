// Polyfill for Edge runtime where `setImmediate` is not available.
// bcryptjs uses setImmediate internally; mapping it to setTimeout(0) is sufficient.

declare global {
  // eslint-disable-next-line no-var
  var setImmediate: ((callback: (...args: any[]) => void, ...args: any[]) => any) | undefined;
}

if (typeof (globalThis as any).setImmediate !== 'function') {
  (globalThis as any).setImmediate = (cb: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(cb, 0, ...args);
}

export {};
