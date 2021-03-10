import * as React from "react";
import { BsBoxArrowUpRight, BsLightningFill } from "react-icons/bs";
import Header from "../components/Header/Header";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import TextField from "../components/TextField/TextField";
import { ActionItem, ActionItems } from "../components/ActionItems/ActionItems";
import Switch from "../components/Switch/Switch";
import { browser } from "webextension-polyfill-ts";
import { inject, observer } from "mobx-react";
import { TranslatedText } from "./TranslatedText";
import { MainInterfaceInitialProps } from "../index";
import { TranslationStatus } from "../../../../../core/ts/shared-resources/models/BaseTranslationState";
import { ExtensionState } from "../../../../../core/ts/shared-resources/models/ExtensionState";
import { TranslateOwnTextTranslationState } from "../../../../../core/ts/shared-resources/models/TranslateOwnTextTranslationState";

interface TranslateProps {
  extensionState: ExtensionState;
  mainInterfaceInitialProps: MainInterfaceInitialProps;
}
interface TranslateState {
  text: string;
}

@inject("extensionState")
@inject("mainInterfaceInitialProps")
@observer
export class Translate extends React.Component<TranslateProps, TranslateState> {
  // Workaround for "Object is possibly undefined". Source: https://github.com/mobxjs/mobx-react/issues/256#issuecomment-500247548s
  public static defaultProps = {
    extensionState: (null as unknown) as ExtensionState,
    mainInterfaceInitialProps: (null as unknown) as MainInterfaceInitialProps,
  };

  state = {
    text: "",
  };

  componentDidMount() {
    if (this.props.mainInterfaceInitialProps.initialText) {
      this.setState({ text: this.props.mainInterfaceInitialProps.initialText });
    }
  }

  render() {
    const { extensionState, mainInterfaceInitialProps } = this.props;
    const { tabId, standalone } = mainInterfaceInitialProps;
    const { translateOwnTextTranslationStates } = extensionState;
    const { text } = this.state;

    let currentTranslateOwnTextTranslationState: TranslateOwnTextTranslationState;
    translateOwnTextTranslationStates.forEach(
      (translateOwnTextTranslationState: TranslateOwnTextTranslationState) => {
        if (translateOwnTextTranslationState.tabId === tabId) {
          currentTranslateOwnTextTranslationState = translateOwnTextTranslationState;
        }
      },
    );
    if (!currentTranslateOwnTextTranslationState) {
      extensionState.setTranslateOwnTextTranslationState(
        new TranslateOwnTextTranslationState({
          tabId,
          translationStatus: TranslationStatus.UNAVAILABLE,
          detectedLanguageResults: null,
        }),
      );
      // Return null and wait until the above state update has gone through
      return null;
    }

    const {
      effectiveTranslateFrom,
      effectiveTranslateTo,
    } = currentTranslateOwnTextTranslationState;

    const setTranslateFrom = $translateFrom => {
      currentTranslateOwnTextTranslationState.translateFrom = $translateFrom;
      extensionState.setTranslateOwnTextTranslationState(
        currentTranslateOwnTextTranslationState,
      );
    };

    const setTranslateTo = $translateTo => {
      currentTranslateOwnTextTranslationState.translateTo = $translateTo;
      extensionState.setTranslateOwnTextTranslationState(
        currentTranslateOwnTextTranslationState,
      );
    };

    const changeHandler = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      this.setState({ text: e.target.value });
    };

    const toggleQualityEstimation = () => {
      currentTranslateOwnTextTranslationState.displayQualityEstimation = !currentTranslateOwnTextTranslationState.displayQualityEstimation;
      extensionState.setTranslateOwnTextTranslationState(
        currentTranslateOwnTextTranslationState,
      );
    };

    const actionItems: ActionItem[] = [
      {
        text: "Show quality estimation",
        icon: <BsLightningFill />,
        action: (
          <Switch
            checked={
              currentTranslateOwnTextTranslationState.displayQualityEstimation
            }
            onToggle={toggleQualityEstimation}
          />
        ),
      },
    ];

    const openInSeparateTab = () => {
      const url = browser.runtime.getURL(
        `main-interface/standalone.html?standalone=1&tabId=${tabId}&initialText=${encodeURIComponent(
          text,
        )}#/translate`,
      );
      browser.tabs.create({ url });
      window.close();
    };

    return (
      <div className={"Translate w-full"}>
        {(standalone && <Header />) || (
          <Header
            allowBack
            extra={<BsBoxArrowUpRight onClick={openInSeparateTab} />}
          />
        )}
        <div className={"BergamotApp__languageSwitcher"}>
          <LanguageSwitcher
            translateFrom={effectiveTranslateFrom}
            translateTo={effectiveTranslateTo}
            onChangeTranslateFrom={setTranslateFrom}
            onChangeTranslateTo={setTranslateTo}
          />
        </div>
        <div className={"Translate__body"}>
          <div className={"Translate__originText"}>
            <div className={"Translate__title"}>Origin</div>
            <TextField textArea value={text} onChange={changeHandler} />
          </div>
          <div className={"Translate__targetText"}>
            <div className={"Translate__title"}>Target</div>
            <TranslatedText
              text={text}
              translateFrom={effectiveTranslateFrom}
              translateTo={effectiveTranslateTo}
            />
          </div>
        </div>
        <ActionItems actionItems={actionItems} />
      </div>
    );
  }
}
