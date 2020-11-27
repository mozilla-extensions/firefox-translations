import * as React from "react";
import {
  BsLightningFill,
  BsLayersHalf,
  BsGear,
  BsInfoCircleFill,
} from "react-icons/bs";
import { BiChevronRight, BiAnalyse } from "react-icons/bi";
import { browser, Tabs } from "webextension-polyfill-ts";
import Switch from "../components/Switch/Switch";
import Header from "../components/Header/Header";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import { config } from "../../config";
import Button from "../components/Button/Button";
import { inject, observer } from "mobx-react";
import { ExtensionState } from "../../shared-resources/models/ExtensionState";
import Tab = Tabs.Tab;
import { DocumentTranslationState } from "../../shared-resources/models/DocumentTranslationState";
import { TranslationStatus } from "../../shared-resources/models/BaseTranslationState";
import { ActionItem, ActionItems } from "../components/ActionItems/ActionItems";
import { DetectedLanguageResults } from "../../shared-resources/bergamot.types";
import { ReactNode } from "react";

interface HomeProps {
  extensionState: ExtensionState;
  currentTab: Tab;
}

interface HomeState {
  sourceLanguage: string;
  targetLanguage: string;
}

@inject("extensionState")
@inject("currentTab")
@observer
export class Home extends React.Component<HomeProps, HomeState> {
  // Workaround for "Object is possibly undefined". Source: https://github.com/mobxjs/mobx-react/issues/256#issuecomment-500247548s
  public static defaultProps = {
    extensionState: (null as unknown) as ExtensionState,
    currentTab: (null as unknown) as Tab,
  };
  state = {
    sourceLanguage: undefined,
    targetLanguage: undefined,
  };
  async setSourceLanguage(sourceLanguage) {
    return this.setState({ sourceLanguage });
  }
  async setTargetLanguage(targetLanguage) {
    return this.setState({ targetLanguage });
  }
  render() {
    const { sourceLanguage, targetLanguage } = this.state;
    const { extensionState, currentTab } = this.props;

    // Extract the document translation states that relate to the currently opened tab
    const documentTranslationStates = extensionState.documentTranslationStates;
    const currentFrameDocumentTranslationStates = [];
    documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (documentTranslationState.tabId === currentTab.id) {
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
      detectedLanguageResults,
    } = topFrameDocumentTranslationState;

    const browserUiLanguageCode = browser.i18n.getUILanguage().split("-")[0];

    const infoActionItem = (
      translationStatus: TranslationStatus,
      detectedLanguageResults: DetectedLanguageResults | null,
    ): ActionItem => {
      let action: ReactNode | false = false;
      switch (translationStatus) {
        case TranslationStatus.UNAVAILABLE:
          break;
        case TranslationStatus.DETECTING_LANGUAGE:
          break;
        case TranslationStatus.LANGUAGE_NOT_DETECTED:
          break;
        case TranslationStatus.SOURCE_LANGUAGE_UNDERSTOOD:
          action = <Button type={"primary"} label={"Translate"} />;
          break;
        case TranslationStatus.DETECTED_LANGUAGE_UNSUPPORTED:
          break;
        case TranslationStatus.OFFER:
          action = <Button type={"primary"} label={"Translate"} />;
          break;
        case TranslationStatus.DOWNLOADING_TRANSLATION_MODEL:
          action = <Button type={"secondary"} label={"Cancel"} />;
          break;
        case TranslationStatus.TRANSLATING:
          action = <Button type={"secondary"} label={"Cancel"} />;
          break;
        case TranslationStatus.TRANSLATED:
          break;
        case TranslationStatus.ERROR:
          action = <Button type={"secondary"} label={"Retry"} />;
          break;
      }
      let text = browser.i18n
        .getMessage(
          `translationStatus_${translationStatus}_mainInterfaceMessage`,
        )
        .replace("[TARGET_LANG]", "en");
      if (detectedLanguageResults) {
        text = text.replace("[SOURCE_LANG]", detectedLanguageResults.language);
      }
      return {
        text,
        icon: <BsInfoCircleFill />,
        action,
      };
    };

    const actionItems: ActionItem[] = [
      infoActionItem(translationStatus, detectedLanguageResults),
      ...([TranslationStatus.TRANSLATED].includes(translationStatus)
        ? [
            {
              text: "Show original",
              icon: <BsLayersHalf />,
              action: <Switch />,
            },
            {
              text: "Show quality estimation",
              icon: <BsLightningFill />,
              action: <Switch />,
            },
            {
              text: <>Always translate {sourceLanguage}</>,
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
                  sourceLanguage={
                    sourceLanguage || detectedLanguageResults?.language
                  }
                  targetLanguage={targetLanguage || browserUiLanguageCode}
                  onChangeTargetLanguage={this.setTargetLanguage.bind(this)}
                  onChangeSourceLanguage={this.setSourceLanguage.bind(this)}
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
