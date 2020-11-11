/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { TranslationDocument } from "./TranslationDocument";
import { BergamotTranslator } from "./BergamotTranslator";
import { getTranslationNodes } from "./getTranslationNodes";
import { ContentScriptLanguageDetectorProxy } from "../shared-resources/ContentScriptLanguageDetectorProxy";

const STATE_OFFER = 0;
const STATE_TRANSLATED = 2;
const STATE_ERROR = 3;

// Temporary mock
class JSWindowActorChild {
  public contentWindow;
  public document;
  sendAsyncMessage(ref, data) {
    console.log("MOCK sendAsyncMessage", { ref, data });
  }
}

interface DocumentState {
  state?: number;
  translatedFrom?: any;
  translatedTo?: any;
  originalShown?: any;
  detectedLanguage?: any;
}

export class TranslationChild extends JSWindowActorChild {
  private languageDetector: ContentScriptLanguageDetectorProxy;
  constructor(document, contentWindow) {
    super();
    this.document = document;
    this.contentWindow = contentWindow;
    this.languageDetector = new ContentScriptLanguageDetectorProxy();
  }

  handleEvent(aEvent) {
    switch (aEvent.type) {
      case "pageshow":
        // We are only listening to pageshow events.
        let content = this.contentWindow;
        if (!content.detectedLanguage) {
          return;
        }

        let data: DocumentState = {};
        let trDoc = content.translationDocument;
        if (trDoc) {
          data.state = trDoc.translationError ? STATE_ERROR : STATE_TRANSLATED;
          data.translatedFrom = trDoc.translatedFrom;
          data.translatedTo = trDoc.translatedTo;
          data.originalShown = trDoc.originalShown;
        } else {
          data.state = STATE_OFFER;
          data.originalShown = true;
        }
        data.detectedLanguage = content.detectedLanguage;

        this.sendAsyncMessage("Translation:DocumentState", data);
        break;

      case "load":
        this.checkForTranslation();
        break;
    }
  }

  async checkForTranslation() {
    console.debug("Checking translation needs");

    let url = String(this.document.location);
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.debug(
        "Not a HTTP(S) url, not attempting new language detection",
        { url },
      );
      return;
    }

    let content = this.contentWindow;
    if (content.detectedLanguage) {
      console.debug(
        "Language already detected, not attempting new language detection",
        content.detectedLanguage,
      );
      return;
    }

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
      return;
    }

    const result = await this.languageDetector.detectLanguage(string);
    console.debug("Language detection results are in", { result });

    // Bail if we're not confident.
    if (!result.confident) {
      console.debug(
        "Language detection results not confident enough, bailing.",
      );
      return;
    }

    // The window might be gone by now.
    if (!content) {
      return;
    }

    content.detectedLanguage = result.language;

    let data = {
      state: STATE_OFFER,
      originalShown: true,
      detectedLanguage: result.language,
    };

    return data;
  }

  async doTranslation(aFrom, aTo) {
    // If a TranslationDocument already exists for this document, it should
    // be used instead of creating a new one so that we can use the original
    // content of the page for the new translation instead of the newly
    // translated text.
    let translationDocument =
      this.contentWindow.translationDocument ||
      new TranslationDocument(this.document);

    let translator = new BergamotTranslator(translationDocument, aFrom, aTo);

    this.contentWindow.translationDocument = translationDocument;
    translationDocument.translatedFrom = aFrom;
    translationDocument.translatedTo = aTo;
    translationDocument.translationError = false;

    let result;
    try {
      let translateResult = await translator.translate();

      result = {
        characterCount: translateResult.characterCount,
        from: aFrom,
        to: aTo,
        success: true,
      };

      translationDocument.showTranslation();
      return result;
    } catch (ex) {
      console.error("doTranslation error", ex);
      translationDocument.translationError = true;
      result = { success: false };
      if (ex == "unavailable") {
        result.unavailable = true;
      }
    }

    return result;
  }

  receiveMessage(aMessage) {
    switch (aMessage.name) {
      case "Translation:TranslateDocument": {
        return this.doTranslation(aMessage.data.from, aMessage.data.to);
      }

      case "Translation:ShowOriginal":
        this.contentWindow.translationDocument.showOriginal();
        break;

      case "Translation:ShowTranslation":
        this.contentWindow.translationDocument.showTranslation();
        break;
    }

    return undefined;
  }
}
