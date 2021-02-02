/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  applyPatches,
  Model,
  model,
  modelAction,
  Patch,
  prop_mapObject,
} from "mobx-keystone";
import { DocumentTranslationState } from "./DocumentTranslationState";
import { FragmentTranslationState } from "./FragmentTranslationState";
import { TranslateOwnTextTranslationState } from "./TranslateOwnTextTranslationState";
import { FrameInfo } from "../types/bergamot.types";

export const documentTranslationStateMapKey = (frameInfo: FrameInfo) =>
  `${frameInfo.tabId}-${frameInfo.frameId}`;

export const translateOwnTextTranslationStateMapKey = (
  totts: TranslateOwnTextTranslationState,
) => `${totts.tabId}`;

@model("bergamotTranslate/ExtensionState")
export class ExtensionState extends Model({
  documentTranslationStates: prop_mapObject(
    () => new Map<string, DocumentTranslationState>(),
  ),
  fragmentTranslationStates: prop_mapObject(
    () => new Map<string, FragmentTranslationState>(),
  ),
  translateOwnTextTranslationStates: prop_mapObject(
    () => new Map<string, TranslateOwnTextTranslationState>(),
  ),
}) {
  @modelAction
  setDocumentTranslationState(
    documentTranslationState: DocumentTranslationState,
  ) {
    this.documentTranslationStates.set(
      documentTranslationStateMapKey(documentTranslationState),
      documentTranslationState,
    );
  }
  @modelAction
  patchDocumentTranslationStateByFrameInfo(
    frameInfo: FrameInfo,
    patches: Patch[],
  ) {
    const key = documentTranslationStateMapKey(frameInfo);
    const dts = this.documentTranslationStates.get(key);
    applyPatches(dts, patches);
    this.documentTranslationStates.set(key, dts);
  }
  @modelAction
  deleteDocumentTranslationStateByFrameInfo(frameInfo: FrameInfo) {
    this.documentTranslationStates.delete(
      documentTranslationStateMapKey(frameInfo),
    );
  }
  @modelAction
  setTranslateOwnTextTranslationState(
    translateOwnTextTranslationState: TranslateOwnTextTranslationState,
  ) {
    this.translateOwnTextTranslationStates.set(
      translateOwnTextTranslationStateMapKey(translateOwnTextTranslationState),
      translateOwnTextTranslationState,
    );
  }
  @modelAction
  deleteTranslateOwnTextTranslationState(
    translateOwnTextTranslationState: TranslateOwnTextTranslationState,
  ) {
    this.translateOwnTextTranslationStates.delete(
      translateOwnTextTranslationStateMapKey(translateOwnTextTranslationState),
    );
  }
}
