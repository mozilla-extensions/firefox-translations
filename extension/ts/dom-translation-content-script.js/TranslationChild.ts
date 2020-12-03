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

  async attemptToDetectLanguage() {
    console.debug("Attempting to detect language");

    let url = String(this.document.location);
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.debug("Not a HTTP(S) url, translation unavailable", { url });
      setTimeout(() => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(
          this.frameInfo,
          [
            {
              op: "replace",
              path: ["translationStatus"],
              value: TranslationStatus.UNAVAILABLE,
            },
          ],
        );
      }, 0);
      return;
    }

    console.debug("Setting status to reflect detection of language ongoing");
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["translationStatus"],
            value: TranslationStatus.DETECTING_LANGUAGE,
          },
        ],
      );
    }, 0);

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
      setTimeout(() => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(
          this.frameInfo,
          [
            {
              op: "replace",
              path: ["translationStatus"],
              value: TranslationStatus.LANGUAGE_NOT_DETECTED,
            },
          ],
        );
      }, 0);
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
      setTimeout(() => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(
          this.frameInfo,
          [
            {
              op: "replace",
              path: ["translationStatus"],
              value: TranslationStatus.LANGUAGE_NOT_DETECTED,
            },
          ],
        );
      }, 0);
      return;
    }

    console.debug("Updating state to reflect that language has been detected");
    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["translationStatus"],
            value: TranslationStatus.OFFER,
          },
        ],
      );
    }, 0);
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

    setTimeout(() => {
      this.extensionState.patchDocumentTranslationStateByFrameInfo(
        this.frameInfo,
        [
          {
            op: "replace",
            path: ["translationStatus"],
            value: TranslationStatus.TRANSLATING,
          },
        ],
      );
    }, 0);

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
      setTimeout(() => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(
          this.frameInfo,
          [
            {
              op: "replace",
              path: ["translationStatus"],
              value: TranslationStatus.TRANSLATED,
            },
          ],
        );
      }, 0);
    } catch (ex) {
      console.error("Translation error", ex);
      translationDocument.translationError = true;
      setTimeout(() => {
        this.extensionState.patchDocumentTranslationStateByFrameInfo(
          this.frameInfo,
          [
            {
              op: "replace",
              path: ["translationStatus"],
              value: TranslationStatus.ERROR,
            },
          ],
        );
      }, 0);
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
