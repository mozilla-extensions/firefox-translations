/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { Telemetry } from "./Telemetry";

const testSuite = "Telemetry";
describe(testSuite, function() {
  const testName = "increment test:test_counter";
  it(testName, async function() {
    console.info(`${testSuite}: ${testName}`);
    const telemetry = new Telemetry();
    const results = telemetry.increment(
      "test",
      "testCounter",
      "test_from_lang",
      "test_to_lang",
    );
    console.debug({ results });
    assert.isUndefined(results);
  });
});
