import { ContentScriptBergamotApiClient } from "../shared-resources/ContentScriptBergamotApiClient";
import { TranslationChild } from "./TranslationChild";

/**
 * Note that running the content script at "document_idle" guarantees it to run after the DOM is complete
 */
const init = async () => {
  /*
  await initErrorReportingInContentScript(
    "port-from-document-translation-content-script:index",
  );
  */
  console.debug({ document, window });

  const bergamotApiClient = new ContentScriptBergamotApiClient();
  (window as any).bergamotApiClient = bergamotApiClient;

  const translationChild = new TranslationChild(document, window);
  translationChild.checkForTranslation();

  const translationResults = await bergamotApiClient.sendTranslationRequest([
    "Hello world",
    "Foo bar",
    "Una prueba",
  ]);
  console.log({ translationResults });
};
// noinspection JSIgnoredPromiseFromCall
init();
