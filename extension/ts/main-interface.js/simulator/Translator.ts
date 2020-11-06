import { ContentScriptBergamotApiClient } from "../../shared-resources/ContentScriptBergamotApiClient";

export class Translator {
  originLanguage: string;
  targetLanguage: string;
  bergamotApiClient: ContentScriptBergamotApiClient;
  delay: number;

  constructor(originLanague: string, targetLanguage: string) {
    this.originLanguage = "English";
    this.targetLanguage = "German";
    this.bergamotApiClient = new ContentScriptBergamotApiClient();
    this.delay = 3000;
  }

  async translate(text: string) {
    const translationResults = await this.bergamotApiClient.sendTranslationRequest(
      [text],
    );
    console.log({ translationResults });
    return translationResults[0];
  }

  setDelay(milliseconds: number) {
    this.delay = milliseconds;
  }

  getOriginLanguage() {
    return this.originLanguage;
  }

  getTargetLanguage() {
    return this.targetLanguage;
  }

  setOriginLanguage(language: string) {
    this.originLanguage = language;
  }

  setTargetLanguage(language: string) {
    this.targetLanguage = language;
  }
}
