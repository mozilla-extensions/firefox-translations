import { TranslationChild } from "./TranslationChild";
import { subscribeToExtensionState } from "../shared-resources/subscribeToExtensionState";
import { ContentScriptFrameInfo } from "../shared-resources/ContentScriptFrameInfo";
import { FrameInfo } from "../shared-resources/bergamot.types";
import { ExtensionState } from "../shared-resources/models/ExtensionState";

// Workaround for https://github.com/xaviergonz/mobx-keystone/issues/183
// We need to import some models explicitly lest they fail to be registered by mobx
new ExtensionState({});

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
  const contentScriptFrameInfo = new ContentScriptFrameInfo();

  // Get window, tab and frame id
  const frameInfo: FrameInfo = await contentScriptFrameInfo.getCurrentFrameInfo();

  const extensionState = await subscribeToExtensionState();
  console.log({ extensionState });

  const translationChild = new TranslationChild(
    frameInfo,
    document,
    window,
    extensionState,
  );
  const stateAfterCheckForTranslation = await translationChild.checkForTranslation();
  console.debug({ stateAfterCheckForTranslation });
  const translationResult = await translationChild.doTranslation("foo", "bar");
  console.debug({ translationResult });
};
// noinspection JSIgnoredPromiseFromCall
init();
