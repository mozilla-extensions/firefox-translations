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
} from "../../shared-resources/test-utils";

const createHeader = (level, text) => {
  const header = document.createElement(`h${level}`);
  header.innerText = `${text}`;
  return header;
};

const testSuiteName = "TranslationDocument";

describe(testSuiteName, function() {
  const outputDiv = document.getElementById("output");
  const diffDiv = document.getElementById("diff");
  const domParser = new DOMParser();
  const fixtureNames = [
    "hola-mundo",
    "hola-mundo-markup",
    "punctuation",
    "mid-sentence-break",
    "es.wikipedia.org-2021-01-20-welcome-box",
  ];
  const diffs = [];
  const allTextsToTranslate = [];

  after(function() {
    drawDiffUi(diffDiv, diffs.join("\n"));
    console.log(allTextsToTranslate.join("\n"));
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

      fragment.append(createHeader(2, `Fixture: ${fixtureName}`));

      const originalDocHtml = prettyHTML(documentToHTML(originalDoc));
      const expectedTranslatedDocHtml = prettyHTML(
        documentToHTML(expectedTranslatedDoc),
      );
      fragment.append(createHeader(3, "Original"));
      fragment.append(createIframeShowingHTML(originalDocHtml));
      fragment.append(createElementShowingPlainText(originalDocHtml));
      fragment.append(createHeader(3, "Translation"));
      fragment.append(createIframeShowingHTML(actualTranslatedDocHtml));
      fragment.append(createElementShowingPlainText(actualTranslatedDocHtml));

      const stringRepresentations = translationDocumentStringRepresentations(
        translationDocument,
      );
      console.debug({ stringRepresentations });

      fragment.append(
        createElementShowingPlainText(
          JSON.stringify(stringRepresentations, null, 2),
        ),
      );

      fragment.append(createHeader(3, '"Original" after translation'));
      fragment.append(createIframeShowingHTML(actualTranslatedOriginalDocHtml));
      fragment.append(
        createElementShowingPlainText(actualTranslatedOriginalDocHtml),
      );

      if (actualTranslatedDocHtml !== expectedTranslatedDocHtml) {
        fragment.append(createHeader(3, "Expected"));
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
