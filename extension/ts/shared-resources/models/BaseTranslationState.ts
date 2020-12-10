import { Model, model, prop } from "mobx-keystone";
import { DetectedLanguageResults } from "../bergamot.types";
import { computed } from "mobx";
import { browser } from "webextension-polyfill-ts";

export enum TranslationStatus {
  UNKNOWN = "UNKNOWN",
  UNAVAILABLE = "UNAVAILABLE",
  DETECTING_LANGUAGE = "DETECTING_LANGUAGE",
  LANGUAGE_NOT_DETECTED = "LANGUAGE_NOT_DETECTED",
  SOURCE_LANGUAGE_UNDERSTOOD = "SOURCE_LANGUAGE_UNDERSTOOD",
  DETECTED_LANGUAGE_UNSUPPORTED = "DETECTED_LANGUAGE_UNSUPPORTED",
  OFFER = "OFFER",
  DOWNLOADING_TRANSLATION_MODEL = "DOWNLOADING_TRANSLATION_MODEL",
  TRANSLATING = "TRANSLATING",
  TRANSLATED = "TRANSLATED",
  ERROR = "ERROR",
}

@model("bergamotTranslate/BaseTranslationState")
export class BaseTranslationState extends Model({
  documentIsVisible: prop<boolean>({ setterAction: true }),
  displayQualityEstimation: prop<boolean>({ setterAction: true }),
  translationRequested: prop<boolean>({ setterAction: true }),
  cancellationRequested: prop<boolean>({ setterAction: true }),
  detectedLanguageResults: prop<DetectedLanguageResults | null>(() => null, {
    setterAction: true,
  }),
  translateFrom: prop<string>({ setterAction: true }),
  translateTo: prop<string>({ setterAction: true }),
  translationStatus: prop<TranslationStatus>(TranslationStatus.UNKNOWN, {
    setterAction: true,
  }),
  tabId: prop<number>(),
  wordCount: prop<number>(),
}) {
  @computed
  get effectiveTranslateFrom() {
    return this.translateFrom || this.detectedLanguageResults?.language;
  }
  @computed
  get effectiveTranslateTo() {
    const browserUiLanguageCode = browser.i18n.getUILanguage().split("-")[0];
    /*
    const acceptedLanguages: string[] = await browser.i18n.getAcceptLanguages();
    acceptedLanguages.forEach(languageCode => {
      if (targetLanguages.includes(languageCode)) {
        this.setState({ targetLanguage: languageCode });
      }
    })
    */
    return this.translateTo || browserUiLanguageCode;
  }
}
