import { TranslationChild } from "./TranslationChild";
import { subscribeToExtensionState } from "../shared-resources/subscribeToExtensionState";
import { ContentScriptFrameInfo } from "../shared-resources/ContentScriptFrameInfo";
import { FrameInfo } from "../shared-resources/bergamot.types";
import { ExtensionState } from "../shared-resources/models/ExtensionState";
import { onSnapshot } from "mobx-keystone";
import { TranslationStatus } from "../shared-resources/models/BaseTranslationState";

// Workaround for https://github.com/xaviergonz/mobx-keystone/issues/183
// We need to import some models explicitly lest they fail to be registered by mobx
new ExtensionState({});

/**
 * Note that running the content script at "document_idle" guarantees it to run after the DOM is complete
 */
const init = async () => {
  /*
  await initErrorReportingInContentScript(
    "port-from-dom-translation-content-script:index",
  );
  */
  console.debug({ document, window });
  const contentScriptFrameInfo = new ContentScriptFrameInfo();

  // Get window, tab and frame id
  const frameInfo: FrameInfo = await contentScriptFrameInfo.getCurrentFrameInfo();
  const tabFrameReference = `${frameInfo.tabId}-${frameInfo.frameId}`;

  const extensionState = await subscribeToExtensionState();
  // console.log({ extensionState });

  const translationChild = new TranslationChild(
    frameInfo,
    document,
    window,
    extensionState,
  );

  // This sets off the translation flow
  await translationChild.attemptToDetectLanguage();

  // TODO: Prevent multiple translations from occurring simultaneously + enable cancellations of existing translation jobs

  // Any subsequent actions are determined by document translation state changes
  onSnapshot(
    extensionState.$.documentTranslationStates,
    async (documentTranslationStates, previousDocumentTranslationStates) => {
      console.log(
        "dom-translation-content-script.js - documentTranslationStates snapshot HAS CHANGED",
        {
          documentTranslationStates,
        },
      );

      // Pick out the relevant state here
      const currentTabFrameDocumentTranslationState =
        documentTranslationStates[tabFrameReference];

      console.log(
        Object.keys(documentTranslationStates),
        currentTabFrameDocumentTranslationState,
      );

      if (
        currentTabFrameDocumentTranslationState.translationStatus ===
        TranslationStatus.OFFER
      ) {
        if (currentTabFrameDocumentTranslationState.translationRequested) {
          const translationResult = await translationChild.doTranslation(
            currentTabFrameDocumentTranslationState.sourceLanguage,
            currentTabFrameDocumentTranslationState.targetLanguage,
          );
          console.debug({ translationResult });
        }
      }

      if (
        currentTabFrameDocumentTranslationState.translationStatus ===
        TranslationStatus.TRANSLATING
      ) {
        if (currentTabFrameDocumentTranslationState.cancellationRequested) {
          console.debug("Cancellation requested");
          console.debug("TODO: Implement");
        }
      }

      if (
        currentTabFrameDocumentTranslationState.translationStatus ===
        TranslationStatus.TRANSLATING
      ) {
        if (currentTabFrameDocumentTranslationState.cancellationRequested) {
          console.debug("Cancellation requested");
          console.debug("TODO: Implement");
        }
      }

      if (
        currentTabFrameDocumentTranslationState.originalShown !==
        translationChild.contentWindow.translationDocument.originalShown
      ) {
        if (translationChild.contentWindow.translationDocument.originalShown) {
          translationChild.contentWindow.translationDocument.showTranslation();
        } else {
          translationChild.contentWindow.translationDocument.showOriginal();
        }
      }

      return;
    },
  );
};
// noinspection JSIgnoredPromiseFromCall
init();
