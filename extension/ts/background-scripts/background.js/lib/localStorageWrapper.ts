import { browser } from "webextension-polyfill-ts";

export const localStorageWrapper = {
  get: browser.storage.local.get,
  set: browser.storage.local.set,
};
