/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { TestDomTranslator } from "./TestDomTranslator";
import { TranslationDocument } from "../TranslationDocument";
import { stripTagsFromTexts } from "./BergamotDomTranslator";
import { TranslationRequestData } from "./BaseDomTranslator";
import { BergamotDomTranslatorRequest } from "./BergamotDomTranslatorRequest";
import { BergamotApiClient } from "../../../background-scripts/background.js/lib/BergamotApiClient";

const testSuiteName = "BergamotDomTranslatorRequest";

describe(testSuiteName, function() {
  const domParser = new DOMParser();

  const from = "es";
  const to = "en";

  const testName = `${from}->${to}`;
  it(testName, async function() {
    console.info(`${testSuiteName}: ${testName}`);

    const testDoc = domParser.parseFromString("<html/>", "text/html");
    const translationDocument = new TranslationDocument(testDoc);
    const testDomTranslator = new TestDomTranslator(
      translationDocument,
      from,
      to,
    );
    const testSourceLanguageTexts = testDomTranslator.getNormalizedTexts(from);
    const testTargetLanguageTexts = testDomTranslator.getNormalizedTexts(to);

    const translationRequestData: TranslationRequestData = {
      stringsToTranslate: testSourceLanguageTexts,
    };
    translationRequestData.stringsToTranslate = stripTagsFromTexts(
      translationRequestData.stringsToTranslate,
    );

    let bergamotDomTranslatorRequest = new BergamotDomTranslatorRequest(
      translationRequestData,
      this.sourceLanguage,
      this.targetLanguage,
    );

    const bergamotApiClient = new BergamotApiClient();
    const translationResponseData = await bergamotDomTranslatorRequest.fireRequest(
      bergamotApiClient,
    );
    const { translatedStrings } = translationResponseData;

    console.debug({ testSourceLanguageTexts, translatedStrings, testTargetLanguageTexts });
    assert.deepEqual(translatedStrings, testTargetLanguageTexts);
  });
});
