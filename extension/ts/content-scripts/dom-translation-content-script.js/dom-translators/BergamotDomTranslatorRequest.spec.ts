/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { TestDomTranslator } from "./TestDomTranslator";
import { TranslationDocument } from "../TranslationDocument";
import { TranslationRequestData } from "./BaseDomTranslator";
import { BergamotDomTranslatorRequest } from "./BergamotDomTranslatorRequest";
import { BergamotApiClient } from "../../../background-scripts/background.js/lib/BergamotApiClient";
import {
  createElementShowingPlainText,
  createHeader,
  drawDiffUi,
  unifiedDiff,
} from "../../../shared-resources/test-utils";

const testSuiteName = "BergamotDomTranslatorRequest";

describe(testSuiteName, function() {
  const outputDiv = document.getElementById("output");
  const diffContainerDiv = document.getElementById("diff");
  const diffDiv = document.createElement("div");
  const domParser = new DOMParser();
  const diffs = [];

  before(function() {
    outputDiv.append(createHeader(2, testSuiteName));
  });

  after(function() {
    diffContainerDiv.append(createHeader(2, testSuiteName), diffDiv);
    drawDiffUi(diffDiv, diffs.join("\n"));
  });

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

    console.debug({
      testSourceLanguageTexts,
      translatedStrings,
      testTargetLanguageTexts,
    });

    const actual = JSON.stringify(translatedStrings, null, 2);
    const expected = JSON.stringify(testTargetLanguageTexts, null, 2);

    // Visual output of test results
    const fragment = document.createDocumentFragment();
    fragment.append(createHeader(3, testName));

    fragment.append(createHeader(4, "Actual"));
    fragment.append(createElementShowingPlainText(actual));

    if (actual !== expected) {
      fragment.append(createHeader(4, "Expected"));
      fragment.append(createElementShowingPlainText(expected));
      const diff = unifiedDiff(testName, actual, expected);
      diffs.push(diff);
    }

    outputDiv.append(fragment);

    assert.deepEqual(actual, expected);
  });
});
