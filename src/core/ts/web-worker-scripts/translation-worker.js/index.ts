/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { addOnPreMain, Module } from "./bergamot-translator-worker";

import {
  ErrorWorkerMessage,
  LoadModelRequestWorkerMessage,
  LoadModelResultsWorkerMessage,
  ModelDownloadProgress,
  ModelDownloadProgressWorkerMessage,
  TranslateRequestWorkerMessage,
  TranslationResultsWorkerMessage,
} from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";
import {
  DownloadedModelFile,
  getBergamotModelsForLanguagePair,
} from "./getBergamotModelsForLanguagePair";

import { modelRegistry } from "../../config";

type IncomingBergamotTranslatorAPIMessage =
  | LoadModelRequestWorkerMessage
  | TranslateRequestWorkerMessage;

interface DownloadedModelFilesByType {
  lex: DownloadedModelFile;
  model: DownloadedModelFile;
  vocab: DownloadedModelFile;
}

addOnPreMain(function() {
  let model;

  const log = message => {
    postMessage({
      type: "log",
      message,
    });
  };

  /**
   * If we end up in a situation where we want to make sure that an instance is deleted
   * and the instance was in fact already deleted, then let that happen without throwing
   * a fatal error.
   *
   * @param instance
   */
  const safelyDeleteInstance = instance => {
    try {
      instance.delete();
    } catch (err) {
      if (
        err.name === "BindingError" &&
        err.message.includes("instance already deleted")
      ) {
        // ignore
        return;
      }
      throw err;
    }
  };

  /**
   * Automatically download the appropriate translation models, vocabularies and lexical shortlists if not already locally present
   */
  const downloadModel = async (
    from: string,
    to: string,
    bergamotModelsBaseUrl: string,
    onModelDownloadProgress: (
      modelDownloadProgress: ModelDownloadProgress,
    ) => void,
  ): Promise<DownloadedModelFilesByType> => {
    log(`downloadModel(${from}, ${to}, ${bergamotModelsBaseUrl})`);

    const languagePair = `${from}${to}`;

    const cache = await caches.open("bergamot-models");
    const downloadedModelFiles: DownloadedModelFile[] = await getBergamotModelsForLanguagePair(
      languagePair,
      bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
      onModelDownloadProgress,
    );

    const downloadedModelFilesByType: DownloadedModelFilesByType = {
      lex: undefined,
      model: undefined,
      vocab: undefined,
    };

    downloadedModelFiles.forEach(downloadedModelFile => {
      downloadedModelFilesByType[
        downloadedModelFile.type
      ] = downloadedModelFile;
    });

    return downloadedModelFilesByType;
  };

  const loadModel = async (
    from: string,
    to: string,
    bergamotModelsBaseUrl: string,
    onModelDownloadProgress: (
      modelDownloadProgress: ModelDownloadProgress,
    ) => void,
  ) => {
    log(`loadModel(${from}, ${to})`);

    const languagePair = `${from}${to}`;

    // Delete previous instance if a model is already loaded
    if (model) {
      safelyDeleteInstance(model);
    }

    // Download or hydrate model files to/from persistent storage
    const downloadedModelFilesByType: DownloadedModelFilesByType = await downloadModel(
      from,
      to,
      bergamotModelsBaseUrl,
      onModelDownloadProgress,
    );

    const loadModelStart = performance.now();

    // This function constructs the AlignedMemory from the array buffer and the alignment size
    const constructAlignedMemoryFromBuffer = (
      buffer: ArrayBuffer,
      alignmentSize: number,
    ) => {
      const byteArray = new Int8Array(buffer);
      // console.debug("byteArray size: ", byteArray.byteLength);
      const alignedMemory = new Module.AlignedMemory(
        byteArray.byteLength,
        alignmentSize,
      );
      const alignedByteArrayView = alignedMemory.getByteArrayView();
      alignedByteArrayView.set(byteArray);
      return alignedMemory;
    };

    // Set the Model Configuration as YAML formatted string.
    // For available configuration options, please check: https://marian-nmt.github.io/docs/cmd/marian-decoder/
    // This example captures the most relevant options: model file, vocabulary files and shortlist file
    const modelConfig = `beam-size: 1
normalize: 1.0
word-penalty: 0
max-length-break: 128
mini-batch-words: 1024
workspace: 128
max-length-factor: 2.0
skip-cost: true
cpu-threads: 0
quiet: true
quiet-translation: true
gemm-precision: int8shift
`;

    console.log("modelConfig: ", modelConfig);

    // Instantiate the TranslationModel
    const modelBuffer = downloadedModelFilesByType.model.arrayBuffer;
    const shortListBuffer = downloadedModelFilesByType.lex.arrayBuffer;
    const vocabBuffers = [downloadedModelFilesByType.vocab.arrayBuffer];

    // Construct AlignedMemory objects with downloaded buffers
    const alignedModelMemory = constructAlignedMemoryFromBuffer(
      modelBuffer,
      256,
    );
    const alignedShortlistMemory = constructAlignedMemoryFromBuffer(
      shortListBuffer,
      64,
    );
    const alignedVocabsMemoryList = new Module.AlignedMemoryList();
    vocabBuffers.forEach(item =>
      alignedVocabsMemoryList.push_back(
        constructAlignedMemoryFromBuffer(item, 64),
      ),
    );
    model = new Module.TranslationModel(
      modelConfig,
      alignedModelMemory,
      alignedShortlistMemory,
      alignedVocabsMemoryList,
    );
    const loadModelEnd = performance.now();
    const modelLoadWallTimeMs = loadModelEnd - loadModelStart;

    const alignmentIsSupported = model.isAlignmentSupported();
    console.debug("Alignment:", alignmentIsSupported);

    return { alignmentIsSupported, modelLoadWallTimeMs };
  };

  const translate = (texts: string[]) => {
    log(`translate()`);
    if (!model) {
      throw new Error("Translate attempted before model was loaded");
    }

    // TODO: Check that the loaded model supports the translation direction

    // Prepare results object
    const translationResults = {
      originalTexts: [],
      translatedTexts: [],
    };

    // Instantiate the arguments of translate() API i.e. TranslationRequest and input (vector<string>)
    const request = new Module.TranslationRequest();
    const input = new Module.VectorString();

    // Add texts to translate
    texts.forEach(text => {
      input.push_back(text);
    });

    // Access input (just for debugging)
    console.debug("Input size=", input.size());
    /*
    for (let i = 0; i < input.size(); i++) {
      console.debug(" val:" + input.get(i));
    }
    */

    // Translate the input; the result is a vector<TranslationResult>
    const result = model.translate(input, request);

    // Access input after translation (just for debugging)
    console.debug("Input size after translate API call =", input.size());

    // Access original and translated text from each entry of vector<TranslationResult>
    console.debug("Result size=", result.size());
    for (let i = 0; i < result.size(); i++) {
      const originalText = result.get(i).getOriginalText();
      const translatedText = result.get(i).getTranslatedText();
      translationResults.originalTexts.push(originalText);
      translationResults.translatedTexts.push(translatedText);
    }

    // Clean up the instances
    safelyDeleteInstance(request);
    safelyDeleteInstance(input);

    return translationResults;
  };

  const handleError = (error: Error, requestId, errorSource) => {
    console.info(
      `Error/exception caught in worker during ${errorSource}:`,
      error,
    );
    log(
      `Error/exception caught in worker during ${errorSource}: ${error} ${error.stack}`,
    );
    const message: ErrorWorkerMessage = {
      type: `error`,
      message: `Error/exception caught in worker during ${errorSource}: ${error.toString()}`,
      requestId,
      errorSource,
    };
    postMessage(message);
  };

  onmessage = function(msg: { data: IncomingBergamotTranslatorAPIMessage }) {
    const { data } = msg;
    if (!data.type || !data.requestId) {
      return;
    }
    const requestId = data.requestId;
    if (data.type === "loadModel") {
      try {
        loadModel(
          data.loadModelParams.from,
          data.loadModelParams.to,
          data.loadModelParams.bergamotModelsBaseUrl,
          (modelDownloadProgress: ModelDownloadProgress) => {
            const message: ModelDownloadProgressWorkerMessage = {
              type: "modelDownloadProgress",
              requestId,
              modelDownloadProgress,
            };
            postMessage(message);
          },
        )
          .then(loadModelResults => {
            const message: LoadModelResultsWorkerMessage = {
              type: "loadModelResults",
              requestId,
              loadModelResults,
            };
            postMessage(message);
          })
          .catch(error => {
            if (error.name === "ModelDownloadError") {
              handleError(error, requestId, "downloadModel");
            } else {
              handleError(error, requestId, "loadModel");
            }
          });
      } catch (error) {
        handleError(error, requestId, "loadModel");
      }
    } else if (data.type === "translate") {
      try {
        console.log("Messages to translate: ", data.translateParams.texts);
        const translationResults = translate(data.translateParams.texts);
        const message: TranslationResultsWorkerMessage = {
          type: "translationResults",
          requestId,
          translationResults,
        };
        postMessage(message);
      } catch (error) {
        handleError(error, requestId, "translate");
      }
    } else {
      throw new Error(
        `Unexpected message data payload sent to translation worker: "${JSON.stringify(
          data,
        )}"`,
      );
    }
  };

  // Send a message indicating that the worker is ready to receive WASM-related messages
  postMessage("ready");
  log("The worker is ready to receive translation-related messages");
});
