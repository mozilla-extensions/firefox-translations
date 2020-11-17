import { DynamicActionIcon } from "./lib/DynamicActionIcon";
import { browser } from "webextension-polyfill-ts";
import { ExtensionState } from "../shared-resources/models/ExtensionState";
import { ModelInstanceData, onSnapshot } from "mobx-keystone";
import { DocumentTranslationState } from "../shared-resources/models/DocumentTranslationState";

export class ExtensionIconTranslationState {
  private extensionState: ExtensionState;

  constructor(extensionState) {
    this.extensionState = extensionState;
  }

  async init() {
    // React to document translation state changes
    const dynamicActionIcons: Map<number, DynamicActionIcon> = new Map<
      number,
      DynamicActionIcon
    >();
    onSnapshot(
      this.extensionState.$.documentTranslationStates,
      async (documentTranslationStates, previousDocumentTranslationStates) => {
        console.log("documentTranslationStates snapshot HAS CHANGED", {
          documentTranslationStates,
        });

        const tabTopFrameStates = Object.keys(documentTranslationStates)
          .map(
            (tabAndFrameId: string) => documentTranslationStates[tabAndFrameId],
          )
          .filter(
            (dts: ModelInstanceData<DocumentTranslationState>) =>
              dts.frameId === 0,
          );
        console.log(Object.keys(documentTranslationStates));

        for (const dts of tabTopFrameStates) {
          const { tabId } = dts;
          if (!dynamicActionIcons.has(tabId)) {
            dynamicActionIcons.set(
              tabId,
              new DynamicActionIcon(
                tabId,
                browser.browserAction,
                48,
                48,
                24,
                29,
              ),
            );
          }
          const dynamicActionIcon = dynamicActionIcons.get(tabId);
          await dynamicActionIcon.setIcon({
            path: "icons/extension-icon.48x48.png",
            tabId,
          });
          dynamicActionIcon.stopLoadingAnimation(tabId);
          if (dts.detectedLanguageResults) {
            dynamicActionIcon.drawBadge(
              {
                text: dts.detectedLanguageResults.language,
                textColor: "#000000",
                backgroundColor: "#ffffffAA",
              },
              tabId,
            );
          }

          // TODO:
          /*
        dynamicActionIcon.startLoadingAnimation(tabId);

        dynamicActionIcon.stopLoadingAnimation(tabId);
        dynamicActionIcon.drawBadge(
          {
            text: "..",
            textColor: "#ffffff",
            backgroundColor: "#000000AA",
          },
          tabId,
        );
        */
        }

        // TODO: check previousDocumentTranslationStates for those that had something and now should be inactive
      },
    );
  }
}
