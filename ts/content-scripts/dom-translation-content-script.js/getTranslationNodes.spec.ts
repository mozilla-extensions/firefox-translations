/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { getTranslationNodes } from "./getTranslationNodes";

/* eslint-disable mocha/no-setup-in-describe */
describe("getTranslationNodes", function() {
  const domParser = new DOMParser();

  const testcasesHtml = `
<!-- Test that an inline element inside a root is not a root -->
<div id="testcase1"
     expected="div[root] span">
  <div>
    lorem ipsum <span>dolor</span> sit amet
  </div>
</div>

<!-- Test that an inline paragraph element inside a root is a root -->
<div id="testcase1c"
     expected="div[root] p[root]">
  <div>
    lorem ipsum <p>dolor</p> sit amet
  </div>
</div>

<!-- Test that an inline nested element inside a root is not a root -->
<div id="testcase1b"
     expected="div[root] a">
  <div>
    lorem ipsum <b><a>dolor</a></b> sit amet
  </div>
</div>

<!-- Test that a usually inline element becomes a root if it is
     displayed as a block -->
<div id="testcase2"
     expected="div[root] span[root]">
  <div>
    lorem ipsum <span style="display: block;">dolor</span> sit amet
  </div>
</div>

<!-- Test that the content-less <div> is ignored and only the
     <p> with content is returned -->
<div id="testcase3"
     expected="p[root]">
  <div>
    <p>lorem ipsum</p>
  </div>
</div>

<!-- Test that an inline element which the parent is not a root
     becomes a root -->
<div id="testcase4"
     expected="span[root]">
  <div>
    <span>lorem ipsum</span>
  </div>
</div>

<!-- Test siblings -->
<div id="testcase5"
     expected="li[root] li[root]">
  <ul>
    <li>lorem</li>
    <li>ipsum</li>
  </ul>
</div>

<!-- Test <ul> with content outside li -->
<div id="testcase6"
     expected="ul[root] li[root] li[root]">
  <ul>Lorem
    <li>lorem</li>
    <li>ipsum</li>
  </ul>
</div>

<!-- Test inline siblings -->
<div id="testcase7"
     expected="ul[root] li li">
  <ul>Lorem
    <li style="display: inline">lorem</li>
    <li style="display: inline">ipsum</li>
  </ul>
</div>

<!-- Test inline siblings becoming roots -->
<div id="testcase8"
     expected="li[root] li[root]">
  <ul>
    <li style="display: inline">lorem</li>
    <li style="display: inline">ipsum</li>
  </ul>
</div>

<!-- Test that root nodes with only punctuation, whitespace
     or numbers are ignored -->
<div id="testcase9"
     expected="li[root] li[root]">
  <ul>
    <li>lorem</li>
    <li>ipsum</li>
    <li>-.,;'/!@#$%^*()</li>
    <li>0123456789</li>
    <li>
          </li>
  </ul>
</div>

<!-- Test that only root nodes with only punctuation, whitespace
     or numbers are ignored -->
<div id="testcase9b"
     expected="li[root] li[root] li[root]">
  <ul>
    <li>lorem <b>0123456789</b></li>
    <li>ipsum <b>-.,;'/!@#$%^*()</b></li>
    <li>dolor <b>
          </b></li>
    <li>-.,;'/!@#$%^*()</li>
    <li>0123456789</li>
    <li>
          </li>
  </ul>
</div>

<!-- Test paragraphs -->
<div id="testcase10"
     expected="p[root] a b p[root] a b">
  <p>Lorem ipsum <a href="a.htm">dolor</a> sit <b>amet</b>, consetetur</p>
  <p>Lorem ipsum <a href="a.htm">dolor</a> sit <b>amet</b>, consetetur</p>
</div>

<!-- Test that a display:none element is not ignored -->
<div id="testcase11"
     expected="p[root] a b">
  <p>Lorem ipsum <a href="a.htm">dolor</a> sit <b style="display:none">amet</b>, consetetur</p>
</div>

<!-- Test that deep nesting does not cause useless content to be returned -->
<div id="testcase12"
     expected="p[root]">
  <div>
    <div>
      <div>
        <p>Lorem ipsum</p>
      </div>
    </div>
  </div>
</div>

<!-- Test that deep nesting does not cause useless content to be returned -->
<div id="testcase13"
     expected="div[root] p[root]">
  <div>Lorem ipsum
    <div>
      <div>
        <p>Lorem ipsum</p>
      </div>
    </div>
  </div>
</div>

<!-- Test that non-html elements and elements that usually have non-translatable
     content are ignored -->
<div id="testcase14"
     expected="div[root]">
  <div>
    Lorem Ipsum
    <noscript>Lorem Ipsum</noscript>
    <style>.dummyClass { color: blue; }</style>
    <script> /* script tag */ </script>
    <code> code </code>
    <iframe id="testiframe"
            srcdoc="<div>Lorem ipsum</div>">
    </iframe>
    <svg>lorem</svg>
    <math>ipsum</math>
  </div>
</div>

<!-- Test that nesting of inline elements won't produce roots as long as
     the parents are in the list of translation nodes -->
<div id="testcase15"
     expected="p[root] a b span em">
  <p>Lorem <a>ipsum <b>dolor <span>sit</span> amet</b></a>, <em>consetetur</em></p>
</div>

<!-- Test that comment nodes are not considered for translation -->
<div id="testcase16"
     expected="p[root] p[root]">
  <p>Lorem ipsum</p>
  <div>  <!-- Comment -->  </div>
  <p>Lorem ipsum</p>
</div>

<!-- Test that comment nodes are not considered for translation -->
<div id="testcase17"
     expected="p[root]">
  <div>
    <!-- Comment -->
    <p>Lorem Ipsum</p>
  </div>
</div>

<!-- Test a more complex case -->
<div id="testcase18"
     expected="li[root] i a">
  <li><b><a href="https://es.wikipedia.org/wiki/1620" title="1620">1620</a></b> <i>(hace 400 años)</i>: En Estados Unidos, se firma el <b><a href="https://es.wikipedia.org/wiki/Pacto_del_Mayflower" title="Pacto del Mayflower">Pacto del Mayflower</a></b>, que establece un Gobierno.</li>
</div>`;

  const testcasesDoc = domParser.parseFromString(testcasesHtml, "text/html");
  const testcases = testcasesDoc.querySelectorAll("div[expected]");

  testcases.forEach(testcaseNode => {
    const testName = `Testcase: ${testcaseNode.id}`;
    it(testName, async function() {
      console.info(`getTranslationNodes: ${testName}`, testcaseNode.outerHTML);
      const translationNodes = getTranslationNodes(<HTMLElement>testcaseNode);

      const expectedResult = testcaseNode.getAttribute("expected");
      const expectedLength = expectedResult.split(" ").length;

      const resultList = [];
      for (let i = 0; i < translationNodes.length; i++) {
        let node = translationNodes[i].content.localName;
        if (translationNodes[i].isTranslationRoot) {
          node += "[root]";
        }
        resultList.push(node);
      }

      assert.equal(
        resultList.length,
        translationNodes.length,
        `Correct number of translation nodes for testcase ${testcaseNode.id}`,
      );

      assert.equal(
        translationNodes.length,
        expectedLength,
        `Correct number of translation nodes for testcase ${
          testcaseNode.id
        } (current result: "${resultList.join(
          " ",
        )}", expected result: "${expectedResult}")`,
      );

      assert.equal(
        resultList.join(" "),
        expectedResult,
        `Correct list of translation nodes for testcase ${
          testcaseNode.id
        } (current result: "${resultList.join(
          " ",
        )}", expected result: "${expectedResult}")`,
      );
    });
  });

  it("Limit", async function() {
    const body = document.createElement("body");

    for (let i = 0; i < 11; i++) {
      const text = document.createTextNode("a");
      const node = document.createElement("b");
      node.appendChild(text);
      body.appendChild(node);
    }

    const translationRoots = getTranslationNodes(body, [], 10);
    assert.equal(
      translationRoots.length,
      10,
      "Translation nodes were limited to 10 nodes.",
    );
  });

  it("Limit - nested", async function() {
    const testDoc = domParser.parseFromString(
      `<html>
<ul>
    <li>Foo<a><b>Bar</b></a><div>Lorem</div></li>
    <li>Foo<a><b>Bar</b></a><div>Lorem</div></li>
    <li>Foo<a><b>Bar</b></a><div>Lorem</div></li>
    <li>Foo<a><b>Bar</b></a><div>Lorem</div></li>
</ul>
</html>`,
      "text/html",
    );

    const translationRoots = getTranslationNodes(testDoc.body, [], 10);
    assert.equal(
      translationRoots.length,
      10,
      "Translation nodes were limited to 10 nodes.",
    );
  });

  /*
  var testiframe = document.getElementById("testiframe");
  var iframediv = testiframe.contentDocument.querySelector("div");
  try {
    var foo = utils.getTranslationNodes(iframediv);
    ok(false, "Cannot use a node from a different document");
  } catch (e) {
    is(e.name, "WrongDocumentError", "Cannot use a node from a different document");
  }
  */
});
