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

/* eslint-disable mocha/no-setup-in-describe */
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
        input: "<b>foo</b> bar one two three",
        expectedPlainString: "foo bar one two three",
        translation: "bar foo uno",
        expectedProjectedString: "<b>bar</b> foo uno",
      },
      {
        input: "foo bar one two <b>three</b>",
        expectedPlainString: "foo bar one two three",
        translation: "bar foo uno",
        expectedProjectedString: "bar foo uno<b></b>",
      },
      {
        input: "<b>foo</b> bar one",
        expectedPlainString: "foo bar one",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "<b>bar</b> foo uno dos tres",
      },
      {
        input: "foo bar <b>one</b>",
        expectedPlainString: "foo bar one",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "bar foo <b>uno dos tres</b>",
      },
      {
        input: "<div><b>foo</b> bar one two three</div>",
        expectedPlainString: "foo bar one two three",
        translation: "bar foo uno",
        expectedProjectedString: "<div><b>bar</b> foo uno</div>",
      },
      {
        input: "<div>foo bar one two <b>three</b></div>",
        expectedPlainString: "foo bar one two three",
        translation: "bar foo uno",
        expectedProjectedString: "<div>bar foo uno<b></b></div>",
      },
      {
        input: "<div><b>foo</b> bar one</div>",
        expectedPlainString: "foo bar one",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "<div><b>bar</b> foo uno dos tres</div>",
      },
      {
        input: "<div>foo bar <b>one</b></div>",
        expectedPlainString: "foo bar one",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "<div>bar foo <b>uno</b> dos tres</div>",
      },
      {
        input: "<br><b>foo</b> bar one<br>",
        expectedPlainString: " foo bar one ",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "<br><b>bar</b> foo uno dos tres<br>",
      },
      {
        input: "<b>foo</b> bar <a>one</a>",
        expectedPlainString: "foo bar one",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "<b>bar</b> foo <a>uno dos tres</a>",
      },
      {
        input: "<b>foo</b> <a>bar</a> one",
        expectedPlainString: "foo bar one",
        translation: "bar foo uno dos tres",
        expectedProjectedString: "<b>bar</b> <a>foo</a> uno dos tres",
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
        expectedPlainString: " artículos en español.",
        translation: "articles in Spanish.",
        expectedProjectedString:
          '<div id="n0"><br>articles<b id="n1"> in Spanish.</b></div>',
      },
      {
        input:
          "<div id=n0><br><b id=n1>(hace 400 años)</b>: En Estados Unidos, se firma el <b id=n2>Pacto del Mayflower</b>, que establece un Gobierno.</div>",
        expectedPlainString:
          " (hace 400 años): En Estados Unidos, se firma el Pacto del Mayflower, que establece un Gobierno.",
        translation:
          "(400 years ago): In the United States, the Mayflower Pact, which establishes a government, is signed.",
        expectedProjectedString:
          '<div id="n0"><br><b id="n1">(400 years ago):</b> In the United States, the Mayflower Pact, <b id="n2">which establishes a</b> government, is signed.</div>',
      },
      {
        input:
          "<div id=n2> la enciclopedia de contenido libre<br>que <b id=n3>todos pueden editar</b>. </div>",
        expectedPlainString:
          " la enciclopedia de contenido libre que todos pueden editar. ",
        translation: "the free content encyclopedia that everyone can edit.",
        expectedProjectedString:
          '<div id="n2"> the free content encyclopedia that<br>everyone <b id="n3">can edit.</b></div>',
      },
      {
        input:
          "<div id=n0><br><b id=n1>(hace 50 años)</b>: Fallece <b id=n2>Chandrasekhara Raman</b>, físico indio (n. 1888; <b id=n3>en la imagen</b>), premio Nobel de física en 1930.</div>",
        expectedPlainString:
          " (hace 50 años): Fallece Chandrasekhara Raman, físico indio (n. 1888; en la imagen), premio Nobel de física en 1930.",
        translation:
          "(50 years ago): Chandrasekhara Raman, Indian physicist, dies (n 1888; in pictures), Nobel laureate in 1930.",
        expectedProjectedString:
          '<div id="n0"><br><b id="n1">(50 years ago):</b> Chandrasekhara Raman, <b id="n2">Indian physicist,</b> dies (n 1888; in pictures), <b id="n3">Nobel laureate in</b> 1930.</div>',
      },
    ];

    const plainStrings = [];
    const translations = [];
    const projectedStrings = [];
    const expectedPlainStrings = [];
    const expectedProjectedStrings = [];
    const expectedProjectedThenDetaggedStrings = [];

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
        translations.push(translation);
        projectedStrings.push(projectedString);
        expectedProjectedStrings.push(expectedProjectedString);
        const { plainString: expectedProjectedThenDetaggedString } = detag(
          expectedProjectedString,
        );
        // Trim the expected projected then detagged string since the engine always returns trimmed translations
        expectedProjectedThenDetaggedStrings.push(
          expectedProjectedThenDetaggedString.trim(),
        );
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
    // Sanity check that makes sure that we get the translated plain string back if we detag the projected string
    visuallyAssertDeepEqual(
      translations,
      expectedProjectedThenDetaggedStrings,
      `${testName}: Projected then detagged strings match the translated plain strings`,
      fragment,
      diffs,
    );
    outputDiv.append(fragment);

    assert.deepEqual(plainStrings, expectedPlainStrings);
    assert.deepEqual(projectedStrings, expectedProjectedStrings);
  });
});
