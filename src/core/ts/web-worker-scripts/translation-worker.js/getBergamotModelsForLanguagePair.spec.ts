/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from "chai";
import { getBergamotModelsForLanguagePair } from "./getBergamotModelsForLanguagePair";

// Using cache-polyfill to work around https://bugzilla.mozilla.org/show_bug.cgi?id=1575625
import { caches } from "cache-polyfill";
import { config } from "../../config";
import { nanoid } from "nanoid";

const log = console.info;
const testSuiteExecutionUuid = nanoid();

describe("getBergamotModelsForLanguagePair", function() {
  it("esen", async function() {
    const languagePair = "esen";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });

  it("esen again", async function() {
    const languagePair = "esen";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });

  it("eten", async function() {
    const languagePair = "eten";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });
});
