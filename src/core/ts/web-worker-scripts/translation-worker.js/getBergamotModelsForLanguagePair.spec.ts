/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { assert, expect } = chai;

import { getBergamotModelsForLanguagePair } from "./getBergamotModelsForLanguagePair";

// Using cache-polyfill to work around https://bugzilla.mozilla.org/show_bug.cgi?id=1575625
import { caches } from "cache-polyfill";
import { config, modelRegistry } from "../../config";
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
      modelRegistry,
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
      modelRegistry,
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
      modelRegistry,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });

  it("ende", async function() {
    const languagePair = "ende";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });

  it("enes", async function() {
    const languagePair = "enes";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });

  it("enet", async function() {
    const languagePair = "enet";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    const blobs = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
    );

    assert.equal(blobs.length, 3);
  });

  it("a non-existent language pair", async function() {
    const languagePair = "xyz";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    expect(
      getBergamotModelsForLanguagePair(
        languagePair,
        config.bergamotModelsBaseUrl,
        {
          ...modelRegistry,
          xyz: {
            lex: {
              name: "foo",
              expectedSha256Hash: "foo",
            },
            model: {
              name: "foo",
              expectedSha256Hash: "foo",
            },
            vocab: {
              name: "foo",
              expectedSha256Hash: "foo",
            },
          },
        },
        cache,
        log,
      ),
    ).to.be.rejectedWith(Error);
  });
});
