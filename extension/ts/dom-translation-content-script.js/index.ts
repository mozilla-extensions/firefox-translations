import { TranslationChild } from "./TranslationChild";
import { subscribeToExtensionState } from "../shared-resources/subscribeToExtensionState";
import { ContentScriptFrameInfo } from "../shared-resources/ContentScriptFrameInfo";
import { FrameInfo } from "../shared-resources/bergamot.types";
import { ExtensionState } from "../shared-resources/models/ExtensionState";
import { onSnapshot } from "mobx-keystone";
import { TranslationStatus } from "../shared-resources/models/BaseTranslationState";
import { TranslateOwnTextTranslationState } from "../shared-resources/models/TranslateOwnTextTranslationState";
import { DocumentTranslationState } from "../shared-resources/models/DocumentTranslationState";

// Workaround for https://github.com/xaviergonz/mobx-keystone/issues/183
// We need to import some models explicitly lest they fail to be registered by mobx
new ExtensionState({});
new TranslateOwnTextTranslationState({});

/**
 * Note this content script runs at "document_idle" ie after the DOM is complete
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

  const translationChild = new TranslationChild(
    frameInfo,
    document,
    window,
    extensionState,
  );

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

      const currentTabFrameDocumentTranslationState =
        documentTranslationStates[tabFrameReference];

      const previousTabFrameDocumentTranslationState =
        previousDocumentTranslationStates[tabFrameReference];

      console.log({ currentTabFrameDocumentTranslationState });

      // TODO: Possibly react to no current state in some other way
      if (!currentTabFrameDocumentTranslationState) {
        return;
      }

      const hasChanged = property => {
        return (
          !previousTabFrameDocumentTranslationState ||
          currentTabFrameDocumentTranslationState[property] !==
            previousTabFrameDocumentTranslationState[property]
        );
      };

      if (hasChanged("translationRequested")) {
        if (currentTabFrameDocumentTranslationState.translationRequested) {
          console.info("Translating web page");
          await translationChild.doTranslation(
            currentTabFrameDocumentTranslationState.sourceLanguage,
            currentTabFrameDocumentTranslationState.targetLanguage,
          );
          console.info("Translated web page");
          extensionState.patchDocumentTranslationStateByFrameInfo(frameInfo, [
            {
              op: "replace",
              path: ["translationRequested"],
              value: false,
            },
          ]);
        }
      }

      if (hasChanged("translationStatus")) {
        if (
          currentTabFrameDocumentTranslationState.translationStatus ===
          TranslationStatus.UNKNOWN
        ) {
          await translationChild.attemptToDetectLanguage();
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
      }

      if (hasChanged("showOriginal")) {
        if (
          translationChild?.contentWindow?.translationDocument &&
          currentTabFrameDocumentTranslationState.showOriginal !==
            translationChild.contentWindow.translationDocument.originalShown
        ) {
          if (
            translationChild.contentWindow.translationDocument.originalShown
          ) {
            translationChild.contentWindow.translationDocument.showTranslation();
          } else {
            translationChild.contentWindow.translationDocument.showOriginal();
          }
        }
      }

      return;
    },
  );

  // Add an initial document translation state
  try {
    extensionState.setDocumentTranslationState(
      new DocumentTranslationState({
        ...frameInfo,
        translationStatus: TranslationStatus.UNKNOWN,
      }),
    );
  } catch (err) {
    console.error("Instantiate DocumentTranslationState error", err);
  }
};
// noinspection JSIgnoredPromiseFromCall
init();
