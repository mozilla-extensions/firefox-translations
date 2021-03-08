/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { TestDomTranslator } from "./TestDomTranslator";
import { TranslationDocument } from "../TranslationDocument";
import {
  TranslationRequestData,
  TranslationResponseData,
} from "./BaseDomTranslator";
import { BergamotDomTranslatorRequest } from "./BergamotDomTranslatorRequest";
import { BergamotApiClient } from "../../../background-scripts/background.js/lib/BergamotApiClient";
import {
  createElementShowingPlainText,
  createHeader,
  drawDiffUi,
  visuallyAssertDeepEqual,
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

    const testDoc = domParser.parseFromString("</>", "text/html");
    const translationDocument = new TranslationDocument(testDoc);
    const testDomTranslator = new TestDomTranslator(
      translationDocument,
      from,
      to,
    );
    const testSourceLanguageTexts = testDomTranslator.getNormalizedTexts(from);
    const testTargetLanguageTexts = testDomTranslator.getNormalizedTexts(to);

    const translationRequestData: TranslationRequestData = {
      markupsToTranslate: testSourceLanguageTexts,
    };

    let bergamotDomTranslatorRequest = new BergamotDomTranslatorRequest(
      translationRequestData,
      from,
      to,
    );

    const bergamotApiClient = new BergamotApiClient();
    const translationResponseData: TranslationResponseData & {
      translatedPlainTextStrings: string[];
      plainStringsToTranslate: string[];
    } = await bergamotDomTranslatorRequest.fireRequest(bergamotApiClient);
    const {
      plainStringsToTranslate,
      translatedMarkups,
      translatedPlainTextStrings,
    } = translationResponseData;

    console.debug({
      testSourceLanguageTexts,
      plainStringsToTranslate,
      translatedPlainTextStrings,
      translatedMarkups,
      testTargetLanguageTexts,
    });

    // Visual output of test results
    const fragment = document.createDocumentFragment();
    fragment.append(createHeader(4, "Original"));
    fragment.append(
      createElementShowingPlainText(
        JSON.stringify(testSourceLanguageTexts, null, 2),
      ),
    );
    fragment.append(createHeader(4, "Original plain text strings"));
    fragment.append(
      createElementShowingPlainText(
        JSON.stringify(plainStringsToTranslate, null, 2),
      ),
    );
    fragment.append(createHeader(4, "Translated plain text strings"));
    fragment.append(
      createElementShowingPlainText(
        JSON.stringify(translatedPlainTextStrings, null, 2),
      ),
    );
    visuallyAssertDeepEqual(
      translatedMarkups,
      testTargetLanguageTexts,
      `${testName}`,
      fragment,
      diffs,
    );
    outputDiv.append(fragment);

    assert.deepEqual(translatedMarkups, testTargetLanguageTexts);
  });
});
