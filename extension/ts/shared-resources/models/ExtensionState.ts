import { Model, model, modelAction, prop, prop_mapObject } from "mobx-keystone";
import { DocumentTranslationState } from "./DocumentTranslationState";
import { FragmentTranslationState } from "./FragmentTranslationState";
import { TranslateOwnTextTranslationState } from "./TranslateOwnTextTranslationState";

const documentTranslationStateMapKey = (dts: DocumentTranslationState) =>
  `${dts.tabId}-${dts.frameId}`;

@model("bergamotTranslate/ExtensionState")
export class ExtensionState extends Model({
  documentTranslationStates: prop_mapObject(
    () => new Map<string, DocumentTranslationState>(),
  ),
  fragmentTranslationStates: prop_mapObject(
    () => new Map<string, FragmentTranslationState>(),
  ),
  translateOwnTextTranslationState: prop<TranslateOwnTextTranslationState>(),
}) {
  @modelAction
  upsertDocumentTranslationState(
    documentTranslationState: DocumentTranslationState,
  ) {
    this.documentTranslationStates.set(
      documentTranslationStateMapKey(documentTranslationState),
      documentTranslationState,
    );
  }
  @modelAction
  removeDocumentTranslationState(
    documentTranslationState: DocumentTranslationState,
  ) {
    this.documentTranslationStates.delete(
      documentTranslationStateMapKey(documentTranslationState),
    );
  }
}
