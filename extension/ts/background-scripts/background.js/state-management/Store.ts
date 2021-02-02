/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { nanoid } from "nanoid";
import { browser, Storage } from "webextension-polyfill-ts";
import StorageArea = Storage.StorageArea;
import StorageAreaSetItemsType = Storage.StorageAreaSetItemsType;

export interface LocalStorageWrapper {
  get: StorageArea["get"];
  set: StorageArea["set"];
}

export interface ExtensionPreferences {
  enableErrorReporting: boolean;
  hidePrivacySummaryBanner: boolean;
  extensionInstallationErrorReportingId: string;
  extensionInstallationId: string;
  extensionVersion: string;
}

export class Store implements LocalStorageWrapper {
  public localStorageWrapper: LocalStorageWrapper;
  constructor(localStorageWrapper) {
    this.get = localStorageWrapper.get;
    this.set = localStorageWrapper.set;
  }
  get = async (
    keys?:
      | null
      | string
      | string[]
      | {
          [s: string]: any;
        },
  ): Promise<{
    [s: string]: any;
  }> => ({});
  set = async (items: StorageAreaSetItemsType): Promise<void> => {};

  initialExtensionPreferences = async (): Promise<ExtensionPreferences> => {
    return {
      enableErrorReporting: false,
      hidePrivacySummaryBanner: false,
      extensionInstallationErrorReportingId: "",
      extensionInstallationId: "",
      extensionVersion: "",
    };
  };

  /**
   * Returns a persistent unique identifier of the extension installation
   * sent with each report. Not related to the Firefox client id
   */
  extensionInstallationId = async () => {
    const { extensionInstallationId } = await this.get(
      "extensionInstallationId",
    );
    if (extensionInstallationId) {
      return extensionInstallationId;
    }
    const generatedId = nanoid();
    await this.set({ extensionInstallationId: generatedId });
    return generatedId;
  };

  /**
   * Returns a persistent unique identifier of the extension installation
   * sent with each error report. Not related to the Firefox client id
   * nor the extension installation id that identifies shared data.
   */
  extensionInstallationErrorReportingId = async () => {
    const { extensionInstallationErrorReportingId } = await this.get(
      "extensionInstallationErrorReportingId",
    );
    if (extensionInstallationErrorReportingId) {
      return extensionInstallationErrorReportingId;
    }
    const generatedId = nanoid();
    await this.set({ extensionInstallationErrorReportingId: generatedId });
    return generatedId;
  };

  getExtensionPreferences = async (): Promise<ExtensionPreferences> => {
    const { extensionPreferences } = await this.get("extensionPreferences");
    return {
      ...(await this.initialExtensionPreferences()),
      ...extensionPreferences,
      ...{
        // The following are not editable extension preferences, but attributes
        // that we want to display on the extension preferences dialog and/or
        // add as context in error reports
        extensionInstallationErrorReportingId: await this.extensionInstallationErrorReportingId(),
        extensionInstallationId: await this.extensionInstallationId(),
        extensionVersion: browser.runtime.getManifest().version,
      },
    };
  };

  setExtensionPreferences = async (
    extensionPreferences: ExtensionPreferences,
  ) => {
    await this.set({ extensionPreferences });
  };
}
