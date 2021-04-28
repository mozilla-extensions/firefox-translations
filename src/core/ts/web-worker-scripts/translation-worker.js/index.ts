/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  addOnPreMain,
  Module,
  FS,
  WORKERFS,
} from "./bergamot-translator-worker";

import {
  LoadModelRequestWorkerMessage,
  TranslateRequestWorkerMessage,
} from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";
import { getBergamotModelsForLanguagePair } from "./getBergamotModelsForLanguagePair";

// Using cache-polyfill to work around https://bugzilla.mozilla.org/show_bug.cgi?id=1575625
import { caches } from "cache-polyfill";
import { modelRegistry } from "../../config";

type IncomingBergamotTranslatorAPIMessage =
  | LoadModelRequestWorkerMessage
  | TranslateRequestWorkerMessage;

addOnPreMain(function() {
  let model;

  const log = message => {
    postMessage({
      type: "log",
      message,
    });
  };

  /**
   * Automatically download the appropriate translation models, vocabularies and lexical shortlists if not already locally present
   */
  const downloadModel = async (
    from: string,
    to: string,
    bergamotModelsBaseUrl: string,
  ) => {
    log(`downloadModel(${from}, ${to}, ${bergamotModelsBaseUrl})`);

    const languagePair = `${from}${to}`;

    const cache = await caches.open("bergamot-models");
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
    );

    // Mount the downloaded files in emscripten's worker file system
    const modelDir = `/${languagePair}`;
    FS.mkdir(modelDir, undefined);
    FS.mount(WORKERFS, { blobs }, modelDir);
  };

  const loadModel = async (
    from: string,
    to: string,
    bergamotModelsBaseUrl: string,
  ) => {
    log(`loadModel(${from}, ${to})`);

    const languagePair = `${from}${to}`;

    // Delete previous instance if a model is already loaded
    if (model) {
      model.delete();
    }

    // Download model files if not already locally present
    const modelDir = `/${languagePair}`;
    const { exists } = FS.analyzePath(modelDir, undefined);
    if (!exists) {
      await downloadModel(from, to, bergamotModelsBaseUrl);
    }

    const loadModelStart = performance.now();

    // Set the Model Configuration as YAML formatted string.
    // For available configuration options, please check: https://marian-nmt.github.io/docs/cmd/marian-decoder/
    // This example captures the most relevant options: model file, vocabulary files and shortlist file
    const modelConfig = `models:
  - /${languagePair}/model.${languagePair}.intgemm.alphas.bin
vocabs:
  - /${languagePair}/vocab.${languagePair}.spm
  - /${languagePair}/vocab.${languagePair}.spm
beam-size: 1
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
shortlist:
    - /${languagePair}/lex.${languagePair}.s2t
    - 50
    - 50
`;

    console.log("modelConfig: ", modelConfig);

    // Instantiate the TranslationModel
    model = new Module.TranslationModel(modelConfig);
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
    request.delete();
    input.delete();

    return translationResults;
  };

  const handleError = (error, requestId, sourceMethod) => {
    console.info(
      `Error/exception caught in worker during ${sourceMethod}:`,
      error,
    );
    log(`Error/exception caught in worker during ${sourceMethod}: ${error}`);
    postMessage({
      type: `error`,
      message: `Error/exception caught in worker during ${sourceMethod}: ${error.toString()}`,
      requestId,
      sourceMethod,
    });
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
        )
          .then(loadModelResults => {
            postMessage({
              type: "loadModelResults",
              requestId,
              loadModelResults,
            });
          })
          .catch(error => {
            handleError(error, requestId, "loadModel");
          });
      } catch (error) {
        handleError(error, requestId, "loadModel");
      }
    } else if (data.type === "translate") {
      try {
        console.log("Messages to translate: ", data.translateParams.texts);
        const translationResults = translate(data.translateParams.texts);
        postMessage({
          type: "translationResults",
          requestId,
          translationResults,
        });
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
