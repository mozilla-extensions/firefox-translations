/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { digestSha256 } from "./digestSha256";
import { ModelRegistry } from "../../config";

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
      const { name, expectedSha256Hash } = modelRegistry[languagePair][type];
      const url = `${bergamotModelsBaseUrl}/${languagePair}/${name}`;
      return { type, url, name, expectedSha256Hash };
    },
  );

  const downloadStart = performance.now();
  let totalBytesTransferred = 0;

  const blobs = await Promise.all(
    modelFiles.map(async ({ type, url, name, expectedSha256Hash }) => {
      let response = await cache.match(url);
      if (!response || response.status >= 400) {
        log(`Downloading model file ${name} from ${url}`);

        try {
          const downloadResponsePromise = fetch(url);

          // Await initial response headers before continuing
          const downloadResponse = await downloadResponsePromise;

          // Hook up progress callbacks to track actual download of the model files
          const onProgress = (_bytesTransferred: number) => {
            // console.debug("onProgress", {bytesTransferred})
          };
          const allBytesTransferredPromise: Promise<number> = new Promise(
            resolve => {
              downloadResponsePromise.then(function($response) {
                const { body, headers, status } = $response;
                // Only attempt to track download progress on valid responses
                if (status >= 400) {
                  return $response;
                }
                const reader = body.getReader();
                let bytesTransferred = 0;
                const stream = new ReadableStream({
                  start(controller) {
                    function push() {
                      reader.read().then(({ done, value }) => {
                        if (done) {
                          resolve(bytesTransferred);
                          controller.close();
                          return;
                        }
                        if (value) {
                          onProgress(bytesTransferred);
                          bytesTransferred += value.length;
                        }
                        controller.enqueue(value);
                        push();
                      });
                    }
                    push();
                  },
                });
                return new Response(stream, { headers, status });
              });
            },
          );

          log(
            `Response for ${url} from network is: ${downloadResponse.status}`,
          );

          // This avoids caching responses that we know are errors (i.e. HTTP status code of 4xx or 5xx).
          if (downloadResponse.status < 400) {
            // Both fetch() and cache.put() "consume" the request, so we need to make a copy.
            // (see https://developer.mozilla.org/en-US/docs/Web/API/Request/clone)
            try {
              // Store fetched contents in cache
              await cache.put(url, downloadResponse.clone());
            } catch (err) {
              console.warn({ err });
              if (err && err.name === "QuotaExceededError") {
                // Don't bail just because we can't persist the model file across browser restarts
                console.warn(err);
                log(`${name}: Ran into and ignored a QuotaExceededError`);
                response = downloadResponse;
              } else {
                throw err;
              }
            }

            // Await onComplete callback from the response progress tracker so that we get bytes transferred
            const bytesTransferred = await allBytesTransferredPromise;
            console.log(`${name} total bytes transferred: ${bytesTransferred}`);
            totalBytesTransferred += bytesTransferred;

            // Populate the response from the cache
            response = await cache.match(url);
          } else {
            log(`${name}: Not caching the response to ${url}`);
            response = downloadResponse;
          }
        } catch ($$err) {
          console.warn({ $$err });
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

      return { name, data: blob, sha256Hash };
    }),
  );

  // Measure the time it takes to download model files
  const downloadEnd = performance.now();
  const downloadDuration = downloadEnd - downloadStart;
  const totalBytes = blobs
    .map(({ name, data }) => data.size)
    .reduce((a, b) => a + b, 0);
  const mb = bytes => Math.round((bytes / 1024 / 1024) * 10) / 10;
  log(
    `All model files for ${languagePair} downloaded / restored from persistent cache in ${downloadDuration /
      1000} seconds (total size of model files: ${mb(
      totalBytes,
    )} medibytes, of which ${mb(
      totalBytesTransferred,
    )} medibytes was transferred over the network)`,
  );

  return blobs;
};
