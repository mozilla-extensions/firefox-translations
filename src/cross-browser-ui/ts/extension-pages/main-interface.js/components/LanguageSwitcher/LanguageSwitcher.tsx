import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import classNames from "classnames";
import { BsChevronDown } from "react-icons/bs";
import Menu from "../Menu/Menu";
import Icon from "../Icon/Icon";
import { BiTransfer } from "react-icons/bi";
import {config} from "../../../../../../core/ts/config";

interface Props {
  translateFrom: string;
  translateTo: string;
  onChangeTranslateFrom: (translateFrom: string) => void;
  onChangeTranslateTo: (translateTo: string) => void;
}

export class LanguageSwitcher extends React.Component<Props, {}> {
  state = {
    translateFromListOpen: false,
    translateToListOpen: false,
  };

  render() {
    const {
      translateFrom,
      translateTo,
      onChangeTranslateFrom,
      onChangeTranslateTo,
    } = this.props;

    const translateFromLanguages = [
      ...new Set(config.supportedLanguagePairs.map(lp => lp[0])),
    ];
    const translateToLanguages = [
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
      onChangeTranslateFrom(translateTo);
      onChangeTranslateTo(translateFrom);
    };

    return (
      <div className={classes}>
        <span className={"LanguageSwitcher__translateFrom"}>
          <span className={"LanguageSwitcher__languageType"}>Source</span>
          <span className={"flex items-center"}>
            {displayLanguage(translateFrom)}
            <Menu
              items={translateFromLanguages.map(toLanguageOption)}
              setSelection={onChangeTranslateFrom}
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
        <span className={"LanguageSwitcher__translateTo"}>
          <span className={"LanguageSwitcher__languageType"}>Target</span>
          <span className={"flex items-center"}>
            {displayLanguage(translateTo)}
            <Menu
              items={translateToLanguages.map(toLanguageOption)}
              setSelection={onChangeTranslateTo}
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
