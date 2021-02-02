/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { browser as crossBrowser } from "webextension-polyfill-ts";
import { config } from "../config";

export class LanguageSupport {
  getAcceptedTargetLanguages = async (): Promise<string[]> => {
    return [
      ...new Set(
        [
          crossBrowser.i18n.getUILanguage(),
          ...(await crossBrowser.i18n.getAcceptLanguages()),
        ].map(localeCode => localeCode.split("-")[0]),
      ),
    ];
  };

  getSupportedSourceLanguages = (): string[] => {
    return [...new Set(config.supportedLanguagePairs.map(lp => lp[0]))];
  };

  getSupportedTargetLanguagesGivenASourceLanguage = (
    translateFrom,
  ): string[] => {
    return [
      ...new Set(
        config.supportedLanguagePairs
          .filter(lp => lp[0] === translateFrom)
          .map(lp => lp[1]),
      ),
    ];
  };

  getAllPossiblySupportedTargetLanguages = (): string[] => {
    return [...new Set(config.supportedLanguagePairs.map(lp => lp[1]))];
  };

  getDefaultSourceLanguage = (
    translateFrom: string,
    detectedLanguage: string,
  ): string => {
    return translateFrom || detectedLanguage;
  };

  getDefaultTargetLanguage = (
    translateFrom: string,
    acceptedTargetLanguages: string[],
  ): string => {
    const supportedTargetLanguages = translateFrom
      ? this.getSupportedTargetLanguagesGivenASourceLanguage(translateFrom)
      : this.getAllPossiblySupportedTargetLanguages();
    const possibleDefaultTargetLanguages = acceptedTargetLanguages.filter(
      languageCode => supportedTargetLanguages.includes(languageCode),
    );
    if (possibleDefaultTargetLanguages.length > 0) {
      return possibleDefaultTargetLanguages[0];
    }
    return null;
  };

  summarizeLanguageSupport = async detectedLanguage => {
    const acceptedTargetLanguages = await this.getAcceptedTargetLanguages();
    const defaultSourceLanguage = this.getDefaultSourceLanguage(
      null,
      detectedLanguage,
    );
    const defaultTargetLanguage = this.getDefaultTargetLanguage(
      defaultSourceLanguage,
      acceptedTargetLanguages,
    );
    const supportedSourceLanguages = this.getSupportedSourceLanguages();
    const supportedTargetLanguagesGivenDefaultSourceLanguage = this.getSupportedTargetLanguagesGivenASourceLanguage(
      defaultSourceLanguage,
    );
    const allPossiblySupportedTargetLanguages = this.getAllPossiblySupportedTargetLanguages();
    return {
      acceptedTargetLanguages,
      defaultSourceLanguage,
      defaultTargetLanguage,
      supportedSourceLanguages,
      supportedTargetLanguagesGivenDefaultSourceLanguage,
      allPossiblySupportedTargetLanguages,
    };
  };
}
