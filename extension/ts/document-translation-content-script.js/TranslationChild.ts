/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { TranslationDocument } from "./TranslationDocument";
import { BergamotTranslator } from "./BergamotTranslator";

const STATE_OFFER = 0;
const STATE_TRANSLATED = 2;
const STATE_ERROR = 3;

// Temporary mock
class JSWindowActorChild {
  public contentWindow;
  public document;
  sendAsyncMessage(ref, data) {}
}

// Temporary mock
class DocumentEncoder {
  public SkipInvisibleContent;
  init(document, mimeType, skipInvisibleContent) {
  }
  encodeToStringWithMaxLength(length): string {
    return "foo"
  }
}

// Temporary mock
class Cu {
  static createDocumentEncoder(mimeType) {
    return new DocumentEncoder();
  }
}

// Temporary mock
class Services {
  static prefs: { getCharPref: (pref) => "foo"};
}

interface Data {
  state?: any;
  translatedFrom?: any;
  translatedTo?: any;
  originalShown?: any;
  detectedLanguage?: any;
}

export class TranslationChild extends JSWindowActorChild {
  handleEvent(aEvent) {
    switch (aEvent.type) {
      case "pageshow":
        // We are only listening to pageshow events.
        let content = this.contentWindow;
        if (!content.detectedLanguage) {
          return;
        }

        let data: Data = {};
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

  checkForTranslation() {
    let url = String(this.document.location);
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return;
    }

    let content = this.contentWindow;
    if (content.detectedLanguage) {
      return;
    }

    // Grab a 60k sample of text from the page.
    let encoder = Cu.createDocumentEncoder("text/plain");
    encoder.init(this.document, "text/plain", encoder.SkipInvisibleContent);
    let string = encoder.encodeToStringWithMaxLength(60 * 1024);

    // Language detection isn't reliable on very short strings.
    if (string.length < 100) {
      return;
    }

    LanguageDetector.detectLanguage(string).then(result => {
      // Bail if we're not confident.
      if (!result.confident) {
        return;
      }

      // The window might be gone by now.
      /* TODO: Restore check
      if (Cu.isDeadWrapper(content)) {
        return;
      }
      */

      content.detectedLanguage = result.language;

      let data = {
        state: STATE_OFFER,
        originalShown: true,
        detectedLanguage: result.language,
      };
      this.sendAsyncMessage("Translation:DocumentState", data);
    });
  }

  async doTranslation(aFrom, aTo) {
    // If a TranslationDocument already exists for this document, it should
    // be used instead of creating a new one so that we can use the original
    // content of the page for the new translation instead of the newly
    // translated text.
    let translationDocument =
      this.contentWindow.translationDocument ||
      new TranslationDocument(this.document);

    let engine = Services.prefs.getCharPref("browser.translation.engine");
    let translator = new BergamotTranslator(
      translationDocument,
      aFrom,
      aTo
    );

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
