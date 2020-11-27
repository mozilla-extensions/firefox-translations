import * as React from "react";
import {
  BsLightningFill,
  BsArrowRepeat,
  BsPlus,
  BsChevronDown,
} from "react-icons/bs";
import { BiChevronRight, BiAnalyse, BiBox, BiSlider } from "react-icons/bi";
import { Link } from "react-router-dom";
import { browser, Tabs } from "webextension-polyfill-ts";
import Switch from "../components/Switch/Switch";
import Header from "../components/Header/Header";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import Menu from "../components/Menu/Menu";
import List from "../components/List/List";
import { config } from "../../config";
import Button from "../components/Button/Button";
import { inject, observer } from "mobx-react";
import { ExtensionState } from "../../shared-resources/models/ExtensionState";
import Tab = Tabs.Tab;
import {
  getSnapshot,
  ModelInstanceData,
  SnapshotOutOfModel,
} from "mobx-keystone";
import { DocumentTranslationState } from "../../shared-resources/models/DocumentTranslationState";

interface HomeProps {
  extensionState: ExtensionState;
  currentTab: Tab;
}

interface HomeState {
  language: string;
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
    language: "foo",
  };
  setLanguage(language) {
    this.setState({ language });
  }
  render() {
    const { language } = this.state;
    const { extensionState, currentTab } = this.props;
    const data = [
      {
        text: "Translate own text",
        icon: <BiAnalyse />,
        action: <BiChevronRight />,
        route: "translate",
      },
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
      /*
      {
        text: (
          <>
            Always{" "}
            <Menu setSelection={this.setLanguage}>
              <span className={"LanguageSwitcher__select"}>
                <BsChevronDown />
              </span>
            </Menu>{" "}
            translate ${language}
          </>
        ),
        icon: <BsLightningFill />,
        action: <Switch />,
      },
      */
      {
        text: "Show quality estimation",
        icon: <BsLightningFill />,
        action: <Switch />,
      },
    ];

    const items = data.map(i => {
      if (i.route)
        return (
          <Link to={`${i.route}`}>
            <List.Item
              key={Math.random()}
              text={i.text}
              icon={i.icon}
              action={i.action}
            />
          </Link>
        );
      else
        return (
          <List.Item
            key={Math.random()}
            text={i.text}
            icon={i.icon}
            action={i.action}
          />
        );
    });

    // Extract the document translation states that relate to the currently opened tab
    const documentTranslationStates = extensionState.documentTranslationStates;
    const currentFrameDocumentTranslationStates = [];
    documentTranslationStates.forEach(
      (documentTranslationState: DocumentTranslationState) => {
        if (documentTranslationState.tabId === currentTab.id) {
          currentFrameDocumentTranslationStates.push(
            getSnapshot(documentTranslationState),
          );
        }
      },
    );
    const topFrameDocumentTranslationState: SnapshotOutOfModel<DocumentTranslationState> = currentFrameDocumentTranslationStates.find(
      dts => dts.frameId === 0,
    );

    return (
      <div className={"Home w-full"}>
        <div className="flex flex-col">
          <Header />
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
          <div className={"BergamotApp__languageSwitcher"}>
            <LanguageSwitcher onSwitch={this.setLanguage.bind(this)} />
          </div>
          {topFrameDocumentTranslationState && (
            <>
              <div className={"flex flex-row"}>
                <span className="inline">
                  This tab has {currentFrameDocumentTranslationStates.length}{" "}
                  frames with translation state
                </span>
              </div>
              <div className={"flex flex-row"}>
                <span className="inline">
                  Language:{" "}
                  {JSON.stringify(
                    topFrameDocumentTranslationState.detectedLanguageResults,
                  )}
                  Translation status:{" "}
                  {JSON.stringify(
                    topFrameDocumentTranslationState.translationStatus,
                  )}
                </span>
              </div>
            </>
          )}
          <List style={{ cursor: "pointer" }} borderless>
            {items}
          </List>
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
