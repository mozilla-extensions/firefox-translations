/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Diff2HtmlUI } from "diff2html/lib-esm/ui/js/diff2html-ui";
import { Diff2HtmlUIConfig } from "diff2html/lib/ui/js/diff2html-ui-base";
import "diff2html/bundles/css/diff2html.min.css";
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

export const createElementShowingHTML = html => {
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
