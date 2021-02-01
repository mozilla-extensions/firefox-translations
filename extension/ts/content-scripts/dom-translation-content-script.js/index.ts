import { onSnapshot, SnapshotOutOf } from "mobx-keystone";
import { DomTranslator } from "./DomTranslator";
import { subscribeToExtensionState } from "../../shared-resources/state-management/subscribeToExtensionState";
import { DocumentTranslationStateCommunicator } from "../../shared-resources/state-management/DocumentTranslationStateCommunicator";
import { FrameInfo } from "../../shared-resources/types/bergamot.types";
import { ContentScriptFrameInfo } from "../../shared-resources/ContentScriptFrameInfo";
import { ExtensionState } from "../../shared-resources/models/ExtensionState";
import { TranslationStatus } from "../../shared-resources/models/BaseTranslationState";
import { TranslateOwnTextTranslationState } from "../../shared-resources/models/TranslateOwnTextTranslationState";
import { DocumentTranslationState } from "../../shared-resources/models/DocumentTranslationState";
import { TranslationDocument } from "./TranslationDocument";

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
  const documentTranslationStateCommunicator = new DocumentTranslationStateCommunicator(
    frameInfo,
    extensionState,
  );

  const translationChild = new DomTranslator(
    documentTranslationStateCommunicator,
    document,
    window,
  );

  const documentTranslationStatistics = await translationChild.getDocumentTranslationStatistics();
  console.log({ documentTranslationStatistics });

  // TODO: Prevent multiple translations from occurring simultaneously + enable cancellations of existing translation jobs

  // Any subsequent actions are determined by document translation state changes
  onSnapshot(
    extensionState.$.documentTranslationStates,
    async (documentTranslationStates, previousDocumentTranslationStates) => {
      // console.debug("dom-translation-content-script.js - documentTranslationStates snapshot HAS CHANGED", {documentTranslationStates});

      const currentTabFrameDocumentTranslationState: SnapshotOutOf<DocumentTranslationState> =
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
          /* TODO: Do not translate if already translated
        if (
          translationChild?.contentWindow?.translationDocument &&
          currentTabFrameDocumentTranslationState.translateFrom !==
            translationChild.contentWindow.translationDocument.sourceLanguage
        ) {
          */

          console.info("Translating web page");
          await translationChild.doTranslation(
            currentTabFrameDocumentTranslationState.translateFrom,
            currentTabFrameDocumentTranslationState.translateTo,
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
      }

      if (translationChild?.contentWindow?.translationDocument) {
        const translationDocument: TranslationDocument =
          translationChild?.contentWindow?.translationDocument;

        if (hasChanged("showOriginal")) {
          if (
            currentTabFrameDocumentTranslationState.showOriginal !==
            translationDocument.originalShown
          ) {
            if (translationDocument.originalShown) {
              translationDocument.showTranslation();
            } else {
              translationDocument.showOriginal();
            }
          }
        }

        if (hasChanged("displayQualityEstimation")) {
          if (
            translationChild?.contentWindow?.translationDocument &&
            currentTabFrameDocumentTranslationState.displayQualityEstimation !==
              translationDocument.qualityEstimationShown
          ) {
            if (translationDocument.qualityEstimationShown) {
              translationDocument.showTranslation();
            } else {
              translationDocument.showQualityEstimation();
            }
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
        url: window.location.href,
        wordCount: documentTranslationStatistics.wordCount,
        wordCountInViewport: documentTranslationStatistics.wordCountInViewport,
        wordCountVisibleInViewport:
          documentTranslationStatistics.wordCountVisibleInViewport,
      }),
    );
  } catch (err) {
    console.error("Instantiate DocumentTranslationState error", err);
  }
};
// noinspection JSIgnoredPromiseFromCall
init();
