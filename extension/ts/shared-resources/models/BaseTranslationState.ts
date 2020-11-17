import { Model, model, prop } from "mobx-keystone";
import { DetectedLanguageResults } from "../bergamot.types";

export enum TranslationStatus {
  UNKNOWN = "UNKNOWN",
  UNAVAILABLE = "UNAVAILABLE",
  DETECTING_LANGUAGE = "DETECTING_LANGUAGE",
  LANGUAGE_NOT_DETECTED = "LANGUAGE_NOT_DETECTED",
  TRANSLATION_NOT_PREFERRED = "TRANSLATION_NOT_PREFERRED",
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
  requestQualityEstimation: prop<boolean>({ setterAction: true }),
  detectedLanguageResults: prop<DetectedLanguageResults | null>(() => null, {
    setterAction: true,
  }),
  sourceLanguage: prop<string>({ setterAction: true }),
  targetLanguage: prop<string>({ setterAction: true }),
  translationStatus: prop<TranslationStatus>(TranslationStatus.UNKNOWN, {
    setterAction: true,
  }),
}) {}
