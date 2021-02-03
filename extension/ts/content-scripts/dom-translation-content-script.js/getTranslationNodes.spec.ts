/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { getTranslationNodes } from "./getTranslationNodes";

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

<!-- Test that nodes with only punctuation, whitespace
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
</div>`;

  const testcasesDoc = domParser.parseFromString(testcasesHtml, "text/html");
  const testcases = testcasesDoc.querySelectorAll("div[expected]");

  testcases.forEach(testcaseNode => {
    const testName = `Testcase: ${testcaseNode.id}`;
    it(testName, async function() {
      console.info(`getTranslationNodes: ${testName}`);
      const translationNodes = getTranslationNodes(testcaseNode);

      const expectedResult = testcaseNode.getAttribute("expected");
      const expectedLength = expectedResult.split(" ").length;

      assert.equal(
        translationNodes.length,
        expectedLength,
        "Correct number of translation nodes for testcase " + testcaseNode.id,
      );

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
        "Correct number of translation nodes for testcase " + testcaseNode.id,
      );

      assert.equal(
        resultList.join(" "),
        expectedResult,
        "Correct list of translation nodes for testcase " + testcaseNode.id,
      );
    });
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
