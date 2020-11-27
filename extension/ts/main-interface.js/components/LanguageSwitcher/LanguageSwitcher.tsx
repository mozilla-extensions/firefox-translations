import * as React from "react";
import classNames from "classnames";
import { BsChevronDown } from "react-icons/bs";
import Menu from "../Menu/Menu";
import Icon from "../Icon/Icon";
import { BiTransfer } from "react-icons/bi";
import { config } from "../../../config";

interface Props {
  sourceLanguage: string;
  targetLanguage: string;
  onChangeSourceLanguage: (sourceLanguage: string) => void;
  onChangeTargetLanguage: (targetLanguage: string) => void;
}

export class LanguageSwitcher extends React.Component<Props, {}> {
  state = {
    sourceLanguageListOpen: false,
    targetLanguageListOpen: false,
  };

  render() {
    const {
      sourceLanguage,
      targetLanguage,
      onChangeSourceLanguage,
      onChangeTargetLanguage,
    } = this.props;

    const sourceLanguages = [
      ...new Set(config.supportedLanguagePairs.map(lp => lp[0])),
    ];
    const targetLanguages = [
      ...new Set(config.supportedLanguagePairs.map(lp => lp[1])),
    ];

    const classes = classNames({
      LanguageSwitcher: "LanguageSwitcher",
    });

    const toLanguageOption = languageCode => ({
      key: languageCode,
      value: browser.i18n.getMessage(`language_iso6391_${languageCode}`),
    });
    const displayLanguage = (languageCode: string) => {
      return languageCode
        ? browser.i18n.getMessage(`language_iso6391_${languageCode}`)
        : "??";
    };

    const switchLanguages = () => {
      onChangeSourceLanguage(targetLanguage);
      onChangeTargetLanguage(sourceLanguage);
    };

    return (
      <div className={classes}>
        <span className={"LanguageSwitcher__sourceLanguage"}>
          <span className={"LanguageSwitcher__languageType"}>Source</span>
          <span className={"flex items-center"}>
            {displayLanguage(sourceLanguage)}
            <Menu
              items={sourceLanguages.map(toLanguageOption)}
              setSelection={onChangeSourceLanguage}
            >
              <span className={"LanguageSwitcher__select"}>
                <BsChevronDown />
              </span>
            </Menu>
          </span>
        </span>
        <span className={"LanguageSwitcher__delimiter"}>
          <Icon
            style={{ width: 24, height: 24, color: "#30d5c8" }}
            icon={<BiTransfer onClick={switchLanguages} />}
          />
        </span>
        <span className={"LanguageSwitcher__targetLanguage"}>
          <span className={"LanguageSwitcher__languageType"}>Target</span>
          <span className={"flex items-center"}>
            {displayLanguage(targetLanguage)}
            <Menu
              items={targetLanguages.map(toLanguageOption)}
              setSelection={onChangeTargetLanguage}
            >
              <span className={"LanguageSwitcher__select"}>
                <BsChevronDown />
              </span>
            </Menu>
          </span>
        </span>
      </div>
    );
  }
}

export default LanguageSwitcher;
