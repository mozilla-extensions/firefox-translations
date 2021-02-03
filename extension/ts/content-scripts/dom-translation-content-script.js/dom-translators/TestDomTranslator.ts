import { BaseDomTranslator, TranslationRequestData } from "./BaseDomTranslator";

export class TestDomTranslator extends BaseDomTranslator {
  private texts = {
    es: `Hola mundo
<div id=n0><b id=n1>Hola</b>mundo</div>
<div id=n0><b id=n1>Bienvenidos</b>a Wikipedia,</div>
<div id=n4><br>artículos<b id=n5>en español</b>.</div>
<div id=n0>la enciclopedia de contenido libre<br>que<b id=n1>todos pueden editar</b></div>
<div id=n0><b id=n1>Bienvenidos</b>a Wikipedia,</div>
<div id=n2>la enciclopedia de contenido libre<br>que<b id=n3>todos pueden editar</b>.</div>
Buscar en 1 654 526 artículos
<div id=n5><br>artículos<b id=n6>en español</b>.</div>
Café
¿Cómo colaborar?
Primeros pasos
Ayuda
Contacto`.split("\n"),
    en: `Hello world
<div id=n0><b id=n1>Hello</b>world</div>
<div id=n0><b id=n1>Welcome</b>to Wikipedia,</div>
<div id=n4><br>articles <b id=n5>in Spanish</b>.</div>
<div id=n0>the encyclopedia of free content<br> that <b id=n1>everyone can edit</b></div>
<div id=n0><b id=n1>Welcome</b>to Wikipedia,</div>
<div id=n2>the encyclopedia of free content<br> that <b id=n3>everyone can edit</b>.</div>
Search in 1 654 526 articles
<div id=n5><br>articles<b id=n6>in Spanish</b>.</div>
Coffee
How do you collaborate?
First steps
Help
Contact`.split("\n"),
  };

  async translate(): Promise<{
    characterCount: number;
  }> {
    // Gather translation texts to send for translation
    let translationRequestData: TranslationRequestData = {
      stringsToTranslate: [],
      translationRoots: [],
    };
    const { translationRoots } = this.translationDocument;
    translationRoots.forEach(translationRoot => {
      let text = this.translationDocument.generateMarkupToTranslate(
        translationRoot,
      );
      if (!text) {
        return;
      }
      translationRequestData.translationRoots.push(translationRoot);
      translationRequestData.stringsToTranslate.push(text);
    });

    const normalizeWhitespace = (text: string) => {
      return decodeURIComponent(
        encodeURIComponent(text)
          .split("%C2%A0")
          .join("%20"),
      );
    };

    const sourceLanguageTexts = this.texts[this.sourceLanguage].map(
      normalizeWhitespace,
    );
    const targetLanguageTexts = this.texts[this.targetLanguage].map(
      normalizeWhitespace,
    );

    // Translate and parse translation results
    translationRequestData.translationRoots.forEach(
      (translationRoot, index) => {
        const sourceText = normalizeWhitespace(
          translationRequestData.stringsToTranslate[index],
        );
        const textIndex = sourceLanguageTexts.indexOf(sourceText);
        if (textIndex === -1) {
          console.warn(
            `TestDomTranslator: Source translation text not found for "${sourceText}" (${this.sourceLanguage}->${this.targetLanguage}):`,
            { sourceLanguageTexts },
            sourceLanguageTexts[7],
            sourceText,
            encodeURIComponent(sourceLanguageTexts[7]),
            encodeURIComponent(sourceText),
          );
        }
        const translation = targetLanguageTexts[textIndex];
        if (!translation) {
          console.warn(
            `TestDomTranslator: Target translation text missing for "${sourceText}" at index ${textIndex} (${this.sourceLanguage}->${this.targetLanguage})`,
          );
        }
        translationRoot.parseTranslationResult(translation);
      },
    );

    return { characterCount: -1 };
  }
}
