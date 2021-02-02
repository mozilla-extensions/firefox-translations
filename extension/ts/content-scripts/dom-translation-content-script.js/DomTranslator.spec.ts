/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { TranslationDocument } from "./TranslationDocument";
import { BergamotTranslator } from "./BergamotTranslator";
import {
  createIframeShowingHTML,
  createElementShowingHTML,
  documentToHTML,
  drawDiffUi,
  fetchFixtureHtml,
  prettyHTML,
  unifiedDiff,
} from "../../shared-resources/test-utils";

describe("Dom Translation", function() {
  const outputDiv = document.getElementById("output");
  const diffDiv = document.getElementById("diff");
  const domParser = new DOMParser();
  const fixtureNames = [
    "hola-mundo",
    "es.wikipedia.org-2021-01-20-welcome-box",
  ];
  const diffs = [];

  after(function() {
    drawDiffUi(diffDiv, diffs.join("\n"));
  });

  fixtureNames.forEach(fixtureName => {
    it(`Fixture: ${fixtureName}`, async function() {
      const from = "es";
      const to = "en";

      const docHtml = await fetchFixtureHtml(`${fixtureName}/original.html`);

      const originalDoc = domParser.parseFromString(docHtml, "text/html");
      const expectedHtml = await fetchFixtureHtml(
        `${fixtureName}/expected.${from}${to}.html`,
      );
      const expectedDoc = domParser.parseFromString(expectedHtml, "text/html");
      const actualDoc = domParser.parseFromString(docHtml, "text/html");
      const translationDocument = new TranslationDocument(actualDoc);

      const translator = new BergamotTranslator(translationDocument, from, to);

      await translator.translate();
      translationDocument.showTranslation();

      const fragment = document.createDocumentFragment();

      const createHeader = (level, text) => {
        const header = document.createElement(`h${level}`);
        header.innerText = `${text}`;
        return header;
      };

      fragment.append(createHeader(2, `Fixture: ${fixtureName}`));

      const originalDocHtml = prettyHTML(documentToHTML(originalDoc));
      const actualDocHtml = prettyHTML(documentToHTML(actualDoc));
      const expectedDocHtml = prettyHTML(documentToHTML(expectedDoc));
      fragment.append(createHeader(3, "Original"));
      fragment.append(createIframeShowingHTML(originalDocHtml));
      fragment.append(createElementShowingHTML(originalDocHtml));
      fragment.append(createHeader(3, "Translation"));
      fragment.append(createIframeShowingHTML(actualDocHtml));
      fragment.append(createElementShowingHTML(actualDocHtml));
      if (actualDocHtml !== expectedDocHtml) {
        fragment.append(createHeader(3, "Expected"));
        fragment.append(createIframeShowingHTML(expectedDocHtml));
        fragment.append(createElementShowingHTML(expectedDocHtml));
        const diff = unifiedDiff(fixtureName, actualDocHtml, expectedDocHtml);
        diffs.push(diff);
      }

      outputDiv.append(fragment);

      assert.equal(actualDocHtml, expectedDocHtml);
    });
  });
});
