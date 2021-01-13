import * as React from "react";
import {
  BsLightningFill,
  BsLayersHalf,
  BsGear,
  BsInfoCircleFill,
} from "react-icons/bs";
import { BiChevronRight, BiAnalyse } from "react-icons/bi";
import { browser } from "webextension-polyfill-ts";
import Switch from "../components/Switch/Switch";
import Header from "../components/Header/Header";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import { config } from "../../../config";
import Button from "../components/Button/Button";
import { inject, observer } from "mobx-react";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";
import { DocumentTranslationState } from "../../../shared-resources/models/DocumentTranslationState";
import { TranslationStatus } from "../../../shared-resources/models/BaseTranslationState";
import { ActionItem, ActionItems } from "../components/ActionItems/ActionItems";
import { DetectedLanguageResults } from "../../../shared-resources/bergamot.types";
import { ReactNode } from "react";
import { MainInterfaceInitialProps } from "../index";

interface HomeProps {
  extensionState: ExtensionState;
  mainInterfaceInitialProps: MainInterfaceInitialProps;
}

interface HomeState {}

@inject("extensionState")
@inject("mainInterfaceInitialProps")
@observer
export class Home extends React.Component<HomeProps, HomeState> {
  // Workaround for "Object is possibly undefined". Source: https://github.com/mobxjs/mobx-react/issues/256#issuecomment-500247548s
  public static defaultProps = {
    extensionState: (null as unknown) as ExtensionState,
    mainInterfaceInitialProps: (null as unknown) as MainInterfaceInitialProps,
  };
  state = {};
  render() {
    const { extensionState, mainInterfaceInitialProps } = this.props;
    const { tabId } = mainInterfaceInitialProps;

    // Extract the document translation states that relate to the currently opened tab
    const documentTranslationStates = extensionState.documentTranslationStates;
    const currentFrameDocumentTranslationStates = [];
    documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (documentTranslationState.tabId === tabId) {
          currentFrameDocumentTranslationStates.push(documentTranslationState);
        }
      },
    );
    const topFrameDocumentTranslationState: DocumentTranslationState = currentFrameDocumentTranslationStates.find(
      dts => dts.frameId === 0,
    ) || {
      translationStatus: TranslationStatus.UNAVAILABLE,
      detectedLanguageResults: null,
    };

    const {
      translationStatus,
      translationRequested,
      effectiveTranslateFrom,
      effectiveTranslateTo,
    } = topFrameDocumentTranslationState;

    const requestTranslation = () => {
      currentFrameDocumentTranslationStates.forEach(
        (dts: DocumentTranslationState) => {
          extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
            {
              op: "replace",
              path: ["translationRequested"],
              value: true,
            },
          ]);
        },
      );
    };

    const requestCancellation = () => {
      currentFrameDocumentTranslationStates.forEach(
        (dts: DocumentTranslationState) => {
          extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
            {
              op: "replace",
              path: ["cancellationRequested"],
              value: true,
            },
          ]);
        },
      );
    };

    const setTranslateFrom = $translateFrom => {
      currentFrameDocumentTranslationStates.forEach(
        (dts: DocumentTranslationState) => {
          extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
            {
              op: "replace",
              path: ["translateFrom"],
              value: $translateFrom,
            },
          ]);
        },
      );
    };

    const setTranslateTo = $translateTo => {
      currentFrameDocumentTranslationStates.forEach(
        (dts: DocumentTranslationState) => {
          extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
            {
              op: "replace",
              path: ["translateTo"],
              value: $translateTo,
            },
          ]);
        },
      );
    };

    const infoActionItem = (): ActionItem => {
      let action: ReactNode | false = false;
      switch (translationStatus) {
        case TranslationStatus.UNAVAILABLE:
          break;
        case TranslationStatus.DETECTING_LANGUAGE:
          break;
        case TranslationStatus.LANGUAGE_NOT_DETECTED:
          break;
        case TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD:
        case TranslationStatus.OFFER:
          if (translationRequested) {
            action = (
              <Button
                type={"primary"}
                label={"Translating..."}
                disabled={true}
              />
            );
          }
          action = (
            <Button
              type={"primary"}
              label={"Translate"}
              onClick={requestTranslation}
            />
          );
          break;
        case TranslationStatus.DETECTED_LANGUAGE_UNSUPPORTED:
          break;
        case TranslationStatus.DOWNLOADING_TRANSLATION_MODEL:
          action = (
            <Button
              type={"secondary"}
              label={"Cancel"}
              onClick={requestCancellation}
            />
          );
          break;
        case TranslationStatus.TRANSLATING:
          action = (
            <Button
              type={"secondary"}
              label={"Cancel"}
              onClick={requestCancellation}
            />
          );
          break;
        case TranslationStatus.TRANSLATED:
          break;
        case TranslationStatus.ERROR:
          action = (
            <Button
              type={"secondary"}
              label={"Retry"}
              onClick={requestTranslation}
            />
          );
          break;
      }
      let text = browser.i18n.getMessage(
        `translationStatus_${translationStatus}_mainInterfaceMessage`,
      );
      if (effectiveTranslateFrom) {
        text = text.replace(
          "[SOURCE_LANG]",
          browser.i18n.getMessage(`language_iso6391_${effectiveTranslateFrom}`),
        );
      }
      if (effectiveTranslateTo) {
        text = text.replace(
          "[TARGET_LANG]",
          browser.i18n.getMessage(`language_iso6391_${effectiveTranslateTo}`),
        );
      }
      return {
        text,
        icon: <BsInfoCircleFill />,
        action,
      };
    };

    const toggleShowOriginal = () => {
      currentFrameDocumentTranslationStates.forEach(
        (dts: DocumentTranslationState) => {
          extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
            {
              op: "replace",
              path: ["showOriginal"],
              value: !dts.showOriginal,
            },
          ]);
        },
      );
    };

    const toggleQualityEstimation = () => {
      currentFrameDocumentTranslationStates.forEach(
        (dts: DocumentTranslationState) => {
          extensionState.patchDocumentTranslationStateByFrameInfo(dts, [
            {
              op: "replace",
              path: ["displayQualityEstimation"],
              value: !dts.displayQualityEstimation,
            },
          ]);
        },
      );
    };

    const actionItems: ActionItem[] = [
      infoActionItem(),
      ...([TranslationStatus.TRANSLATED].includes(translationStatus)
        ? [
            {
              text: "Show original",
              icon: <BsLayersHalf />,
              action: (
                <Switch
                  checked={topFrameDocumentTranslationState.showOriginal}
                  onToggle={toggleShowOriginal}
                />
              ),
            },
            {
              text: "Show quality estimation",
              icon: <BsLightningFill />,
              action: (
                <Switch
                  checked={
                    topFrameDocumentTranslationState.displayQualityEstimation
                  }
                  onToggle={toggleQualityEstimation}
                />
              ),
            },
            {
              text: (
                <>
                  Always translate{" "}
                  {browser.i18n.getMessage(
                    `language_iso6391_${effectiveTranslateFrom}`,
                  )}
                </>
              ),
              icon: <BsGear />,
              action: <Switch />,
            },
          ]
        : []),
      {
        text: "Translate own text",
        icon: <BiAnalyse />,
        action: <BiChevronRight />,
        route: "translate",
      },
      /*
      {
        text: "Module Management",
        icon: <BiBox />,
        action: <BiChevronRight />,
      },
      {
        text: "Options",
        icon: <BiSlider />,
        action: <BiChevronRight />,
      },
      */
    ];

    return (
      <div className={"Home w-full"}>
        <div className="flex flex-col">
          <Header />
          {/* extra={<BsGear />}*/}
          {/*
        <div className={"BergamotApp__header"}>
          <TextField
            allowClear
            prefixIcon={<img alt={""} src={logo} width={16} />}
            placeholder={"Quick translate"}
            style={{ width: "100%", borderRadius: "4px 4px 0 0" }}
          />
        </div>
        */}
          {[
            TranslationStatus.LANGUAGE_NOT_DETECTED,
            TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD,
            TranslationStatus.DETECTED_LANGUAGE_UNSUPPORTED,
            TranslationStatus.OFFER,
            TranslationStatus.DOWNLOADING_TRANSLATION_MODEL,
            TranslationStatus.TRANSLATING,
            TranslationStatus.TRANSLATED,
          ].includes(translationStatus) && (
            <>
              <div className={"BergamotApp__languageSwitcher"}>
                <LanguageSwitcher
                  translateFrom={effectiveTranslateFrom}
                  translateTo={effectiveTranslateTo}
                  onChangeTranslateTo={setTranslateTo}
                  onChangeTranslateFrom={setTranslateFrom}
                />
              </div>
            </>
          )}
          <ActionItems actionItems={actionItems} />
          <div className={"BergamotApp__footer mt-4"}>
            <span>
              <a
                className=""
                target="_blank"
                href={browser.runtime.getURL(`get-started/get-started.html`)}
              >
                About
              </a>
            </span>
            <span>
              <a
                className="inline ml-1.5 underline hover:text-grey-60"
                target="_blank"
                href={config.feedbackSurveyUrl}
              >
                Feedback
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  }
}
