import { BaseTranslator, TranslationRequestData } from "./BaseTranslator";

export class TestTranslator extends BaseTranslator {
  private texts = {
    es: `Hola mundo
<div id=n0><b id=n1>Hola</b>mundo</div>
<div id=n0><b id=n1>Bienvenidos</b>a Wikipedia,</div>
<div id=n2><br>artículos<b id=n3>en español</b>.</div>
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
    en: `Hello World
<div id=n0><b id=n1>Hello</b> world</div>
<div id=n0><b id=n1>Welcome</b> to Wikipedia,</div>
<div id=n2><br>articles <b id=n3>in Spanish</b> .</div>
<div id=n0>the free content encyclopedia<br> that <b id=n1>everyone can edit</b></div>
<div id=n0><b id=n1>Welcome</b> to Wikipedia,</div>
<div id=n2>the free content encyclopedia<br> that <b id=n3>everyone can edit</b> .</div>
Search 1 654 526 items
<div id=n5><br>articles <b id=n6>in Spanish</b> .</div>
Coffee
How to collaborate?
First steps
Help
Contact
`.split("\n"),
  };

  async translate(): Promise<{
    characterCount: number;
  }> {
    // Gather translation texts to send for translation
    let translationRequestData: TranslationRequestData = {
      texts: [],
      translationRoots: [],
    };
    const { translationRoots } = this.translationDocument;
    translationRoots.forEach(translationRoot => {
      let text = this.translationDocument.generateTextForItem(translationRoot);
      if (!text) {
        return;
      }
      translationRequestData.translationRoots.push(translationRoot);
      translationRequestData.texts.push(text);
    });

    // Translate and parse translation results
    translationRequestData.translationRoots.forEach(
      (translationRoot, index) => {
        const sourceText = translationRequestData.texts[index];
        const textIndex = this.texts[this.sourceLanguage].indexOf(sourceText);
        const translation = this.texts[this.targetLanguage][textIndex];
        translationRoot.parseTranslationResult(translation);
      },
    );

    return { characterCount: -1 };
  }
}
