/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LocalStorageWrapper } from "./Store";

let memoryStore = {};

export const mockLocalStorage: LocalStorageWrapper & { reset: () => void } = {
  get: async (keys): Promise<{ [s: string]: any }> => {
    if (typeof keys === "string") {
      keys = [keys];
    } else if (keys.length !== undefined) {
      // do nothing
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
