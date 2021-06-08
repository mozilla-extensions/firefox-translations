/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TranslationDocument } from "./TranslationDocument";
import { BergamotDomTranslator } from "./dom-translators/BergamotDomTranslator";
import { ContentScriptLanguageDetectorProxy } from "../../shared-resources/ContentScriptLanguageDetectorProxy";
import { DetectedLanguageResults } from "../../background-scripts/background.js/lib/LanguageDetector";
import { TranslationStatus } from "../../shared-resources/models/BaseTranslationState";
import { LanguageSupport } from "../../shared-resources/LanguageSupport";
import { DocumentTranslationStateCommunicator } from "../../shared-resources/state-management/DocumentTranslationStateCommunicator";
import { FrameTranslationProgress } from "./dom-translators/BaseDomTranslator";
import {
  BergamotTranslatorAPIModelDownloadError,
  BergamotTranslatorAPIModelLoadError,
  BergamotTranslatorAPITranslationError,
} from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";
import { TranslationItem } from "./TranslationItem";

export class DomTranslationManager {
  private documentTranslationStateCommunicator: DocumentTranslationStateCommunicator;
  public contentWindow;
  public document;
  private languageDetector: ContentScriptLanguageDetectorProxy;
  constructor(documentTranslationStateCommunicator, document, contentWindow) {
    this.documentTranslationStateCommunicator = documentTranslationStateCommunicator;
    this.document = document;
    this.contentWindow = contentWindow;
    this.languageDetector = new ContentScriptLanguageDetectorProxy();
  }

  getTranslationDocument(): TranslationDocument {
    // If a TranslationDocument already exists for this document, it should
    // be used instead of creating a new one so that we can use the original
    // content of the page for the new translation instead of the newly
    // translated text.
    return (
      this.contentWindow.translationDocument ||
      new TranslationDocument(this.document)
    );
  }

  async attemptToDetectLanguage() {
    console.debug("Attempting to detect language");

    const url = String(this.document.location);
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.debug("Not a HTTP(S) url, translation unavailable", { url });
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.UNAVAILABLE,
      );
      return;
    }

    console.debug("Setting status to reflect detection of language ongoing");
    this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
      TranslationStatus.DETECTING_LANGUAGE,
    );

    // Extract translation roots from the document - necessary for grabbing a sample for language detection
    const startGetTranslationNodes = performance.now();
    const translationRoots: TranslationItem[] = this.getTranslationDocument()
      .translationRoots;
    const endGetTranslationNodes = performance.now();
    console.info(
      `Extracting translation nodes from the document took ${(endGetTranslationNodes -
        startGetTranslationNodes) /
        1000} seconds`,
    );

    // Grab a 60k sample of text from the page.
    // (The CLD2 library used by the language detector is capable of
    // analyzing raw HTML. Unfortunately, that takes much more memory,
    // and since it's hosted by emscripten, and therefore can't shrink
    // its heap after it's grown, it has a performance cost.
    // So we send plain text instead.)
    const startGrabSample = performance.now();
    const grabTranslationNodesSample = (
      $translationRoots: TranslationItem[],
      maxLength,
      // skipInvisibleContent = false,
    ) => {
      let totalLength = 0;
      const textContents = [];
      $translationRoots.some(translationItem => {
        const textContent = translationItem.nodeRef.textContent;
        textContents.push(textContent);
        totalLength += textContent.length;
        return totalLength >= maxLength;
      });
      return textContents.join("\n").substr(0, maxLength);
    };
    const string = grabTranslationNodesSample(translationRoots, 60 * 1024);
    const endGrabSample = performance.now();
    console.info(
      `Grabbing a DOM sample for language detection took ${(endGrabSample -
        startGrabSample) /
        1000} seconds`,
    );
    // console.debug("DOM sample for language detection:", { string });

    // Language detection isn't reliable on very short strings.
    if (string.length < 100) {
      console.debug(
        "Language detection isn't reliable on very short strings. Skipping language detection",
        { string },
      );
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.LANGUAGE_NOT_DETECTED,
      );
      return;
    }

    const detectedLanguageResults: DetectedLanguageResults = await this.languageDetector.detectLanguage(
      string,
    );
    console.debug("Language detection results are in", {
      detectedLanguageResults,
    });

    // The window might be gone by now.
    if (!this.contentWindow) {
      console.info(
        "Content window reference invalid, deleting document translation state",
      );
      this.documentTranslationStateCommunicator.clear();
      return;
    }

    // Save results in extension state
    this.documentTranslationStateCommunicator.updatedDetectedLanguageResults(
      detectedLanguageResults,
    );

    if (!detectedLanguageResults.confident) {
      console.debug(
        "Language detection results not confident enough, bailing.",
        { string },
      );
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.LANGUAGE_NOT_DETECTED,
      );
      return;
    }

    console.debug("Updating state to reflect that language has been detected");
    await this.checkLanguageSupport(detectedLanguageResults);
  }

  async checkLanguageSupport(detectedLanguageResults: DetectedLanguageResults) {
    const { summarizeLanguageSupport } = new LanguageSupport();

    const detectedLanguage = detectedLanguageResults.language;
    const {
      acceptedTargetLanguages,
      // defaultSourceLanguage,
      defaultTargetLanguage,
      supportedSourceLanguages,
      supportedTargetLanguagesGivenDefaultSourceLanguage,
      allPossiblySupportedTargetLanguages,
    } = await summarizeLanguageSupport(detectedLanguageResults);

    if (acceptedTargetLanguages.includes(detectedLanguage)) {
      // Detected language is the same as the user's accepted target languages.
      console.info(
        "Detected language is in one of the user's accepted target languages.",
        {
          acceptedTargetLanguages,
        },
      );
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD,
      );
      return;
    }

    if (!supportedSourceLanguages.includes(detectedLanguage)) {
      // Detected language is not part of the supported source languages.
      console.info(
        "Detected language is not part of the supported source languages.",
        { detectedLanguage, supportedSourceLanguages },
      );
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.TRANSLATION_UNSUPPORTED,
      );
      return;
    }

    if (!allPossiblySupportedTargetLanguages.includes(defaultTargetLanguage)) {
      // Detected language is not part of the supported source languages.
      console.info(
        "Default target language is not part of the supported target languages.",
        {
          acceptedTargetLanguages,
          defaultTargetLanguage,
          allPossiblySupportedTargetLanguages,
        },
      );
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.TRANSLATION_UNSUPPORTED,
      );
      return;
    }

    if (
      !defaultTargetLanguage ||
      !supportedTargetLanguagesGivenDefaultSourceLanguage.includes(
        defaultTargetLanguage,
      )
    ) {
      // Combination of source and target languages unsupported
      console.info("Combination of source and target languages unsupported.", {
        acceptedTargetLanguages,
        defaultTargetLanguage,
        supportedTargetLanguagesGivenDefaultSourceLanguage,
      });
      this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
        TranslationStatus.TRANSLATION_UNSUPPORTED,
      );
      return;
    }

    this.documentTranslationStateCommunicator.broadcastUpdatedTranslationStatus(
      TranslationStatus.OFFER,
    );
  }

  async doTranslation(from, to) {
    const translationDocument = this.getTranslationDocument();

    console.info("Translating web page");

    const domTranslator = new BergamotDomTranslator(
      translationDocument,
      from,
      to,
    );

    this.contentWindow.translationDocument = translationDocument;
    translationDocument.translatedFrom = from;
    translationDocument.translatedTo = to;
    translationDocument.translationError = false;

    try {
      console.info(
        `About to translate web page document (${translationDocument.translationRoots.length} translation items)`,
        { from, to },
      );

      // TODO: Timeout here to be able to abort UI in case translation hangs
      await domTranslator.translate(
        (frameTranslationProgress: FrameTranslationProgress) => {
          this.documentTranslationStateCommunicator.broadcastUpdatedFrameTranslationProgress(
            frameTranslationProgress,
          );
        },
      );

      console.info(
        `Translation of web page document completed (translated ${
          translationDocument.translationRoots.filter(
            translationRoot =>
              translationRoot.currentDisplayMode === "translation",
          ).length
        } out of ${
          translationDocument.translationRoots.length
        } translation items)`,
        { from, to },
      );
      console.info("Translated web page");
    } catch (err) {
      console.warn("Translation error occurred: ", err);
      translationDocument.translationError = true;
    } finally {
      // Positioned in finally-clause so that it gets communicated whether the
      // translation attempt resulted in some translated content or not
      this.documentTranslationStateCommunicator.broadcastTranslationAttemptConcluded(
        translationDocument.translationError,
        domTranslator.derivedTranslationDocumentData,
      );

      // Communicate that errors occurred
      domTranslator.errorsEncountered.forEach(
        (
          error:
            | Error
            | BergamotTranslatorAPIModelDownloadError
            | BergamotTranslatorAPIModelLoadError
            | BergamotTranslatorAPITranslationError,
        ) => {
          if (error.name === "BergamotTranslatorAPIModelLoadError") {
            this.documentTranslationStateCommunicator.broadcastUpdatedAttributeValue(
              "modelLoadErrorOccurred",
              true,
            );
          } else if (error.name === "BergamotTranslatorAPIModelDownloadError") {
            this.documentTranslationStateCommunicator.broadcastUpdatedAttributeValue(
              "modelDownloadErrorOccurred",
              true,
            );
          } else if (error.name === "BergamotTranslatorAPITranslationError") {
            this.documentTranslationStateCommunicator.broadcastUpdatedAttributeValue(
              "translationErrorOccurred",
              true,
            );
          } else {
            this.documentTranslationStateCommunicator.broadcastUpdatedAttributeValue(
              "otherErrorOccurred",
              true,
            );
          }
        },
      );
    }
  }
}
