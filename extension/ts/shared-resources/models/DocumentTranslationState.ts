import { ExtendedModel, model, prop } from "mobx-keystone";
import { BaseTranslationState } from "./BaseTranslationState";

@model("bergamotTranslate/DocumentTranslationState")
export class DocumentTranslationState extends ExtendedModel(
  BaseTranslationState,
  {
    windowId: prop<number>(),
    frameId: prop<number>(),
    showOriginal: prop<boolean>({ setterAction: true }),
    url: prop<string>(),
    wordCountInViewport: prop<number>(),
    wordCountVisibleInViewport: prop<number>(),
  },
) {}
