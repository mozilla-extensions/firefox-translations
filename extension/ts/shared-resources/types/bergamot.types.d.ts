export interface DetectedLanguageResults {
  confident: boolean;
  language: string;
  languages: {
    languageCode: string;
    percent: number;
  }[];
}
export interface FrameInfo {
  windowId: number;
  tabId: number;
  frameId: number;
}
