/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { browser, Tabs } from "webextension-polyfill-ts";
import Tab = Tabs.Tab;

export const getCurrentTab = async (): Promise<Tab | null> => {
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs.length) {
    return activeTabs[0];
  }
  return null;
};
