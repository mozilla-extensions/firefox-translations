/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Model, model, prop, prop_mapObject } from "mobx-keystone";
import { DetectedLanguageResults } from "../../background-scripts/background.js/lib/LanguageDetector";
import { computed } from "mobx";
import { browser } from "webextension-polyfill-ts";
import { TranslationRequestProgress } from "../../content-scripts/dom-translation-content-script.js/dom-translators/BaseDomTranslator";

/* eslint-disable no-unused-vars, no-shadow */
// TODO: update typescript-eslint when support for this kind of declaration is supported
export enum TranslationStatus {
  UNKNOWN = "UNKNOWN",
  UNAVAILABLE = "UNAVAILABLE",
  DETECTING_LANGUAGE = "DETECTING_LANGUAGE",
  LANGUAGE_NOT_DETECTED = "LANGUAGE_NOT_DETECTED",
  SOURCE_LANGUAGE_UNDERSTOOD = "SOURCE_LANGUAGE_UNDERSTOOD",
  TRANSLATION_UNSUPPORTED = "TRANSLATION_UNSUPPORTED",
  OFFER = "OFFER",
  DOWNLOADING_TRANSLATION_MODEL = "DOWNLOADING_TRANSLATION_MODEL",
  TRANSLATING = "TRANSLATING",
  TRANSLATED = "TRANSLATED",
  ERROR = "ERROR",
}
/* eslint-enable no-unused-vars, no-shadow */

@model("bergamotTranslate/BaseTranslationState")
export class BaseTranslationState extends Model({
  isVisible: prop<boolean>({ setterAction: true }),
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
  progressOfIndividualTranslationRequests: prop_mapObject(
    () => new Map<string, TranslationRequestProgress>(),
  ),
}) {
  @computed
  get effectiveTranslateFrom() {
    return this.translateFrom || this.detectedLanguageResults?.language;
  }
  @computed
  get effectiveTranslateTo() {
    const browserUiLanguageCode = browser.i18n.getUILanguage().split("-")[0];
    return this.translateTo || browserUiLanguageCode;
  }
}
