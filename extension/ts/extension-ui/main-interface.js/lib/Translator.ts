import { ContentScriptBergamotApiClient } from "../../../shared-resources/ContentScriptBergamotApiClient";

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
    const nbestTranslations = this.bergamotApiClient.parseNbestTranslationsFromResponse(
      translationResults,
    );
    return nbestTranslations[0];
  }
}
