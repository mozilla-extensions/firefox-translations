import { Model, model, modelAction, prop } from "mobx-keystone";
import { DocumentTranslationState } from "./DocumentTranslationState";
import { FragmentTranslationState } from "./FragmentTranslationState";
import { TranslateOwnTextTranslationState } from "./TranslateOwnTextTranslationState";

const matchFrameSpecificDocumentTranslationState = (
  a: DocumentTranslationState,
  b: DocumentTranslationState,
) =>
  a.windowId === b.windowId && a.tabId === b.tabId && a.frameId === b.frameId;

@model("bergamotTranslate/ExtensionState")
export class ExtensionState extends Model({
  documentTranslationStates: prop<DocumentTranslationState[]>(() => []),
  fragmentTranslationStates: prop<FragmentTranslationState[]>(() => []),
  translateOwnTextTranslationState: prop<TranslateOwnTextTranslationState>(),
}) {
  @modelAction
  upsertDocumentTranslationState(
    documentTranslationState: DocumentTranslationState,
  ) {
    const index = this.documentTranslationStates.findIndex(
      $documentTranslationState =>
        matchFrameSpecificDocumentTranslationState(
          $documentTranslationState,
          documentTranslationState,
        ),
    );
    console.log("upsertDocumentTranslationState", { index });
    if (index < 0) {
      this.documentTranslationStates.push(documentTranslationState);
    } else {
      this.documentTranslationStates[index] = documentTranslationState;
    }
  }
  @modelAction
  removeDocumentTranslationState(
    documentTranslationState: DocumentTranslationState,
  ) {
    const index = this.documentTranslationStates.findIndex(
      $documentTranslationState =>
        matchFrameSpecificDocumentTranslationState(
          $documentTranslationState,
          documentTranslationState,
        ),
    );
    if (index >= 0) {
      this.documentTranslationStates.splice(index, 1);
    }
  }
}
