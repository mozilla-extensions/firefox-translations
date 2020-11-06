export type TranslationRequestData = [Element, string][];
export interface TranslationRequest {
  data: TranslationRequestData;
  finished: boolean;
  lastIndex: number;
}
