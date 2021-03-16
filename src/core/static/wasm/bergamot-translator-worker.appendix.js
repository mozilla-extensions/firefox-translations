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

    const originalTextIndexSentenceOrdinalMap = new Map();

    // Initialize the input
    let sentenceOrdinal = 0;
    const sentencesToTranslate = [];
    texts.forEach((text, originalTextIndex) => {
      translationResults.originalTexts.push(text);

      // Temporary naive sentence splitter
      const sentences = text.trim().split(". ");
      // console.debug({ sentences });
      sentences.forEach((sentence, sentenceIndex) => {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence === "") {
          return;
        }
        originalTextIndexSentenceOrdinalMap.set(
          sentenceOrdinal,
          originalTextIndex,
        );
        const originalSentenceEndedWithAPeriod =
          sentenceIndex > 0 ||
          (sentences.length === 1 && text.trim().indexOf(". ") > 0);
        const sentenceToTranslate = `${trimmedSentence}${
          originalSentenceEndedWithAPeriod ? "." : ""
        }`;
        // console.debug({text, trimmedSentence, sentences, sentenceIndex, originalSentenceEndedWithAPeriod, sentenceToTranslate});
        sentencesToTranslate.push(sentenceToTranslate);
        sentenceOrdinal++;
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
    for (
      let $sentenceOrdinal = 0;
      $sentenceOrdinal < result.size();
      $sentenceOrdinal++
    ) {
      const originalText = result.get($sentenceOrdinal).getOriginalText();
      const translatedText = result.get($sentenceOrdinal).getTranslatedText();
      // console.debug(" original={" + originalText + "}, translation={" + translatedText + "}", { $sentenceOrdinal },);
      const originalTextIndex = originalTextIndexSentenceOrdinalMap.get(
        $sentenceOrdinal,
      );
      // console.debug({ originalTextIndex });
      if (!originalSentencesByOriginalTextIndex[originalTextIndex]) {
        originalSentencesByOriginalTextIndex[originalTextIndex] = [];
      }
      originalSentencesByOriginalTextIndex[originalTextIndex].push(
        originalText,
      );
      if (!translatedSentencesByOriginalTextIndex[originalTextIndex]) {
        translatedSentencesByOriginalTextIndex[originalTextIndex] = [];
      }
      translatedSentencesByOriginalTextIndex[originalTextIndex].push(
        translatedText,
      );
    }

    // console.debug({ originalSentencesByOriginalTextIndex, translatedSentencesByOriginalTextIndex });

    translatedSentencesByOriginalTextIndex.forEach(
      (translatedSentences, originalTextIndex) => {
        translationResults.translatedTexts[
          originalTextIndex
        ] = translatedSentences.join(" ");
      },
    );

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
