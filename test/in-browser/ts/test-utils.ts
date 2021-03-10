/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Diff2HtmlUI } from "diff2html/lib-esm/ui/js/diff2html-ui";
import { Diff2HtmlUIConfig } from "diff2html/lib/ui/js/diff2html-ui-base";
import "diff2html/bundles/css/diff2html.min.css";
import { TranslationItem } from "../../../src/core/ts/content-scripts/dom-translation-content-script.js/TranslationItem";
import { TranslationDocument } from "../../../src/core/ts/content-scripts/dom-translation-content-script.js/TranslationDocument";
const Diff = require("diff");
const prettier = require("prettier/standalone");
const plugins = [require("prettier/parser-html")];

export const fetchFixtureHtml = async fixture => {
  const fixtureBaseUrl = "http://0.0.0.0:4000";
  const url = `${fixtureBaseUrl}/${fixture}`;
  const response = await fetch(url);
  return response.text();
};

export const documentToHTML = document => {
  return new XMLSerializer().serializeToString(document);
};

export const prettyHTML = html => {
  return prettier.format(html, {
    parser: "html",
    plugins,
  });
};

export const createHeader = (level, text) => {
  const header = document.createElement(`h${level}`);
  header.innerText = `${text}`;
  return header;
};

export const createIframeShowingHTML = html => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("sandbox", "");
  iframe.srcdoc = html;
  return iframe;
};

export const unifiedDiff = (fixtureName, actual, expected) => {
  return Diff.createPatch(`${fixtureName}`, expected, actual);
};

export const createElementShowingPlainText = html => {
  const textarea = document.createElement("textarea");
  textarea.value = html;
  return textarea;
};

export const drawDiffUi = (targetElement, diffString) => {
  const configuration: Diff2HtmlUIConfig = {
    drawFileList: true,
    matching: "lines",
    highlight: true,
  };
  const diff2htmlUi = new Diff2HtmlUI(targetElement, diffString, configuration);
  diff2htmlUi.draw();
};

export const translationDocumentStringRepresentations = (
  translationDocument: TranslationDocument,
): {
  originals: (string | TranslationItem)[];
  markupsToTranslate: string[];
  translatedMarkups: string[];
  translations: (string | TranslationItem)[];
} => {
  const originals = [];
  const markupsToTranslate = [];
  const translatedMarkups = [];
  const translations = [];
  translationDocument.translationRoots.forEach(translationRoot => {
    originals.push(translationRoot.original);
    markupsToTranslate.push(
      translationDocument.generateMarkupToTranslate(translationRoot),
    );
    translatedMarkups.push(translationRoot.translatedMarkup);
    translations.push(translationRoot.translation);
  });
  return {
    originals,
    markupsToTranslate,
    translatedMarkups,
    translations,
  };
};

export const visuallyAssertDeepEqual = (
  actual,
  expected,
  header,
  fragment,
  diffs,
) => {
  const actualJson = JSON.stringify(actual, null, 2);
  const expectedJson = JSON.stringify(expected, null, 2);

  fragment.append(createHeader(3, header));

  fragment.append(createHeader(4, "Actual"));
  fragment.append(createElementShowingPlainText(actualJson));

  if (actualJson !== expectedJson) {
    fragment.append(createHeader(4, "Expected"));
    fragment.append(createElementShowingPlainText(expectedJson));
    const diff = unifiedDiff(header, actualJson, expectedJson);
    diffs.push(diff);
  }
};
