/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { assert, expect } = chai;

import { getBergamotModelsForLanguagePair } from "./getBergamotModelsForLanguagePair";

import { config } from "../../config";
import { modelRegistry } from "../../modelRegistry";
import { nanoid } from "nanoid";
import { ModelDownloadProgress } from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";

const log = console.info;
const testSuiteExecutionUuid = nanoid();

const dummyModelRegistryEntry = {
  lex: {
    name: "1.txt",
    size: 120,
    estimatedCompressedSize: 35,
    expectedSha256Hash:
      "3691becc4609d21e032657c902df09d8501132357d74b1a4cad408ada0add13d",
  },
  model: {
    name: "2.txt",
    size: 120,
    estimatedCompressedSize: 35,
    expectedSha256Hash:
      "3691becc4609d21e032657c902df09d8501132357d74b1a4cad408ada0add13d",
  },
  vocab: {
    name: "3.txt",
    size: 120,
    estimatedCompressedSize: 35,
    expectedSha256Hash:
      "3691becc4609d21e032657c902df09d8501132357d74b1a4cad408ada0add13d",
  },
};

/* eslint-disable mocha/no-setup-in-describe */
describe("getBergamotModelsForLanguagePair", function() {
  const languagePairsLeftToTest = config.supportedLanguagePairs;
  const [
    firstLanguagePairFrom,
    firstLanguagePairTo,
  ] = languagePairsLeftToTest.shift();
  const firstLanguagePair = `${firstLanguagePairFrom}${firstLanguagePairTo}`;
  it(`Download language pair: ${firstLanguagePair}`, async function() {
    const languagePair = firstLanguagePair;

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    let latestModelDownloadProgressSeen: ModelDownloadProgress;
    const downloadedModelFiles = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
      modelDownloadProgress => {
        latestModelDownloadProgressSeen = modelDownloadProgress;
      },
    );

    assert.equal(downloadedModelFiles.length, 3);
    assert.equal(
      latestModelDownloadProgressSeen.bytesDownloaded,
      latestModelDownloadProgressSeen.bytesToDownload,
    );
    assert.isAtLeast(latestModelDownloadProgressSeen.bytesDownloaded, 1);
  });

  it(`Download language pair again: ${firstLanguagePair}`, async function() {
    const languagePair = firstLanguagePair;

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    let latestModelDownloadProgressSeen: ModelDownloadProgress;
    const downloadedModelFiles = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      modelRegistry,
      cache,
      log,
      modelDownloadProgress => {
        latestModelDownloadProgressSeen = modelDownloadProgress;
      },
    );

    assert.equal(downloadedModelFiles.length, 3);
    assert.equal(latestModelDownloadProgressSeen.bytesDownloaded, 0);
  });

  // Download all remaining supported language pairs
  languagePairsLeftToTest.forEach(([from, to]) => {
    const languagePair = `${from}${to}`;
    const testName = `Download language pair: ${languagePair}`;
    it(testName, async function() {
      const cache = await caches.open(
        `tests:bergamot-models:${testSuiteExecutionUuid}`,
      );
      const downloadedModelFiles = await getBergamotModelsForLanguagePair(
        languagePair,
        config.bergamotModelsBaseUrl,
        modelRegistry,
        cache,
        log,
        _modelDownloadProgress => {},
      );

      assert.equal(downloadedModelFiles.length, 3);
    });
  });

  it("Download still works (albeit not persisted) when files to download exceeds available storage quota", async function() {
    const languagePair = "dummy";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    let latestModelDownloadProgressSeen: ModelDownloadProgress;
    const downloadedModelFiles = await getBergamotModelsForLanguagePair(
      languagePair,
      config.bergamotModelsBaseUrl,
      {
        dummy: {
          lex: {
            ...dummyModelRegistryEntry.lex,
            size: 1024 * 1024 * 1024 * 100, // 100gb
          },
          model: {
            ...dummyModelRegistryEntry.model,
            size: 1024 * 1024 * 1024 * 100, // 100gb
          },
          vocab: {
            ...dummyModelRegistryEntry.vocab,
            size: 1024 * 1024 * 1024 * 100, // 100gb
          },
        },
      },
      cache,
      log,
      modelDownloadProgress => {
        latestModelDownloadProgressSeen = modelDownloadProgress;
      },
    );
    assert.equal(downloadedModelFiles.length, 3);
    assert.equal(
      latestModelDownloadProgressSeen.bytesDownloaded,
      latestModelDownloadProgressSeen.bytesToDownload,
    );
    assert.isAtLeast(latestModelDownloadProgressSeen.bytesDownloaded, 1);
  });

  it("Failing download integrity checks", async function() {
    const languagePair = "dummy";

    const cache = await caches.open(
      `tests:bergamot-models:${testSuiteExecutionUuid}`,
    );
    expect(
      getBergamotModelsForLanguagePair(
        languagePair,
        config.bergamotModelsBaseUrl,
        {
          dummy: {
            lex: {
              ...dummyModelRegistryEntry.lex,
              expectedSha256Hash: "foo",
            },
            model: {
              ...dummyModelRegistryEntry.model,
              expectedSha256Hash: "foo",
            },
            vocab: {
              ...dummyModelRegistryEntry.vocab,
              expectedSha256Hash: "foo",
            },
          },
        },
        cache,
        log,
        _modelDownloadProgress => {},
      ),
    ).to.be.rejectedWith(Error);
  });

  it("A language pair that is missing on the remote server results in an error", async function() {
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
              size: 0,
              estimatedCompressedSize: 0,
              expectedSha256Hash: "foo",
            },
            model: {
              name: "foo",
              size: 0,
              estimatedCompressedSize: 0,
              expectedSha256Hash: "foo",
            },
            vocab: {
              name: "foo",
              size: 0,
              estimatedCompressedSize: 0,
              expectedSha256Hash: "foo",
            },
          },
        },
        cache,
        log,
        _modelDownloadProgress => {},
      ),
    ).to.be.rejectedWith(Error);
  });
});
