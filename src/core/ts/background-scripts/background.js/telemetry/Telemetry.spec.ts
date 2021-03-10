/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { Telemetry } from "./Telemetry";
import { counterTest, eventTest, stringTest } from "./generated/test";

const testSuite = "Telemetry";
// todo: enable when glean.js supports test tools to not upload pings
describe.skip(testSuite, function() {
  const testName = "telemetry test:metrics_collected";
  it(testName, async function() {
    console.info(`${testSuite}: ${testName}`);
    const testStrVal = "test";
    const pingName = "custom";
    const telemetry = new Telemetry();

    telemetry.record(() => eventTest.record(), "testEvent");
    telemetry.record(() => counterTest.add(), "testCounter");
    telemetry.record(() => stringTest.set(testStrVal), "testString");

    assert.equal(1, (await eventTest.testGetValue(pingName)).length);
    assert.equal(1, await counterTest.testGetValue(pingName));
    assert.equal(testStrVal, await stringTest.testGetValue(pingName));

    telemetry.submit();
    assert.isUndefined(await eventTest.testGetValue(pingName));
    assert.isUndefined(await counterTest.testGetValue(pingName));
    assert.isUndefined(await stringTest.testGetValue(pingName));

    console.log("test passed");
  });
});
