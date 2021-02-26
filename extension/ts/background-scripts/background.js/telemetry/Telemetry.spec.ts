/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { Telemetry } from "./Telemetry";
import { translate } from "./generated/infobar";

const testSuite = "Telemetry";
describe(testSuite, function() {
  const testName = "increment test:test_event";
  it(testName, async function() {
    console.info(`${testSuite}: ${testName}`);
    Telemetry.global().setUploadEnabled(false);

    Telemetry.global().record(() => translate.record(), "es", "en");

    const events = await translate.testGetValue();
    assert.equal(1, events.length);
    console.log("test passed");
  });
});