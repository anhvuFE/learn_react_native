// Hermes (the default JS engine on RN 0.74) is missing some ES2021+ globals
// that newer libraries (e.g. Apollo Client v3.14+) rely on for memory hygiene.
// Stubs below are no-ops — they prevent crashes; memory cleanup just won't
// be as aggressive as on V8/JSC.

const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.FinalizationRegistry === "undefined") {
  g.FinalizationRegistry = class FinalizationRegistryShim<T> {
    constructor(_callback: (heldValue: T) => void) {
      void _callback;
    }
    register(_target: object, _heldValue: T, _unregisterToken?: object): void {
      void _target;
      void _heldValue;
      void _unregisterToken;
    }
    unregister(_unregisterToken: object): void {
      void _unregisterToken;
    }
  };
}

if (typeof g.WeakRef === "undefined") {
  g.WeakRef = class WeakRefShim<T extends object> {
    private value: T;
    constructor(target: T) {
      this.value = target;
    }
    deref(): T | undefined {
      return this.value;
    }
  };
}
