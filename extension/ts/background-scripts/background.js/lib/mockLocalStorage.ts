import { LocalStorageWrapper } from "./Store";

let memoryStore = {};

export const mockLocalStorage: LocalStorageWrapper & { reset: () => void } = {
  get: async (keys): Promise<{ [s: string]: any }> => {
    if (typeof keys === "string") {
      keys = [keys];
    } else if (keys.length !== undefined) {
    } else if (typeof keys === "object") {
      keys = Object.keys(keys);
    }
    const _ = {};
    // @ts-ignore
    for (const key of keys) {
      _[key] = memoryStore[key];
    }
    return _;
  },
  set: async data => {
    memoryStore = { ...memoryStore, ...data };
  },
  reset: () => {
    memoryStore = {};
  },
};
