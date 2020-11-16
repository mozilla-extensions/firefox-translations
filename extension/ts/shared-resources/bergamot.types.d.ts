export type TranslationRequestData = [Element, string][];
export interface TranslationRequest {
  data: TranslationRequestData;
  finished: boolean;
  lastIndex: number;
}
export interface DetectedLanguageResults {
  confident: boolean;
  language: string;
  languages: {
    languageCode: string;
    percent: number;
  }[];
}
