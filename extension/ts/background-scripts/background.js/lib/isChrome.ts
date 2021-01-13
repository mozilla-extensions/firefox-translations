import { browser } from "webextension-polyfill-ts";

export const isChrome = () => {
  return !browser.runtime.getBrowserInfo;
};
