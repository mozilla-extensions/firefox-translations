import { ExtendedModel, model, prop } from "mobx-keystone";
import { BaseTranslationState } from "./BaseTranslationState";

@model("bergamotTranslate/TranslateOwnTextTranslationState")
export class TranslateOwnTextTranslationState extends ExtendedModel(
  BaseTranslationState,
  {
    translateAutomatically: prop<boolean>(true),
  },
) {}
