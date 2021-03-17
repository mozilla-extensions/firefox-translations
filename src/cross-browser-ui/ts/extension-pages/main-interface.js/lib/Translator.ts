import { ContentScriptBergamotApiClient } from "../../../../../core/ts/shared-resources/ContentScriptBergamotApiClient";

export class Translator {
  bergamotApiClient: ContentScriptBergamotApiClient;

  constructor() {
    this.bergamotApiClient = new ContentScriptBergamotApiClient();
  }

  async translate(
    originLanguage: string,
    targetLanguage: string,
    text: string,
  ) {
    const translationResults = await this.bergamotApiClient.sendTranslationRequest(
      [text],
      originLanguage,
      targetLanguage,
    );
    return translationResults.translatedTexts[0];
  }
}
