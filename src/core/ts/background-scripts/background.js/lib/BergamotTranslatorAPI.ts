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

const WORKER_URL = browser.runtime.getURL(`wasm/bergamot-translator-worker.js`);

interface WorkerMessage {
  requestId: string;
}

export interface LoadModelParams {
  from: string;
  to: string;
}

interface LoadModelRequestWorkerMessage extends WorkerMessage {
  type: "loadModel";
  loadModelParams: LoadModelParams;
}

export interface LoadModelResults {
  alignmentIsSupported: boolean;
  modelLoadWallTimeMs: number;
}

interface LoadModelResultsWorkerMessage extends WorkerMessage {
  type: "loadModelResults";
  loadModelResults: LoadModelResults;
}

export interface TranslateParams {
  texts: string[];
  loadModelParams: LoadModelParams;
}

interface TranslateRequestWorkerMessage extends WorkerMessage {
  type: "translate";
  translateParams: TranslateParams;
}

export interface TranslationResults {
  originalTexts: string[];
  translatedTexts: string[];
  qeAnnotatedTranslatedTexts?: string[];
}

/* eslint-disable no-unused-vars, no-shadow */
// TODO: update typescript-eslint when support for this kind of declaration is supported
interface PendingRequest<T> {
  resolve: (T) => void;
}
/* eslint-enable no-unused-vars, no-shadow */

interface TranslationResultsWorkerMessage extends WorkerMessage {
  type: "translationResults";
  translationResults: TranslationResults;
}

interface LogWorkerMessage extends WorkerMessage {
  type: "log";
  message: string;
}

type IncomingWorkerMessage =
  | LoadModelResultsWorkerMessage
  | TranslationResultsWorkerMessage
  | LogWorkerMessage;

/**
 * Class responsible for instantiating and communicating between this script
 * and the translation worker process.
 */
class WorkerManager {
  private pendingRequests: Map<
    string,
    PendingRequest<TranslationResults | LoadModelResults>
  > = new Map();
  // private estimatedHeapGrowth: number;

  async loadModel(
    loadModelRequestWorkerMessage: LoadModelRequestWorkerMessage,
  ): Promise<LoadModelResults> {
    const worker = await this.workerReady;
    const loadModelResults: LoadModelResults = await new Promise(resolve => {
      const { requestId } = loadModelRequestWorkerMessage;
      this.pendingRequests.set(requestId, { resolve });
      worker.postMessage(loadModelRequestWorkerMessage);
    });
    // TODO: Update estimatedHeapGrowth
    this.checkEstimatedHeapGrowth();
    return loadModelResults;
  }

  async translate(
    translateRequestWorkerMessage: TranslateRequestWorkerMessage,
  ): Promise<TranslationResults> {
    const worker = await this.workerReady;
    const translationResults: TranslationResults = await new Promise(
      resolve => {
        const { requestId } = translateRequestWorkerMessage;
        this.pendingRequests.set(requestId, { resolve });
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
    if (this.estimatedHeapGrowth >= FOO_LIMIT || this._idleTimeout !== null) {
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
        const worker = new Worker(WORKER_URL);
        worker.onmessage = (msg: { data: "ready" | IncomingWorkerMessage }) => {
          console.log("Incoming message from worker", { msg });
          if (msg.data === "ready") {
            resolve(worker);
          } else if (msg.data.type === "loadModelResults") {
            this.onLoadModelResults(msg.data);
          } else if (msg.data.type === "translationResults") {
            this.onTranslateWorkerResult(msg.data);
          } else if (msg.data.type === "log") {
            console.log(`Relayed log message from worker: ${msg.data.message}`);
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
    if (this._idleTimeout !== null) {
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

interface TranslationPerformanceStats {
  seconds: number;
  textCount: number;
  wordCount: number;
  characterCount: number;
  wordsPerSecond: number;
  charactersPerSecond: number;
}

const translationPerformanceStats = (
  texts: string[],
  translationWallTimeMs: number,
): TranslationPerformanceStats => {
  const seconds = translationWallTimeMs / 1000;
  const textCount = texts.length;
  const wordCount = texts
    .map(
      text =>
        text
          .trim()
          .split(" ")
          .filter(word => word.trim() !== "").length,
    )
    .reduce((a, b) => a + b, 0);
  const characterCount = texts
    .map(text => text.trim().length)
    .reduce((a, b) => a + b, 0);
  const wordsPerSecond = Math.round(wordCount / seconds);
  const charactersPerSecond = Math.round(characterCount / seconds);
  return {
    seconds,
    textCount,
    wordCount,
    characterCount,
    wordsPerSecond,
    charactersPerSecond,
  };
};

export interface ModelLoadedEventData {
  requestId: string;
  loadModelParams: LoadModelParams;
  loadModelResults: LoadModelResults;
}

export interface TranslationFinishedEventData {
  requestId: string;
  translationWallTimeMs: number;
  originalTextsTranslationPerformanceStats: TranslationPerformanceStats;
  translatedTextsTranslationPerformanceStats: TranslationPerformanceStats;
}

/**
 * Class responsible for sending translations requests to the translation worker process
 * in a compatible and somewhat efficient order.
 * Emits events that can be used to track translation progress at a low level.
 */
class TranslationRequestDispatcher extends EventTarget {
  private processing: boolean;
  private loadedLanguagePair: string;
  private queuedRequests: TranslateRequestWorkerMessage[] = [];
  private queuedRequestsByRequestId: Map<
    string,
    PendingRequest<TranslationResults>
  > = new Map();

  async processQueue() {
    if (this.processing) {
      return;
    }
    this.processing = true;
    while (this.queuedRequests.length) {
      console.info(
        `Processing translation request queue of ${this.queuedRequests.length} requests`,
      );
      await this.processNextItemInQueue();
    }
    this.processing = false;
  }

  async processNextItemInQueue() {
    // Shift the next request off the queue
    const translateRequestWorkerMessage = this.queuedRequests.shift();
    const { translateParams, requestId } = translateRequestWorkerMessage;

    const { loadModelParams } = translateParams;
    const { from, to } = loadModelParams;
    const languagePair = `${from}${to}`;

    // First check if we need to load a model
    if (!this.loadedLanguagePair || this.loadedLanguagePair !== languagePair) {
      const loadModelRequestWorkerMessage: LoadModelRequestWorkerMessage = {
        type: "loadModel",
        requestId,
        loadModelParams,
      };
      const loadModelResults = await workerManager.loadModel(
        loadModelRequestWorkerMessage,
      );
      this.loadedLanguagePair = languagePair;
      const modelLoadedEventData: ModelLoadedEventData = {
        requestId,
        loadModelParams,
        loadModelResults,
      };
      this.dispatchEvent(
        new CustomEvent("modelLoaded", {
          detail: modelLoadedEventData,
        }),
      );
    }

    // Send the translation request
    const start = performance.now();
    const translationResults = await workerManager.translate(
      translateRequestWorkerMessage,
    );

    // Summarize performance stats
    const end = performance.now();
    const translationWallTimeMs = end - start;
    const originalTextsTranslationPerformanceStats = translationPerformanceStats(
      translationResults.originalTexts,
      translationWallTimeMs,
    );
    const translatedTextsTranslationPerformanceStats = translationPerformanceStats(
      translationResults.translatedTexts,
      translationWallTimeMs,
    );
    const translationFinishedEventData: TranslationFinishedEventData = {
      requestId,
      translationWallTimeMs,
      originalTextsTranslationPerformanceStats,
      translatedTextsTranslationPerformanceStats,
    };
    this.dispatchEvent(
      new CustomEvent("translationFinished", {
        detail: translationFinishedEventData,
      }),
    );

    // Resolve the translation request
    this.queuedRequestsByRequestId.get(requestId).resolve(translationResults);
  }

  translate(
    requestId: string,
    texts: string[],
    from: string,
    to: string,
  ): Promise<TranslationResults> {
    const loadModelParams = {
      from,
      to,
    };
    const translateParams: TranslateParams = {
      texts,
      loadModelParams,
    };
    const requestPromise: Promise<TranslationResults> = new Promise(resolve => {
      this.queuedRequestsByRequestId.set(requestId, { resolve });
      const translateRequestWorkerMessage: TranslateRequestWorkerMessage = {
        type: "translate",
        requestId,
        translateParams,
      };
      if (this.processing) {
        console.info(
          `Queued translation request to be processed after ${this
            .queuedRequests.length + 1} already queued requests`,
        );
      } else {
        console.info(`Queued translation request`);
      }
      this.queuedRequests.push(translateRequestWorkerMessage);
    });
    // Kick off queue processing async
    /* eslint-disable no-unused-vars */
    this.processQueue().then(_r => void 0);
    /* eslint-enable no-unused-vars */
    // Return the promise that resolves when the in-scope translation request resolves
    return requestPromise;
  }
}

const translationRequestDispatcher = new TranslationRequestDispatcher();

/**
 * Provide a simple public interface
 */
export const BergamotTranslatorAPI = {
  async translate(
    texts: string[],
    from: string,
    to: string,
    onModelLoaded: (modelLoadedEventData: ModelLoadedEventData) => void,
    onTranslationFinished: (
      translationFinishedEventData: TranslationFinishedEventData,
    ) => void,
  ): Promise<TranslationResults> {
    const requestId = nanoid();
    const modelLoadedListener = (
      e: CustomEvent & { detail: ModelLoadedEventData },
    ) => {
      // console.debug('Listener received "modelLoaded".', e.detail);
      if (e.detail.requestId !== requestId) {
        return;
      }
      translationRequestDispatcher.removeEventListener(
        "modelLoaded",
        modelLoadedListener,
      );

      const { loadModelResults } = e.detail;
      const languagePair = `${from}${to}`;
      const { modelLoadWallTimeMs } = loadModelResults;
      console.info(
        `BergamotTranslatorAPI: Model ${languagePair} loaded in ${modelLoadWallTimeMs /
          1000} secs`,
      );

      onModelLoaded(e.detail);
    };
    const translationFinishedListener = (
      e: CustomEvent & { detail: TranslationFinishedEventData },
    ) => {
      // console.debug('Listener received "translationFinished".', e.detail);
      if (e.detail.requestId !== requestId) {
        return;
      }
      translationRequestDispatcher.removeEventListener(
        "translationFinished",
        translationFinishedListener,
      );

      const { originalTextsTranslationPerformanceStats } = e.detail;
      const {
        wordCount,
        seconds,
        wordsPerSecond,
      } = originalTextsTranslationPerformanceStats;

      console.info(
        `BergamotTranslatorAPI: Translation of ${texts.length} texts (wordCount ${wordCount}) took ${seconds} secs (${wordsPerSecond} words per second)`,
      );

      onTranslationFinished(e.detail);
    };
    try {
      // console.debug(`Adding listeners for request id ${requestId}`);
      translationRequestDispatcher.addEventListener(
        "modelLoaded",
        modelLoadedListener,
      );
      translationRequestDispatcher.addEventListener(
        "translationFinished",
        translationFinishedListener,
      );
      const requestPromise = translationRequestDispatcher.translate(
        requestId,
        texts,
        from,
        to,
      );
      const [translationResults] = await Promise.all([requestPromise]);
      return translationResults;
    } catch (error) {
      console.debug("TODO emit error event?", error);
      throw error;
    } finally {
      translationRequestDispatcher.removeEventListener(
        "modelLoaded",
        modelLoadedListener,
      );
      translationRequestDispatcher.removeEventListener(
        "translationFinished",
        translationFinishedListener,
      );
    }
  },
};
