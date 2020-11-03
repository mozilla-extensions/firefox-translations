import { BergamotApiClient } from "../../shared-resources/BergamotApiClient";

export class Translator {
  originLanguage: string;
  targetLanguage: string;
  bergamotApiClient: BergamotApiClient;
  delay: number;

  constructor(originLanague: string, targetLanguage: string) {
    this.originLanguage = "English";
    this.targetLanguage = "German";
    this.bergamotApiClient = new BergamotApiClient();
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
