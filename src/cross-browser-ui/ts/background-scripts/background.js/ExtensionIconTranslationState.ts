/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { browser } from "webextension-polyfill-ts";
import { DynamicActionIcon } from "./DynamicActionIcon";
import { onSnapshot, SnapshotOutOf } from "mobx-keystone";
import { TranslationStatus } from "../../../../core/ts/shared-resources/models/BaseTranslationState";
import { ExtensionState } from "../../../../core/ts/shared-resources/models/ExtensionState";
import { DocumentTranslationState } from "../../../../core/ts/shared-resources/models/DocumentTranslationState";

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
      async (documentTranslationStates, _previousDocumentTranslationStates) => {
        // console.log("documentTranslationStates snapshot HAS CHANGED", {documentTranslationStates});

        // To make things a bit simpler, we let the ui reflect only the translation state of the top frame in each tab
        // and assume that child frames (if present) are in a similar state
        // TODO: Update to use TabTranslationState like firefox-infobar-ui does
        const tabTopFrameStates = Object.keys(documentTranslationStates)
          .map(
            (tabAndFrameId: string) => documentTranslationStates[tabAndFrameId],
          )
          .filter(
            (dts: SnapshotOutOf<DocumentTranslationState>) => dts.frameId === 0,
          );

        for (const dts of tabTopFrameStates) {
          const { tabId } = dts;
          if (!dynamicActionIcons.has(tabId)) {
            dynamicActionIcons.set(
              tabId,
              new DynamicActionIcon(
                // tabId,
                browser.browserAction,
                48,
                48,
                // 24,
                // 29,
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

        // TODO: check _previousDocumentTranslationStates for those that had something and now should be inactive
      },
    );
  }
}
