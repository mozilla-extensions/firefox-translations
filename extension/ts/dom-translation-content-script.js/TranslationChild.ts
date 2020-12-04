/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { TranslationDocument } from "./TranslationDocument";
import { BergamotTranslator } from "./BergamotTranslator";
import { getTranslationNodes } from "./getTranslationNodes";
import { ContentScriptLanguageDetectorProxy } from "../shared-resources/ContentScriptLanguageDetectorProxy";
import { ExtensionState } from "../shared-resources/models/ExtensionState";
import {
  DetectedLanguageResults,
  FrameInfo,
} from "../shared-resources/bergamot.types";
import { TranslationStatus } from "../shared-resources/models/BaseTranslationState";

export class TranslationChild {
  private frameInfo: FrameInfo;
  public contentWindow;
  public document;
  private extensionState: ExtensionState;
  private languageDetector: ContentScriptLanguageDetectorProxy;
  constructor(
    frameInfo: FrameInfo,
    document,
    contentWindow,
    extensionState: ExtensionState,
  ) {
    this.frameInfo = frameInfo;
    this.document = document;
    this.contentWindow = contentWindow;
    this.extensionState = extensionState;
    this.languageDetector = new ContentScriptLanguageDetectorProxy();
  }

  /**
   * Wrapped in setTimeout to prevent automatic batching of updates - we want status indicators
   * to get the updated translation status immediately.
   *
   * @param translationStatus
   */
  broadcastUpdatedTranslationStatus(translationStatus: TranslationStatus) {
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["translationStatus"],
            value: translationStatus,
          },
        ],
      );
    }, 0);
  }

  async attemptToDetectLanguage() {
    console.debug("Attempting to detect language");

    let url = String(this.document.location);
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.debug("Not a HTTP(S) url, translation unavailable", { url });
      this.broadcastUpdatedTranslationStatus(TranslationStatus.UNAVAILABLE);
      return;
    }

    console.debug("Setting status to reflect detection of language ongoing");
    this.broadcastUpdatedTranslationStatus(
      TranslationStatus.DETECTING_LANGUAGE,
    );

    // Grab a 60k sample of text from the page.
    // (The CLD2 library used by the language detector is capable of
    // analyzing raw HTML. Unfortunately, that takes much more memory,
    // and since it's hosted by emscripten, and therefore can't shrink
    // its heap after it's grown, it has a performance cost.
    // So we send plain text instead.)
    let nodeList = getTranslationNodes(document.body);
    const domElementsToStringWithMaxLength = (
      elements: Node[],
      maxLength,
      // skipInvisibleContent = false,
    ) => {
      return elements
        .map(el => el.textContent)
        .join("\n")
        .substr(0, maxLength);
    };
    const string = domElementsToStringWithMaxLength(
      nodeList.translationNodes.map(tn => tn.content),
      60 * 1024,
    );

    // Language detection isn't reliable on very short strings.
    if (string.length < 100) {
      console.debug(
        "Language detection isn't reliable on very short strings. Skipping language detection",
        { string },
      );
      this.broadcastUpdatedTranslationStatus(
        TranslationStatus.LANGUAGE_NOT_DETECTED,
      );
      return;
    }

    const result: DetectedLanguageResults = await this.languageDetector.detectLanguage(
      string,
    );
    console.debug("Language detection results are in", { result });

    // The window might be gone by now.
    if (!this.contentWindow) {
      console.log(
        "Content window reference invalid, deleting document translation state",
      );
      setTimeout(() => {
        this.extensionState.deleteDocumentTranslationStateByFrameInfo(
          this.frameInfo,
        );
      }, 0);
      return;
    }

    // Save results in extension state
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "add",
            path: ["detectedLanguageResults"],
            value: result,
          },
        ],
      );
    }, 0);

    if (!result.confident) {
      console.debug(
        "Language detection results not confident enough, bailing.",
      );
      this.broadcastUpdatedTranslationStatus(
        TranslationStatus.LANGUAGE_NOT_DETECTED,
      );
      return;
    }

    console.debug("Updating state to reflect that language has been detected");
    this.broadcastUpdatedTranslationStatus(TranslationStatus.OFFER);
    return;
  }

  async doTranslation(aFrom, aTo) {
    // If a TranslationDocument already exists for this document, it should
    // be used instead of creating a new one so that we can use the original
    // content of the page for the new translation instead of the newly
    // translated text.
    let translationDocument =
      this.contentWindow.translationDocument ||
      new TranslationDocument(this.document);

    this.broadcastUpdatedTranslationStatus(TranslationStatus.TRANSLATING);

    let translator = new BergamotTranslator(translationDocument, aFrom, aTo);

    this.contentWindow.translationDocument = translationDocument;
    translationDocument.translatedFrom = aFrom;
    translationDocument.translatedTo = aTo;
    translationDocument.translationError = false;

    try {
      console.info("About to translate web page document", { aFrom, aTo });
      await translator.translate();
      /*
      // TODO: Restore telemetry
      const translateResult = await translator.translate();
      result = {
        characterCount: translateResult.characterCount,
        from: aFrom,
        to: aTo,
      };
      // Record the number of characters translated.
      this.translationTelemetry.recordTranslation(
        result.from,
        result.to,
        result.characterCount,
      );
       */

      console.info("Web page document translated. Showing translation...");
      translationDocument.showTranslation();
      this.broadcastUpdatedTranslationStatus(TranslationStatus.TRANSLATED);
    } catch (ex) {
      console.error("Translation error", ex);
      translationDocument.translationError = true;
      this.broadcastUpdatedTranslationStatus(TranslationStatus.ERROR);
    }

    return;
  }

  showOriginalContent() {
    /*
    this.originalShown = true;
    this.showURLBarIcon();
    this.sendAsyncMessage("Translation:ShowOriginal");
    this.translationTelemetry.recordShowOriginalContent();
     */
  }

  showTranslatedContent() {
    /*
    this.originalShown = false;
    this.showURLBarIcon();
    this.sendAsyncMessage("Translation:ShowTranslation");
     */
  }
}
