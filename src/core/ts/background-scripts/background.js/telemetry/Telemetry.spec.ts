/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { gleanRecorder, telemetry } from "./Telemetry";
import { counterTest, eventTest, stringTest } from "./generated/test";
import { fromLang, toLang } from "./generated/metadata";

import {
  modelLoadTime,
  translationTime,
  wordsPerSecond,
} from "./generated/performance";

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

  it("test metrics collected via GleanRecorder", async function() {
    console.info(this.test.fullTitle());

    await gleanRecorder.transaction(async () => {
      eventTest.record();
      // eventTest.record({ from_lang: "from", to_lang: "to" })
      counterTest.add();
      stringTest.set(testStrVal);
    });

    await submitAndAssert();
  });

  it("expect multiple simultaneous async metrics collection not to work when using Glean.js directly", async function() {
    console.info(this.test.fullTitle());

    const expected = {};
    const actual = {};

    // Dispatch 10 metrics collections simultaneously
    await Promise.all(
      [...Array(10).keys()].map(index => {
        return (async () => {
          expected[index] = {
            from: `from${index}`,
            to: `to${index}`,
            $modelLoadTime: `${index}`,
            $translationTime: `${index}`,
            $wordsPerSecond: `${index}`,
          };
          await telemetry.onTranslationAttemptConcluded(
            `from${index}`,
            `to${index}`,
            index,
            index,
            index,
            async () => {
              actual[index] = {
                from: await fromLang.testGetValue(pingName),
                to: await toLang.testGetValue(pingName),
                $modelLoadTime: await modelLoadTime.testGetValue(pingName),
                $translationTime: await translationTime.testGetValue(pingName),
                $wordsPerSecond: await wordsPerSecond.testGetValue(pingName),
              };
            },
          );
        })();
      }),
    );

    console.log({ actual, expected });
    assert.notDeepEqual(actual, expected);
  });

  it("expect multiple simultaneous async metrics collection to work when using Glean.js via GleanRecorder", async function() {
    console.info(this.test.fullTitle());

    const expected = {};
    const actual = {};

    // Dispatch 10 metrics collections simultaneously
    await Promise.all(
      [...Array(10).keys()].map(index => {
        return (async () => {
          expected[index] = {
            from: `from${index}`,
            to: `to${index}`,
            $modelLoadTime: `${index}`,
            $translationTime: `${index}`,
            $wordsPerSecond: `${index}`,
          };

          return gleanRecorder.transaction(async () => {
            await telemetry.onTranslationAttemptConcluded(
              `from${index}`,
              `to${index}`,
              index,
              index,
              index,
              async () => {
                actual[index] = {
                  from: await fromLang.testGetValue(pingName),
                  to: await toLang.testGetValue(pingName),
                  $modelLoadTime: await modelLoadTime.testGetValue(pingName),
                  $translationTime: await translationTime.testGetValue(
                    pingName,
                  ),
                  $wordsPerSecond: await wordsPerSecond.testGetValue(pingName),
                };
              },
            );
          });
        })();
      }),
    );

    console.log({ actual, expected });
    assert.deepEqual(actual, expected);
  });
});
