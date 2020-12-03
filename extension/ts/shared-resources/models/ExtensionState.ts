import {
  applyPatches,
  Model,
  model,
  modelAction,
  Patch,
  prop,
  prop_mapObject,
} from "mobx-keystone";
import { DocumentTranslationState } from "./DocumentTranslationState";
import { FragmentTranslationState } from "./FragmentTranslationState";
import { TranslateOwnTextTranslationState } from "./TranslateOwnTextTranslationState";
import { computed } from "mobx";
import { FrameInfo } from "../bergamot.types";

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
    console.debug("UPDATED A DTS - PROPAGATING??", { patches });
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
