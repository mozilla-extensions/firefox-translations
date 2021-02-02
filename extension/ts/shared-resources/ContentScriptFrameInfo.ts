/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { captureExceptionWithExtras } from "./ErrorReporting";
import { nanoid } from "nanoid";
import { FrameInfo } from "./types/bergamot.types";

export class ContentScriptFrameInfo {
  private backgroundContextPort: Port;
  constructor() {
    // console.debug("ContentScriptFrameInfo: Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-content-script-frame-info",
    });
  }
  async getCurrentFrameInfo(): Promise<FrameInfo> {
    return new Promise((resolve, reject) => {
      const requestId = nanoid();
      const resultsMessageListener = async (m: {
        requestId: string;
        frameInfo: FrameInfo;
      }) => {
        if (m.frameInfo) {
          const { frameInfo } = m;
          if (m.requestId !== requestId) {
            return;
          }
          // console.debug("ContentScriptFrameInfo received results", {frameInfo});
          this.backgroundContextPort.onMessage.removeListener(
            resultsMessageListener,
          );
          resolve(frameInfo);
          return null;
        }
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
        reject({ m });
      };
      this.backgroundContextPort.onMessage.addListener(resultsMessageListener);
      this.backgroundContextPort.postMessage({
        requestId,
      });
    });
  }
}
