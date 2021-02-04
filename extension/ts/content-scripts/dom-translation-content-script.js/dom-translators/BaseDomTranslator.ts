/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TranslationDocument } from "../TranslationDocument";

export interface TranslationRequestData {
  stringsToTranslate: string[];
}

export interface TranslationResponseData {
  translatedStrings: string[];
  qeAnnotatedTranslatedStrings: string[];
}

export class BaseDomTranslator {
  public readonly translationDocument: TranslationDocument;
  public readonly sourceLanguage: string;
  public readonly targetLanguage: string;
  public translatedCharacterCount: number;

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
    this.translatedCharacterCount = 0;
  }

  async translate(): Promise<{
    characterCount: number;
  }> {
    return { characterCount: -1 };
  }
}
