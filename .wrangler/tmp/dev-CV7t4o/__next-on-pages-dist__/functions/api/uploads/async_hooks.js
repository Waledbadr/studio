// Generated shim for Cloudflare Pages dev.
// Provides minimal AsyncLocalStorage used by Next/next-on-pages middleware bundles.

const GlobalALS = globalThis.AsyncLocalStorage;

export const AsyncLocalStorage = GlobalALS ?? class AsyncLocalStorage {
  constructor() {
    this._store = undefined;
  }

  disable() {
    this._store = undefined;
  }

  getStore() {
    return this._store;
  }

  enterWith(store) {
    this._store = store;
  }

  run(store, callback, ...args) {
    const prev = this._store;
    this._store = store;
    try {
      return callback(...args);
    } finally {
      this._store = prev;
    }
  }

  exit(callback, ...args) {
    const prev = this._store;
    this._store = undefined;
    try {
      return callback(...args);
    } finally {
      this._store = prev;
    }
  }

  static bind(fn) {
    return fn;
  }
};
