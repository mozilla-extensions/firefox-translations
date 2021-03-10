import { TranslationDocument } from "../TranslationDocument";

export class MinimalDomTranslator {
  public readonly translationDocument: TranslationDocument;
  public readonly sourceLanguage: string;
  public readonly targetLanguage: string;
  /**
   * @param translationDocument  The TranslationDocument object that represents
   *                             the webpage to be translated
   * @param sourceLanguage       The source language of the document
   * @param targetLanguage       The target language for the translation
   */
  constructor(
    translationDocument: TranslationDocument,
    sourceLanguage: string,
    targetLanguage: string,
  ) {
    this.translationDocument = translationDocument;
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
  }
  async translate(): Promise<{
    characterCount: number;
  }> {
    return { characterCount: -1 };
  }
}
