/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { browser } from "webextension-polyfill-ts";
import { nanoid } from "nanoid";

// Since Emscripten can handle heap growth, but not heap shrinkage, we
// need to refresh the worker after we've loaded/processed large models/translations
// in order to prevent unnecessary resident memory growth.
//
// These values define the cut-off estimated heap growth size and the idle
// timeout (in milliseconds) before destroying a worker. Once the heap growth
// is estimated to have exceeded a certain size, the worker is marked for
// destruction, and is terminated as soon as it has been idle for the
// given timeout.
//
// TODO: Update to reflect relevant checks for translation-related heap growth
// const FOO_LIMIT = X * 1024 * 1024;
const IDLE_TIMEOUT = 10 * 1000;

const WORKER_URL = browser.runtime.getURL(`wasm/bergamot-translator-wasm.js`);

interface WorkerMessage {
  requestId: string;
}

// TODO: Update to reflect final interface
// (The temporary interface below is loosely based on a combination of marian-decoder cli and yaml config options)
export interface TranslationConfigurationParams {
  modelBinaries?: string[];
  vocabs?: string[];
  shortlists?: string[];
  beamSize?: number;
  normalize?: number;
  wordPenalty?: number;
  miniBatch?: number;
  maxiBatch?: number;
  maxiBatchSort?: string;
  workspace?: number;
  maxLengthFactor?: number;
  skipCost?: true;
  cpuThreads?: number;
  gemmPrecision?: "int8" | "int8shift" | "int8shiftAlphaAll";
}

export interface LoadModelParams {
  translationConfigurationParams: TranslationConfigurationParams;
}

interface LoadModelRequestWorkerMessage extends WorkerMessage {
  type: "loadModel";
  loadModelParams: LoadModelParams;
}

export interface LoadModelResults {
  alignmentIsSupported: boolean;
}

interface LoadModelResultsWorkerMessage extends WorkerMessage {
  type: "loadModelResults";
  loadModelResults: LoadModelResults;
}

export interface TranslateParams {
  texts: string[];
}

interface TranslateRequestWorkerMessage extends WorkerMessage {
  type: "translate";
  translateParams: TranslateParams;
}

export interface TranslationResults {
  originalTexts: string[];
  translatedTexts: string[];
}

interface PendingRequest<T> {
  resolve: (T) => void;
}

interface TranslationResultsWorkerMessage extends WorkerMessage {
  type: "translationResults";
  translationResults: TranslationResults;
}

type IncomingWorkerMessage =
  | LoadModelResultsWorkerMessage
  | TranslationResultsWorkerMessage;

class WorkerManager {
  private pendingRequests: Map<
    string,
    PendingRequest<TranslationResults | LoadModelResults>
  > = new Map();
  // private estimatedHeapGrowth: number;

  async loadModel(loadModelParams: LoadModelParams): Promise<LoadModelResults> {
    const worker = await this.workerReady;
    const loadModelResults: LoadModelResults = await new Promise(resolve => {
      const requestId = nanoid();
      this.pendingRequests.set(requestId, { resolve });
      const loadModelRequestWorkerMessage: LoadModelRequestWorkerMessage = {
        type: "loadModel",
        requestId,
        loadModelParams,
      };
      worker.postMessage(loadModelRequestWorkerMessage);
    });
    // TODO: Update estimatedHeapGrowth
    this.checkEstimatedHeapGrowth();
    return loadModelResults;
  }

  async translate(
    translateParams: TranslateParams,
  ): Promise<TranslationResults> {
    const worker = await this.workerReady;
    const translationResults: TranslationResults = await new Promise(
      resolve => {
        const requestId = nanoid();
        this.pendingRequests.set(requestId, { resolve });
        const translateRequestWorkerMessage: TranslateRequestWorkerMessage = {
          type: "translate",
          requestId,
          translateParams,
        };
        worker.postMessage(translateRequestWorkerMessage);
      },
    );
    // TODO: Update estimatedHeapGrowth
    this.checkEstimatedHeapGrowth();
    return translationResults;
  }

  /**
   * Triggers after we have our asynchronous result from the worker.
   */
  checkEstimatedHeapGrowth() {
    /*
    // Determine if our input was large enough to trigger heap growth,
    // or if we're already waiting to destroy the worker when it's
    // idle. If so, schedule termination after the idle timeout.
    if (this.estimatedHeapGrowth >= FOO_LIMIT || this._idleTimeout != null) {
      this.flushWorker();
    }
    */
  }

  onLoadModelResults(
    loadModelResultsWorkerMessage: LoadModelResultsWorkerMessage,
  ) {
    const { requestId, loadModelResults } = loadModelResultsWorkerMessage;
    this.pendingRequests.get(requestId).resolve(loadModelResults);
  }

  onTranslateWorkerResult(
    translationResultsWorkerMessage: TranslationResultsWorkerMessage,
  ) {
    const { requestId, translationResults } = translationResultsWorkerMessage;
    this.pendingRequests.get(requestId).resolve(translationResults);
  }

  private _worker;
  private _workerReadyPromise;

  get workerReady() {
    if (!this._workerReadyPromise) {
      this._workerReadyPromise = new Promise(resolve => {
        let worker = new Worker(WORKER_URL);
        worker.onmessage = (msg: { data: "ready" | IncomingWorkerMessage }) => {
          console.log("Incoming message from worker", { msg });
          if (msg.data === "ready") {
            resolve(worker);
          } else if (msg.data.type === "loadModelResults") {
            this.onLoadModelResults(msg.data);
          } else if (msg.data.type === "translationResults") {
            this.onTranslateWorkerResult(msg.data);
          } else {
            throw new Error("Unknown worker message payload");
          }
        };
        this._worker = worker;
      });
    }

    return this._workerReadyPromise;
  }

  // Holds the ID of the current pending idle cleanup setTimeout.
  private _idleTimeout: any = null;

  // Schedule the current worker to be terminated after the idle timeout.
  flushWorker() {
    if (this._idleTimeout != null) {
      clearTimeout(this._idleTimeout);
    }

    this._idleTimeout = setTimeout(this._flushWorker.bind(this), IDLE_TIMEOUT);
  }

  // Immediately terminate the worker, as long as there no pending
  // results. Otherwise, reschedule termination until after the next
  // idle timeout.
  _flushWorker() {
    if (this.pendingRequests.size) {
      this.flushWorker();
    } else {
      if (this._worker) {
        this._worker.terminate();
      }

      this._worker = null;
      this._workerReadyPromise = null;
      this._idleTimeout = null;
    }
  }
}

const workerManager = new WorkerManager();

export const BergamotTranslatorAPI = {
  availableLanguagePairs: [],
  async translate(
    texts: string[],
    from: string,
    to: string,
  ): Promise<TranslationResults> {
    const languagePair = `${from}${to}`;
    if (!this.availableLanguagePairs[languagePair]) {
      const loadModelParams = {
        translationConfigurationParams: {},
      };
      this.availableLanguagePairs[languagePair] = await workerManager.loadModel(
        loadModelParams,
      );
    }
    const translateParams: TranslateParams = {
      texts,
    };
    return workerManager.translate(translateParams);
  },
};
