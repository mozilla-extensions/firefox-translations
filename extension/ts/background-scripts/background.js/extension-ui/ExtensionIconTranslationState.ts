import { browser } from "webextension-polyfill-ts";
import { DynamicActionIcon } from "./DynamicActionIcon";
import { ModelInstanceData, onSnapshot } from "mobx-keystone";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";
import { DocumentTranslationState } from "../../../shared-resources/models/DocumentTranslationState";
import { TranslationStatus } from "../../../shared-resources/models/BaseTranslationState";

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
        // console.log("documentTranslationStates snapshot HAS CHANGED", {documentTranslationStates});

        const tabTopFrameStates = Object.keys(documentTranslationStates)
          .map(
            (tabAndFrameId: string) => documentTranslationStates[tabAndFrameId],
          )
          .filter(
            (dts: ModelInstanceData<DocumentTranslationState>) =>
              dts.frameId === 0,
          );

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

          if (dts.translationStatus === TranslationStatus.UNAVAILABLE) {
            await dynamicActionIcon.setIcon({
              path: "icons/extension-icon.inactive.48x48.png",
              tabId,
            });
          } else {
            await dynamicActionIcon.setIcon({
              path: "icons/extension-icon.48x48.png",
              tabId,
            });
          }

          switch (dts.translationStatus) {
            case TranslationStatus.UNAVAILABLE:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: "",
                  textColor: "#000000",
                  backgroundColor: "#ffffffAA",
                },
                tabId,
              );
              break;
            case TranslationStatus.DETECTING_LANGUAGE:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: "",
                  textColor: "#000000",
                  backgroundColor: "#ffffffAA",
                },
                tabId,
              );
              break;
            case TranslationStatus.LANGUAGE_NOT_DETECTED:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: "??",
                  textColor: "#000000",
                  backgroundColor: "#ffffffAA",
                },
                tabId,
              );
              break;
            case TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              if (dts.detectedLanguageResults) {
                dynamicActionIcon.drawBadge(
                  {
                    text: dts.detectedLanguageResults.language,
                    textColor: "#888888",
                    backgroundColor: "#ffffffAA",
                  },
                  tabId,
                );
              }
              break;
            case TranslationStatus.TRANSLATION_UNSUPPORTED:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: dts.detectedLanguageResults.language,
                  textColor: "#000000",
                  backgroundColor: "#ffbbbbAA",
                },
                tabId,
              );
              break;
            case TranslationStatus.OFFER:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: dts.detectedLanguageResults.language,
                  textColor: "#000000",
                  backgroundColor: "#ffffffAA",
                },
                tabId,
              );
              break;
            case TranslationStatus.DOWNLOADING_TRANSLATION_MODEL:
              dynamicActionIcon.setBadge(
                {
                  text: dts.detectedLanguageResults.language,
                  textColor: "#000000",
                  backgroundColor: "#ffffffAA",
                },
                tabId,
              );
              dynamicActionIcon.startLoadingIndication(tabId);
              break;
            case TranslationStatus.TRANSLATING:
              dynamicActionIcon.setBadge(
                {
                  text: dts.detectedLanguageResults.language,
                  textColor: "#000000",
                  backgroundColor: "#ffffffAA",
                },
                tabId,
              );
              dynamicActionIcon.startLoadingIndication(tabId);
              break;
            case TranslationStatus.TRANSLATED:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: dts.translateTo,
                  textColor: "#ffffff",
                  backgroundColor: "#000000AA",
                },
                tabId,
              );
              break;
            case TranslationStatus.ERROR:
              await dynamicActionIcon.stopLoadingIndication(tabId);
              dynamicActionIcon.drawBadge(
                {
                  text: " ! ",
                  textColor: "#ffffff",
                  backgroundColor: "#ff0000AA",
                },
                tabId,
              );
              break;
          }
        }

        // TODO: check previousDocumentTranslationStates for those that had something and now should be inactive
      },
    );
  }
}
