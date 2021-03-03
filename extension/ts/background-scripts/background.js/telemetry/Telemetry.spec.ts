/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { Telemetry } from "./Telemetry";
import { closed, translate } from "./generated/infobar";
import { fromLang, toLang } from "./generated/metadata";
import { translationTime } from "./generated/performance";

const testSuite = "Telemetry";
describe(testSuite, function() {
  const testName = "telemetry test:test_metrics_collected";
  it(testName, async function() {
    console.info(`${testSuite}: ${testName}`);
    const langFrom = "es";
    const langTo = "en";
    const expectedTime = "125";
    const pingName = "custom";
    const telemetry = new Telemetry();
    // todo: figure out how to mock submitting
    telemetry.setUploadEnabled(true);

    telemetry.record(() => fromLang.set(langFrom), "testFromLang");
    telemetry.record(() => toLang.set(langTo), "testLantTo");
    telemetry.record(() => translate.record(), "testTranslate");
    telemetry.record(() => closed.record(), "testClosed");
    telemetry.record(() => translationTime.set(expectedTime), "testTime");

    assert.equal(1, (await translate.testGetValue(pingName)).length);
    assert.equal(1, (await closed.testGetValue(pingName)).length);
    assert.equal(langFrom, await fromLang.testGetValue(pingName));
    assert.equal(langTo, await toLang.testGetValue(pingName));
    assert.equal(expectedTime, await translationTime.testGetValue(pingName));

    telemetry.submit();
    assert.isUndefined(await translate.testGetValue(pingName));
    assert.isUndefined(await fromLang.testGetValue(pingName));

    console.log("test passed");
  });
});
