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
import { custom } from "./generated/pings";

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

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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

  it("expect multiple simultaneous async metrics collection not to work when using Glean.js directly in an async function", async function() {
    console.info(this.test.fullTitle());

    const expected = {};
    const actual = {};

    const asyncFunction = async function onTranslationAttemptConcluded(
      from: string,
      to: string,
      $modelLoadTime: number,
      $translationTime: number,
      $wordsPerSecond: number,
      beforeSubmit: () => Promise<void> = undefined,
    ) {
      fromLang.set(from);
      toLang.set(to);
      modelLoadTime.set(String($modelLoadTime));
      translationTime.set(String($translationTime));
      wordsPerSecond.set(String($wordsPerSecond));
      if (beforeSubmit) {
        await beforeSubmit();
      }
      custom.submit();
    };

    // Dispatch 10 metrics collections simultaneously
    const count = 10;
    const promise = Promise.all(
      [...Array(10).keys()].map(index => {
        return (async () => {
          expected[index] = {
            from: `from${index}`,
            to: `to${index}`,
            $modelLoadTime: `${index}`,
            $translationTime: `${index}`,
            $wordsPerSecond: `${index}`,
          };
          console.log(
            `Sleeping 1s before dispatching async function - ${index}`,
          );
          await sleep(1000);
          console.log(`Dispatching async function - ${index}`);
          await asyncFunction(
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
          console.log(`Completed async function - ${index}`);
        })();
      }),
    );
    console.log(`Dispatched ${count} async functions`);
    await promise;
    console.log(`${count} async functions finished executing asynchronously`);

    console.log({ actual, expected });
    assert.notDeepEqual(actual, expected);
  });

  it("expect multiple simultaneous async metrics collection to work when using Glean.js directly in a sync function", async function() {
    console.info(this.test.fullTitle());

    const expected = {};

    const syncFunction = function onTranslationAttemptConcluded(
      from: string,
      to: string,
      $modelLoadTime: number,
      $translationTime: number,
      $wordsPerSecond: number,
    ) {
      fromLang.set(from);
      toLang.set(to);
      modelLoadTime.set(String($modelLoadTime));
      translationTime.set(String($translationTime));
      wordsPerSecond.set(String($wordsPerSecond));
      custom.submit();
    };

    // Dispatch 10 metrics collections simultaneously
    const count = 10;
    const promise = Promise.all(
      [...Array(count).keys()].map(index => {
        return (async () => {
          expected[index] = {
            from: `from${index}`,
            to: `to${index}`,
            $modelLoadTime: `${index}`,
            $translationTime: `${index}`,
            $wordsPerSecond: `${index}`,
          };
          console.log(
            `Sleeping 1s before dispatching sync function - ${index}`,
          );
          await sleep(1000);
          console.log(`Dispatching sync function - ${index}`);
          syncFunction(`from${index}`, `to${index}`, index, index, index);
          console.log(`Completed sync function - ${index}`);
        })();
      }),
    );
    console.log(`Dispatched ${count} sync functions`);
    await promise;
    console.log(`${count} sync functions finished executing asynchronously`);

    console.log({ expected });
    // assert.notDeepEqual(actual, expected);
  });

  it("expect multiple simultaneous async metrics collection to work when using Glean.js directly in a sync function in an async wrapper", async function() {
    console.info(this.test.fullTitle());

    const expected = {};

    const syncFunction = function onTranslationAttemptConcluded(
      from: string,
      to: string,
      $modelLoadTime: number,
      $translationTime: number,
      $wordsPerSecond: number,
    ) {
      fromLang.set(from);
      toLang.set(to);
      modelLoadTime.set(String($modelLoadTime));
      translationTime.set(String($translationTime));
      wordsPerSecond.set(String($wordsPerSecond));
      custom.submit();
    };

    // Dispatch 10 metrics collections simultaneously
    const count = 10;
    const promise = Promise.all(
      [...Array(count).keys()].map(index => {
        return (async () => {
          expected[index] = {
            from: `from${index}`,
            to: `to${index}`,
            $modelLoadTime: `${index}`,
            $translationTime: `${index}`,
            $wordsPerSecond: `${index}`,
          };
          console.log(
            `Sleeping 1s before dispatching sync function in an async wrapper - ${index}`,
          );
          await sleep(1000);
          console.log(
            `Dispatching sync function in an async wrapper - ${index}`,
          );
          /*
          new Promise<void>((resolve) => {
            syncFunction(`from${index}`, `to${index}`, index, index, index);
            resolve();
          })
           */
          await (async () => {
            // await sleep(1000);
            syncFunction(`from${index}`, `to${index}`, index, index, index);
            // await sleep(1000);
          })();
          console.log(`Completed sync function in an async wrapper - ${index}`);
        })();
      }),
    );
    console.log(`Dispatched ${count} sync functions in async wrappers`);
    await promise;
    console.log(
      `${count} sync functions in async wrappers finished executing asynchronously`,
    );

    console.log({ expected });
    // assert.notDeepEqual(actual, expected);
  });

  it("expect multiple simultaneous async metrics collection to work when using Glean.js via GleanRecorder", async function() {
    console.info(this.test.fullTitle());

    const expected = {};
    const actual = {};

    // Dispatch 10 metrics collections simultaneously
    const count = 10;
    const promise = Promise.all(
      [...Array(10).keys()].map(index => {
        return (async () => {
          expected[index] = {
            from: `from${index}`,
            to: `to${index}`,
            $modelLoadTime: `${index}`,
            $translationTime: `${index}`,
            $wordsPerSecond: `${index}`,
          };

          console.log(
            `Sleeping 1s before dispatching async function via GleanRecorder - ${index}`,
          );
          await sleep(1000);
          console.log(
            `Dispatching async function via GleanRecorder - ${index}`,
          );
          await gleanRecorder.transaction(async () => {
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
          console.log(`Completed async function via GleanRecorder - ${index}`);
        })();
      }),
    );
    console.log(`Dispatched ${count} async functions via GleanRecorder`);
    await promise;
    console.log(
      `${count} async functions via GleanRecorder finished executing asynchronously`,
    );

    console.log({ actual, expected });
    assert.deepEqual(actual, expected);
  });
});
