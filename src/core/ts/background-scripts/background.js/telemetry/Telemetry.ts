/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from "@mozilla/glean/webext";
import { custom } from "./generated/pings";
import { config } from "../../../config";
import {
  modelLoadTime,
  translationTime,
  wordsPerSecond,
} from "./generated/performance";
import { fromLang, toLang } from "./generated/metadata";
import {
  closed,
  changeLang,
  neverTranslateSite,
  translate,
  // displayed,
  // neverTranslateLang,
  // notNow,
} from "./generated/infobar";
import { nanoid } from "nanoid";

export class Telemetry {
  constructor() {
    const appId = config.telemetryAppId;
    Glean.initialize(appId, true, {
      debug: { logPings: config.telemetryDebugMode },
    });
    console.info(
      `Telemetry: initialization completed with application ID ${appId}.`,
    );
  }

  public onSelectTranslateFrom(tabId: number) {
    changeLang.record();
    this.submit();
  }

  public onSelectTranslateTo(tabId: number) {
    changeLang.record();
    this.submit();
  }

  public onInfoBarClosed(tabId: number) {
    closed.record();
    this.submit();
  }

  public onNeverTranslateThisSite(tabId: number) {
    neverTranslateSite.record();
    this.submit();
  }

  public onTranslateButtonPressed(tabId: number, from: string, to: string) {
    fromLang.set(from);
    toLang.set(to);
    translate.record();
    this.submit();
  }

  public onShowOriginalButtonPressed(tabId: number) {
    // TODO?
  }

  public onShowTranslatedButtonPressed(tabId: number) {
    // TODO?
  }

  /**
   * A translation attempt starts when a translation is requested in a
   * specific tab and ends when all translations in that tab has completed
   */
  public async onTranslationAttemptConcluded(
    from: string,
    to: string,
    $modelLoadTime: number,
    $translationTime: number,
    $wordsPerSecond: number,
    beforeSubmit: () => Promise<void> = undefined,
  ) {
    fromLang.set(from);
    toLang.set(to);
    modelLoadTime.set(String($modelLoadTime));
    translationTime.set(String($translationTime));
    wordsPerSecond.set(String($wordsPerSecond));
    if (beforeSubmit) {
      await beforeSubmit();
    }
    this.submit();
  }

  /**
   * Submits all collected metrics in a custom ping.
   */
  public submit = () => {
    try {
      // TODO: Always include the fx telemetry id string metric in pings
      custom.submit();
      console.info("Telemetry: the ping is submitted.");
    } catch (err) {
      // telemetry error shouldn't crash the app
      console.error(`Telemetry: Error. The ping was not submitted.`, err);
    }
  };
}

type GleanTransaction = () => Promise<void>;

/* eslint-disable no-unused-vars, no-shadow */
// TODO: update typescript-eslint when support for this kind of declaration is supported
interface PendingGleanTransaction<T> {
  resolve: (T) => void;
}
/* eslint-enable no-unused-vars, no-shadow */

interface GleanRecording {
  gleanTransaction: GleanTransaction;
  id?: string;
}

/**
 * Class responsible for recording Glean telemetry synchronously
 */
export class GleanRecorder {
  private processing: boolean;
  private queue: GleanRecording[] = [];
  private pendingTransactions: Map<
    string,
    PendingGleanTransaction<void>
  > = new Map();

  async processQueue() {
    if (this.processing) {
      return;
    }
    this.processing = true;
    while (this.queue.length) {
      console.info(
        `Processing Glean.js recorder queue of ${this.queue.length} recordings`,
      );
      await this.processNextItemInQueue();
    }
    this.processing = false;
  }

  async processNextItemInQueue() {
    // Shift the next request off the queue
    const { gleanTransaction, id } = this.queue.shift();
    // Record the event
    try {
      const results = await gleanTransaction();
      console.debug(
        `Telemetry: metric recorded, id: ${id}, queue size: ${this.queue.length}`,
      );
      // Resolve the corresponding promise
      this.pendingTransactions.get(id).resolve(results);
    } catch (err) {
      // telemetry error shouldn't crash the app
      console.error(`Telemetry: Error. a metric was not recorded.`, err);
      // Resolve the corresponding promise
      this.pendingTransactions.get(id).resolve(void 0);
    }
  }

  transaction(gleanTransaction: GleanTransaction): Promise<void> {
    const id = nanoid();
    const promise: Promise<void> = new Promise(resolve => {
      this.pendingTransactions.set(id, { resolve });
      if (this.processing) {
        console.info(
          `Glean transaction will be processed after ${this.queue.length +
            1} already queued transactions`,
        );
      } else {
        console.info(`Queued Glean transaction`);
      }
      this.queue.push({ gleanTransaction, id });
    });

    // Kick off queue processing async
    /* eslint-disable no-unused-vars */
    this.processQueue().then(_r => void 0);
    /* eslint-enable no-unused-vars */

    // Return the promise that resolves when the in-scope transaction resolves
    return promise;
  }
}

// Expose singleton instances
export const telemetry = new Telemetry();
export const gleanRecorder = new GleanRecorder();
