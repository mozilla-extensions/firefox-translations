/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { telemetry } from "./Telemetry";
import { counterTest, eventTest, stringTest } from "./generated/test";

const testStrVal = "test";
const pingName = "custom";

const submitAndAssert = async () => {
  const eventTestValue = await eventTest.testGetValue(pingName);
  const counterTestValue = await counterTest.testGetValue(pingName);
  const stringTestValue = await stringTest.testGetValue(pingName);
  // const fromLangValue = await fromLang.testGetValue(pingName);
  // const toLangValue = await toLang.testGetValue(pingName);
  const mostRecentEventTestValue = eventTestValue.slice().pop();

  console.log({
    eventTestValue,
    mostRecentEventTestValue,
    counterTestValue,
    stringTestValue,
    // fromLangValue,
    // toLangValue,
  });

  // assert.equal(eventTestValue.length, 1);
  assert.equal(mostRecentEventTestValue.name, "event_test");
  // assert.equal(counterTestValue, 1);
  assert.equal(stringTestValue, testStrVal);

  telemetry.submit();
  assert.isUndefined(await eventTest.testGetValue(pingName));
  assert.isUndefined(await counterTest.testGetValue(pingName));
  assert.isUndefined(await stringTest.testGetValue(pingName));
  // assert.isUndefined(await fromLang.testGetValue(pingName));
  // assert.isUndefined(await toLang.testGetValue(pingName));
};

describe("Telemetry", function() {
  beforeEach(async function() {
    // TODO: Reset Glean before running each test
    // await Glean.testResetGlean("org-mozilla-bergamot-in-browser-tests");
  });

  it("test metrics collected via Glean.js directly", async function() {
    console.info(this.test.fullTitle());

    eventTest.record();
    // eventTest.record({ from_lang: "from", to_lang: "to" })
    counterTest.add();
    stringTest.set(testStrVal);

    await submitAndAssert();
  });
});
