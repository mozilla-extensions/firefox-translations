/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { detag, project } from "./detagAndProject";
import {
  createHeader,
  drawDiffUi,
  visuallyAssertDeepEqual,
} from "../../../shared-resources/test-utils";

const testSuiteName = "detagAndProject";

describe(testSuiteName, function() {
  const outputDiv = document.getElementById("output");
  const diffContainerDiv = document.getElementById("diff");
  const diffDiv = document.createElement("div");
  const diffs = [];

  before(function() {
    outputDiv.append(createHeader(2, testSuiteName));
  });

  after(function() {
    diffContainerDiv.append(createHeader(2, testSuiteName), diffDiv);
    drawDiffUi(diffDiv, diffs.join("\n"));
  });

  const testName = `Without alignment info`;
  it(testName, async function() {
    console.info(`${testSuiteName}: ${testName}`);

    const fixtures = [
      {
        input: "foo",
        expectedPlainString: "foo",
        translation: "foo",
        expectedProjectedString: "foo",
      },
      {
        input: "foo bar",
        expectedPlainString: "foo bar",
        translation: "foo bar",
        expectedProjectedString: "foo bar",
      },
      {
        input: "<b>foo</b> bar",
        expectedPlainString: "foo bar",
        translation: "foo bar",
        expectedProjectedString: "<b>foo</b> bar",
      },
      {
        input: "<b>foo</b>bar",
        expectedPlainString: "foobar",
        translation: "foobar",
        expectedProjectedString: "<b>foobar</b>",
      },
      {
        input: "<b>foo</b> bar",
        expectedPlainString: "foo bar",
        translation: "bar foo",
        expectedProjectedString: "<b>bar</b> foo",
      },
      {
        input: "<b>foo</b>.",
        expectedPlainString: "foo.",
        translation: "bar.",
        expectedProjectedString: "<b>bar.</b>",
      },
      {
        input: '<div id="n0"><b id="n1">Hola</b> mundo</div>',
        expectedPlainString: "Hola mundo",
        translation: "Hello world",
        expectedProjectedString:
          '<div id="n0"><b id="n1">Hello</b> world</div>',
      },
      {
        input: '<div id="n0"><b id="n1">Bienvenidos</b> a Wikipedia,</div>',
        expectedPlainString: "Bienvenidos a Wikipedia,",
        translation: "Welcome to Wikipedia,",
        expectedProjectedString:
          '<div id="n0"><b id="n1">Welcome</b> to Wikipedia,</div>',
      },
      {
        input: '<div id="n0"><br>artículos<b id="n1"> en español</b>.</div>',
        expectedPlainString: "artículos en español.",
        translation: "articles in Spanish.",
        expectedProjectedString:
          '<div id="n0"><br>articles<b id="n1"> in Spanish.</b></div>',
      },
    ];

    const plainStrings = [];
    const projectedStrings = [];
    const expectedPlainStrings = [];
    const expectedProjectedStrings = [];

    fixtures.forEach(
      ({
        input,
        expectedPlainString,
        translation,
        expectedProjectedString,
      }) => {
        const detaggedString = detag(input);
        const projectedString = project(detaggedString, translation);
        console.debug({
          input,
          expectedPlainString,
          translation,
          expectedProjectedString,
          detaggedString,
          projectedString,
        });
        plainStrings.push(detaggedString.plainString);
        expectedPlainStrings.push(expectedPlainString);
        projectedStrings.push(projectedString);
        expectedProjectedStrings.push(expectedProjectedString);
      },
    );

    // Visual output of test results
    const fragment = document.createDocumentFragment();
    visuallyAssertDeepEqual(
      plainStrings,
      expectedPlainStrings,
      `${testName}: Detagged plain strings`,
      fragment,
      diffs,
    );
    visuallyAssertDeepEqual(
      projectedStrings,
      expectedProjectedStrings,
      `${testName}: Projected strings`,
      fragment,
      diffs,
    );
    outputDiv.append(fragment);

    assert.deepEqual(plainStrings, expectedPlainStrings);
    assert.deepEqual(projectedStrings, expectedProjectedStrings);
  });
});
