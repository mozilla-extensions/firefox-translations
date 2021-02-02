/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import {
  ModelAutoTypeCheckingMode,
  registerRootStore,
  setGlobalConfig,
} from "mobx-keystone";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";

// enable runtime data checking even in production mode
setGlobalConfig({
  modelAutoTypeChecking: ModelAutoTypeCheckingMode.AlwaysOn,
});
export function createBackgroundContextRootStore(): ExtensionState {
  // the parameter is the initial data for the model
  const rootStore = new ExtensionState({});

  // recommended by mobx-keystone (allows the model hook `onAttachedToRootStore` to work and other goodies)
  registerRootStore(rootStore);

  return rootStore;
}
