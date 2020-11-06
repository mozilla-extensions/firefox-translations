export class ContentScriptLanguageDetectorProxy {
  static async detectLanguage(
    str: string,
  ): Promise<{ confident: boolean; language: string }> {
    return { confident: true, language: "foo" };
  }
}
