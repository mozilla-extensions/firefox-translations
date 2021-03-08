/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BaseDomTranslator, TranslationRequestData } from "./BaseDomTranslator";

export class TestDomTranslator extends BaseDomTranslator {
  private texts = {
    es: [
      "Hola mundo",
      "<div id=n0><b id=n1>Hola</b> mundo</div>",
      "<div id=n0><b id=n1>Bienvenidos</b> a Wikipedia,</div>",
      "<div id=n2> la enciclopedia de contenido libre<br>que <b id=n3>todos pueden editar</b>. </div>",
      "<div id=n4><br> artículos <b id=n5>en español</b>. </div>",
      "<div id=n0><br><b id=n1>(hace 50 años)</b>: Fallece <b id=n2>Chandrasekhara Raman</b>, físico indio (n. 1888; <b id=n3>en la imagen</b>), premio Nobel de física en 1930.</div>",
      "<div id=n0> la enciclopedia de contenido libre<br>que <b id=n1>todos pueden editar</b></div>",
      "<div id=n0><br><b id=n1>(hace 400 años)</b>: En Estados Unidos, se firma el <b id=n2>Pacto del Mayflower</b>, que establece un Gobierno.</div>",
      "Buscar en 1 654 526 artículos",
      "<div id=n5><br> artículos <b id=n6>en español</b>. </div>",
      "Café",
      "¿Cómo colaborar?",
      "Primeros pasos",
      "Ayuda",
      "Contacto",
    ],
    en: [
      "Hello world",
      '<div id="n0"><b id="n1">Hello</b> world</div>',
      '<div id="n0"><b id="n1">Welcome</b> to Wikipedia,</div>',
      '<div id="n2"> the encyclopedia of free content<br>that <b id="n3">everyone can edit.</b></div>',
      '<div id="n4"><br> articles <b id="n5">in Spanish.</b></div>',
      '<div id="n0"><br><b id="n1">(50 years ago):</b> Chandrasekhara Raman, <b id="n2">Indian physicist</b> dies (n 1888; in pictures), <b id="n3">Nobel laureate in</b> 1930.</div>',
      '<div id="n0"> the encyclopedia of free content<br>that <b id="n1">can all edit</b></div>',
      '<div id="n0"><br><b id="n1">(400 years ago):</b> In the United States, the Mayflower Pact, <b id="n2">which establishes a</b> government, is signed.</div>',
      "Search in 1 654 526 articles",
      '<div id="n5"><br> articles <b id="n6">in Spanish.</b></div>',
      "Coffee",
      "How do you collaborate?",
      "First steps",
      "Help",
      "Contact",
    ],
  };

  normalizeWhitespace = (text: string) => {
    return decodeURIComponent(
      encodeURIComponent(text)
        .split("%C2%A0")
        .join("%20"),
    );
  };

  getNormalizedTexts = sourceLanguage =>
    this.texts[sourceLanguage].map(this.normalizeWhitespace);

  getTargetLanguageTexts = targetLanguage =>
    this.texts[targetLanguage].map(this.normalizeWhitespace);

  targetLanguageTexts = this.texts[this.targetLanguage].map(
    this.normalizeWhitespace,
  );

  async translate(): Promise<{
    characterCount: number;
  }> {
    // Gather translation texts to send for translation
    let translationRequestData: TranslationRequestData = {
      markupsToTranslate: this.translationDocument.getMarkupsToTranslate(),
    };
    const { translationRoots } = this.translationDocument;

    // Return early with a noop if there is nothing to translate
    if (translationRoots.length === 0) {
      console.info("Found nothing to translate");
      return { characterCount: 0 };
    }

    const sourceLanguageTexts = this.getNormalizedTexts(this.sourceLanguage);
    const targetLanguageTexts = this.getNormalizedTexts(this.targetLanguage);

    // Translate and parse translation results
    translationRoots.forEach((translationRoot, index) => {
      const sourceText = this.normalizeWhitespace(
        translationRequestData.markupsToTranslate[index],
      );
      const textIndex = sourceLanguageTexts.indexOf(sourceText);
      let translation;
      if (textIndex === -1) {
        const warning = `TestDomTranslator: Source translation text not found for "${sourceText}" (${this.sourceLanguage}->${this.targetLanguage}):`;
        console.warn(
          warning,
          { sourceLanguageTexts },
          sourceLanguageTexts[7],
          sourceText,
          encodeURIComponent(sourceLanguageTexts[7]),
          encodeURIComponent(sourceText),
        );
        translation = warning;
      } else {
        translation = targetLanguageTexts[textIndex];
        if (!translation) {
          const warning = `TestDomTranslator: Target translation text missing for "${sourceText}" at index ${textIndex} (${this.sourceLanguage}->${this.targetLanguage})`;
          console.warn(warning);
          translation = warning;
        }
      }
      translationRoot.parseTranslationResult(translation);
    });

    return { characterCount: -1 };
  }
}
