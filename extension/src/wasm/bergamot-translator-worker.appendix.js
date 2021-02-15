/* global addOnPreMain, Module */

addOnPreMain(function() {
  let model;

  const log = (message) => {
    postMessage({
      type: "log",
      message,
    })
  }

  const loadModel = () => {
    log(`loadModel()`);
    let start = Date.now();

    // Delete previous instance if another model was loaded
    if (model) {
      model.delete();
    }

    // Set the Model Configuration as YAML formatted string.
    // For available configuration options, please check: https://marian-nmt.github.io/docs/cmd/marian-decoder/
    // This example captures the most relevant options: model file, vocabulary files and shortlist file
    const modelConfig = "{\"models\":[\"/model.esen.npz\"],\"vocabs\":[\"/vocab.esen.spm\",\"/vocab.esen.spm\"],\"beam-size\":1,\"shortlist\":[\"/lex.esen.s2t\"]}";//

    // Instantiate the TranslationModel
    model = new Module.TranslationModel(modelConfig);
    log(`Model loaded in ${(Date.now() - start) / 1000} secs`);

    start = Date.now();
    const alignmentIsSupported = model.isAlignmentSupported();
    console.debug("Alignment:", alignmentIsSupported);

    log(`model.isAlignmentSupported() returned in ${(Date.now() - start) / 1000} secs`);

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

    const originalTextIndexSentenceOrdinalMap = new Map();

    // Initialize the input
    let sentenceOrdinal = 0;
    const sentencesToTranslate = [];
    texts.forEach((text, originalTextIndex) => {

      translationResults.originalTexts.push(text);

      // Temporary naive sentence splitter
      const sentences = text.split(".");
      // console.debug({ sentences });
      sentences.forEach((sentence) => {
        if (sentence.trim() === "") {
          return;
        }
        originalTextIndexSentenceOrdinalMap.set(sentenceOrdinal, originalTextIndex);
        sentencesToTranslate.push(sentence);
        sentenceOrdinal++
      });


    });

    sentencesToTranslate.forEach(sentence => {
      input.push_back(sentence);
    });

    // Access input (just for debugging)
    console.debug("Input size=", input.size());
    /*
    for (let i = 0; i < input.size(); i++) {
      console.debug(" val:" + input.get(i));
    }
    */

    // translate the input; the result is a vector<TranslationResult>
    const result = model.translate(input, request);

    // Access input after translation (just for debugging)
    console.debug("Input size after translate API call =", input.size());
    /*
    for (let i = 0; i < input.size(); i++) {
      console.debug(" val:" + input.get(i));
    }
    */

    // Access original and translated text from each entry of vector<TranslationResult>
    console.debug("Result size=", result.size());
    const originalSentencesByOriginalTextIndex = [];
    const translatedSentencesByOriginalTextIndex = [];
    for (let sentenceOrdinal = 0; sentenceOrdinal < result.size(); sentenceOrdinal++) {
      const originalText = result.get(sentenceOrdinal).getOriginalText();
      const translatedText = result.get(sentenceOrdinal).getTranslatedText();
      // console.debug(" original={" + originalText + "}, translation={" + translatedText + "}", { sentenceOrdinal },);
      const originalTextIndex = originalTextIndexSentenceOrdinalMap.get(sentenceOrdinal);
      // console.debug({ originalTextIndex });
      if (!originalSentencesByOriginalTextIndex[originalTextIndex]) {
        originalSentencesByOriginalTextIndex[originalTextIndex] = [];
      }
      originalSentencesByOriginalTextIndex[originalTextIndex].push(originalText);
      if (!translatedSentencesByOriginalTextIndex[originalTextIndex]) {
        translatedSentencesByOriginalTextIndex[originalTextIndex] = [];
      }
      translatedSentencesByOriginalTextIndex[originalTextIndex].push(translatedText);
    }

    // console.debug({ originalSentencesByOriginalTextIndex, translatedSentencesByOriginalTextIndex });

    translatedSentencesByOriginalTextIndex.forEach((translatedSentences, originalTextIndex) => {
      translationResults.translatedTexts[originalTextIndex] = translatedSentences.join(".");
    });

    // console.debug("translationResults.translatedTexts", translationResults.translatedTexts);

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
      const loadModelResults = loadModel();
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
          wordCount += text.trim().split(" ").filter(word => word.trim() !== "").length;
        })
        const start = Date.now();
        const translationResults = translate(data.translateParams.texts);
        const secs = (Date.now() - start) / 1000;
        log(`Translation of ${data.translateParams.texts.length} texts (wordCount ${wordCount}) took ${secs} secs (${Math.round(wordCount / secs)} words per second)`);
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
  log("The worker is ready to receive translation-related messages")
});
