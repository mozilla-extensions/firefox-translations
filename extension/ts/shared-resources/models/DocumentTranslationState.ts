import { ExtendedModel, model, prop } from "mobx-keystone";
import { BaseTranslationState } from "./BaseTranslationState";

@model("bergamotTranslate/DocumentTranslationState")
export class DocumentTranslationState extends ExtendedModel(
  BaseTranslationState,
  {
    windowId: prop<number>(),
    tabId: prop<number>(),
    frameId: prop<number>(),
    originalShown: prop<boolean>({ setterAction: true }),
  },
) {}
