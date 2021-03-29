/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { telemetry } from "./Telemetry";
import { counterTest, eventTest, stringTest } from "./generated/test";
import Glean from "@mozilla/glean/webext";
import { config } from "../../../config";

const testStrVal = "test";
const pingName = "custom";

const submitAndAssert = async () => {
  const eventTestValue = await eventTest.testGetValue(pingName);
  const counterTestValue = await counterTest.testGetValue(pingName);
  const stringTestValue = await stringTest.testGetValue(pingName);
  const mostRecentEventTestValue = eventTestValue.slice().pop();

  console.log({
    eventTestValue,
    mostRecentEventTestValue,
    counterTestValue,
    stringTestValue,
  });

  assert.equal(eventTestValue.length, 1);
  assert.equal(mostRecentEventTestValue.name, "event_test");
  assert.equal(counterTestValue, 1);
  assert.equal(stringTestValue, testStrVal);

  telemetry.submit();
  assert.isUndefined(await eventTest.testGetValue(pingName));
  assert.isUndefined(await counterTest.testGetValue(pingName));
  assert.isUndefined(await stringTest.testGetValue(pingName));
};

describe("Telemetry", function() {
  beforeEach(async function() {
    // Reset Glean before running each test
    await Glean.testResetGlean(config.telemetryAppId);
  });

  it("test metrics collected", async function() {
    console.info(this.test.fullTitle());

    eventTest.record();
    // eventTest.record({ from_lang: "from", to_lang: "to" })
    counterTest.add();
    stringTest.set(testStrVal);

    await submitAndAssert();
  });

  it("test metrics collected again", async function() {
    console.info(this.test.fullTitle());

    eventTest.record();
    // eventTest.record({ from_lang: "from", to_lang: "to" })
    counterTest.add();
    stringTest.set(testStrVal);

    await submitAndAssert();
  });
});
