/* global addOnPreMain, Module */

addOnPreMain(function() {
  let model;
  let modelFrom;
  let modelTo;

  const log = message => {
    postMessage({
      type: "log",
      message,
    });
  };

  const loadModel = (from, to) => {
    log(`loadModel(${from}, ${to})`);

    const languagePair = `${from}${to}`;

    // Load new model if not the same from/to language pair is already loaded
    const loadedLanguagePair = `${modelFrom}${modelTo}`;
    if (loadedLanguagePair !== languagePair) {
      const start = Date.now();

      // Delete previous instance if another model was loaded
      if (model) {
        model.delete();
      }

      // Vocab files are re-used in both translation directions
      const vocabLanguagePair = from === "en" ? `${to}${from}` : languagePair;

      // Set the Model Configuration as YAML formatted string.
      // For available configuration options, please check: https://marian-nmt.github.io/docs/cmd/marian-decoder/
      // This example captures the most relevant options: model file, vocabulary files and shortlist file
      const modelConfig = `models:
  - /${languagePair}/model.${languagePair}.intgemm.alphas.bin
vocabs:
  - /${vocabLanguagePair}/vocab.${vocabLanguagePair}.spm
  - /${vocabLanguagePair}/vocab.${vocabLanguagePair}.spm
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
      modelFrom = from;
      modelTo = to;
      log(
        `Model ${languagePair} loaded in ${(Date.now() - start) / 1000} secs`,
      );
    } else {
      log(`Model ${languagePair} already loaded`);
    }

    const start = Date.now();
    const alignmentIsSupported = model.isAlignmentSupported();
    console.debug("Alignment:", alignmentIsSupported);

    log(
      `model.isAlignmentSupported() returned in ${(Date.now() - start) /
        1000} secs`,
    );

    return { alignmentIsSupported };
  };

  /**
   * @param texts string[]
   */
  const translate = texts => {
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

  onmessage = function(msg) {
    const { data } = msg;
    if (!data.type || !data.requestId) {
      return;
    }
    const requestId = data.requestId;
    if (data.type === "loadModel") {
      const loadModelResults = loadModel(
        data.loadModelParams.from,
        data.loadModelParams.to,
      );
      postMessage({
        type: "loadModelResults",
        requestId,
        loadModelResults,
      });
    } else if (data.type === "translate") {
      try {
        console.log("Messages to translate: ", data.translateParams.texts);
        let wordCount = 0;
        data.translateParams.texts.forEach(text => {
          wordCount += text
            .trim()
            .split(" ")
            .filter(word => word.trim() !== "").length;
        });
        const start = Date.now();
        const translationResults = translate(data.translateParams.texts);
        const secs = (Date.now() - start) / 1000;
        log(
          `Translation of ${
            data.translateParams.texts.length
          } texts (wordCount ${wordCount}) took ${secs} secs (${Math.round(
            wordCount / secs,
          )} words per second)`,
        );
        postMessage({
          type: "translationResults",
          requestId,
          translationResults,
        });
      } catch (error) {
        log(`Error/exception caught in worker: `, error.toString());
      }
    } else {
      throw new Error(
        `Unexpected message type: "${data.type}. Request id: ${data.requestId}"`,
      );
    }
  };

  // Send a message indicating that the worker is ready to receive WASM-related messages
  postMessage("ready");
  log("The worker is ready to receive translation-related messages");
});
