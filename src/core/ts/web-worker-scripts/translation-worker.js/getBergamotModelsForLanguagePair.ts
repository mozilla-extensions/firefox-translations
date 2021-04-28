/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { digestSha256 } from "./digestSha256";
import { ModelRegistry } from "../../config";
import { instrumentResponseWithProgressCallback } from "./instrumentResponseWithProgressCallback";
import { persistResponse } from "./persistResponse";
const mb = bytes => Math.round((bytes / 1024 / 1024) * 10) / 10;

export const getBergamotModelsForLanguagePair = async (
  languagePair: string,
  bergamotModelsBaseUrl: string,
  modelRegistry: ModelRegistry,
  cache: Cache,
  log: (message: string) => void,
): Promise<{ name: string; data: Blob }[]> => {
  if (!modelRegistry[languagePair]) {
    throw new Error(`Language pair '${languagePair}' not supported`);
  }

  const modelFiles = Object.keys(modelRegistry[languagePair]).map(
    (type: string) => {
      const { name, size, expectedSha256Hash } = modelRegistry[languagePair][
        type
      ];
      const url = `${bergamotModelsBaseUrl}/${languagePair}/${name}`;
      return { type, url, name, size, expectedSha256Hash };
    },
  );

  const downloadStart = performance.now();

  // Check remaining storage quota
  const quota = await navigator.storage.estimate();
  const percentageUsed = (quota.usage / quota.quota) * 100;
  console.info(
    `${Math.round(percentageUsed * 100) /
      100}% used of the available storage (${mb(quota.quota)} mb).`,
  );
  const approximateRemainingQuota = quota.quota - quota.usage;
  console.info(`Remaining storage quota: ${mb(approximateRemainingQuota)} mb.`);

  // Don't attempt to persist model files if remaining quota suggest that it won't work
  let persistFiles = true;
  const modelFilesSize = modelFiles
    .map(({ size }) => size)
    .reduce((a, b) => a + b, 0);
  if (modelFilesSize > approximateRemainingQuota) {
    persistFiles = false;
    log(
      `${languagePair}: Will not attempt to persist the model files (${mb(
        modelFilesSize,
      )} mb) since approximate remaining quota (${mb(
        approximateRemainingQuota,
      )} mb) is too small`,
    );
  }

  const blobs = await Promise.all(
    modelFiles.map(async ({ type, url, name, size, expectedSha256Hash }) => {
      let response = await cache.match(url);
      let downloaded = false;
      if (!response || response.status >= 400) {
        log(`Downloading model file ${name} from ${url}`);
        downloaded = true;

        try {
          const downloadResponsePromise = fetch(url);

          // Await initial response headers before continuing
          const downloadResponseRaw = await downloadResponsePromise;

          // Hook up progress callbacks to track actual download of the model files
          const onProgress = (_bytesTransferred: number) => {
            // console.debug("onProgress", {bytesTransferred})
          };
          response = instrumentResponseWithProgressCallback(
            downloadResponseRaw,
            onProgress,
          );

          log(`Response for ${url} from network is: ${response.status}`);

          if (persistFiles) {
            // This avoids caching responses that we know are errors (i.e. HTTP status code of 4xx or 5xx).
            if (response.status < 400) {
              await persistResponse(cache, url, response, log);
            } else {
              log(
                `${name}: Not caching the response to ${url} since the status was >= 400`,
              );
            }
          }
        } catch ($$err) {
          console.warn(
            `${name}: An error occurred while downloading/persisting the file`,
            { $$err },
          );
          throw $$err;
        }
      } else {
        log(`${name}: Model file from ${url} previously downloaded already`);
      }

      if (response.status >= 400) {
        throw new Error("Model file download failed");
      }

      const blob = await response.blob();

      // Verify the hash of downloaded model files
      const sha256Hash = await digestSha256(await blob.arrayBuffer());
      if (sha256Hash !== expectedSha256Hash) {
        console.warn(
          `Model file download integrity check failed for ${languagePair}'s ${type} file`,
          {
            sha256Hash,
            expectedSha256Hash,
          },
        );
        throw new Error(
          `Model file download integrity check failed for ${languagePair}'s ${type} file`,
        );
      }

      return { name, data: blob, downloaded, sha256Hash };
    }),
  );

  // Measure the time it takes to acquire model files
  const downloadEnd = performance.now();
  const downloadDuration = downloadEnd - downloadStart;
  const totalBytes = blobs
    .map(({ data }) => data.size)
    .reduce((a, b) => a + b, 0);
  const totalBytesDownloaded = blobs
    .filter(({ downloaded }) => downloaded)
    .map(({ data }) => data.size)
    .reduce((a, b) => a + b, 0);
  log(
    `All model files for ${languagePair} downloaded / restored from persistent cache in ${downloadDuration /
      1000} seconds (total uncompressed size of model files: ${mb(
      totalBytes,
    )} mb, of which ${mb(totalBytesDownloaded)} mb was downloaded)`,
  );

  return blobs;
};
