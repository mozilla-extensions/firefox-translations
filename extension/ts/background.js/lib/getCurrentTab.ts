import { browser, Tabs } from "webextension-polyfill-ts";
import Tab = Tabs.Tab;

export const getCurrentTab = async (): Promise<Tab | null> => {
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs.length > 0) {
    return activeTabs[0];
  }
  return null;
};
