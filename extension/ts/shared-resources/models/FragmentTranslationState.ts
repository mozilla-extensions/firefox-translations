import { ExtendedModel, model, prop } from "mobx-keystone";
import { DocumentTranslationState } from "./DocumentTranslationState";

@model("bergamotTranslate/FragmentTranslationState")
export class FragmentTranslationState extends ExtendedModel(
  DocumentTranslationState,
  {
    documentTranslationStateId: prop<string>(),
    fragmentUri: prop<string>(),
  },
) {}
