/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { TranslationDocument } from "./TranslationDocument";
import { TestDomTranslator } from "./dom-translators/TestDomTranslator";
import {
  createIframeShowingHTML,
  createElementShowingPlainText,
  documentToHTML,
  drawDiffUi,
  fetchFixtureHtml,
  prettyHTML,
  unifiedDiff,
  translationDocumentStringRepresentations,
  createHeader,
} from "../../shared-resources/test-utils";

const testSuiteName = "TranslationDocument";

describe(testSuiteName, function() {
  const outputDiv = document.getElementById("output");
  const diffContainerDiv = document.getElementById("diff");
  const diffDiv = document.createElement("div");
  const domParser = new DOMParser();
  const fixtureNames = [
    "hola-mundo",
    "hola-mundo-markup",
    "punctuation-1",
    "punctuation-2",
    "mid-sentence-break",
    "nested-inline-tags",
    "es.wikipedia.org-2021-01-20-welcome-box",
  ];
  const diffs = [];
  const allTextsToTranslate = [];

  before(function() {
    outputDiv.append(createHeader(2, testSuiteName));
  });

  after(function() {
    diffContainerDiv.append(createHeader(2, testSuiteName), diffDiv);
    drawDiffUi(diffDiv, diffs.join("\n"));
    outputDiv.append(
      createHeader(
        2,
        "All texts attempted to be translated by tests (should be available in TestDomTranslator)",
      ),
      createElementShowingPlainText(
        JSON.stringify([...new Set(allTextsToTranslate)], null, 2),
      ),
    );
  });

  fixtureNames.forEach(fixtureName => {
    const testName = `Fixture: ${fixtureName}`;
    it(testName, async function() {
      console.info(`${testSuiteName}: ${testName}`);
      const from = "es";
      const to = "en";

      const docHtml = await fetchFixtureHtml(`${fixtureName}/original.html`);

      const originalDoc = domParser.parseFromString(docHtml, "text/html");
      const expectedHtml = await fetchFixtureHtml(
        `${fixtureName}/expected.${from}${to}.html`,
      );
      const expectedTranslatedDoc = domParser.parseFromString(
        expectedHtml,
        "text/html",
      );
      const testDoc = domParser.parseFromString(docHtml, "text/html");
      const translationDocument = new TranslationDocument(testDoc);

      const domTranslator = new TestDomTranslator(
        translationDocument,
        from,
        to,
      );

      await domTranslator.translate();
      translationDocument.showTranslation();
      const actualTranslatedDocHtml = prettyHTML(documentToHTML(testDoc));

      translationDocument.showOriginal();
      const actualTranslatedOriginalDocHtml = prettyHTML(
        documentToHTML(testDoc),
      );

      const fragment = document.createDocumentFragment();
      fragment.append(createHeader(3, testName));

      const originalDocHtml = prettyHTML(documentToHTML(originalDoc));
      const expectedTranslatedDocHtml = prettyHTML(
        documentToHTML(expectedTranslatedDoc),
      );
      fragment.append(createHeader(4, "Original"));
      fragment.append(createIframeShowingHTML(originalDocHtml));
      fragment.append(createElementShowingPlainText(originalDocHtml));
      fragment.append(createHeader(4, "Translation"));
      fragment.append(createIframeShowingHTML(actualTranslatedDocHtml));
      fragment.append(createElementShowingPlainText(actualTranslatedDocHtml));

      const stringRepresentations = translationDocumentStringRepresentations(
        translationDocument,
      );
      console.debug({ stringRepresentations });

      allTextsToTranslate.push(...stringRepresentations.stringsToTranslate);

      fragment.append(
        createElementShowingPlainText(
          JSON.stringify(stringRepresentations, null, 2),
        ),
      );

      fragment.append(createHeader(4, '"Original" after translation'));
      fragment.append(createIframeShowingHTML(actualTranslatedOriginalDocHtml));
      fragment.append(
        createElementShowingPlainText(actualTranslatedOriginalDocHtml),
      );

      if (actualTranslatedDocHtml !== expectedTranslatedDocHtml) {
        fragment.append(createHeader(4, "Expected"));
        fragment.append(createIframeShowingHTML(expectedTranslatedDocHtml));
        fragment.append(
          createElementShowingPlainText(expectedTranslatedDocHtml),
        );
        const diff = unifiedDiff(
          fixtureName,
          actualTranslatedDocHtml,
          expectedTranslatedDocHtml,
        );
        diffs.push(diff);
      }

      outputDiv.append(fragment);

      assert.equal(actualTranslatedDocHtml, expectedTranslatedDocHtml);
    });
  });
});
