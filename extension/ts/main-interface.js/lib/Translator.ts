import { ContentScriptBergamotApiClient } from "../../shared-resources/ContentScriptBergamotApiClient";

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
    );
    const nbestTranslations = this.bergamotApiClient.parseNbestTranslationsFromResponse(
      translationResults,
    );
    console.log({ nbestTranslations });
    return nbestTranslations[0];
  }
}
