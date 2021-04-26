/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import fetchProgress, { FetchProgressData } from "fetch-progress";

export const getBergamotModelsForLanguagePair = async (
  languagePair: string,
  bergamotModelsBaseUrl: string,
  cache: Cache,
  log: (message: string) => void,
): Promise<{ name: string; data: Blob }[]> => {
  const modelFiles = [
    {
      url: `${bergamotModelsBaseUrl}/${languagePair}/lex.${languagePair}.s2t`,
      name: `lex.${languagePair}.s2t`,
    },
    {
      url: `${bergamotModelsBaseUrl}/${languagePair}/model.${languagePair}.intgemm.alphas.bin`,
      name: `model.${languagePair}.intgemm.alphas.bin`,
    },
    {
      url: `${bergamotModelsBaseUrl}/${languagePair}/vocab.${languagePair}.spm`,
      name: `vocab.${languagePair}.spm`,
    },
  ];

  const downloadStart = performance.now();
  let totalBytesTransferred = 0;

  const blobs = await Promise.all(
    modelFiles.map(async ({ url, name }) => {
      let response = await cache.match(url);
      let latestProgress;
      if (!response) {
        log(`Downloading model file ${name} from ${url}`);
        const responsePromise = fetch(url).then(
          fetchProgress({
            onProgress(progress: FetchProgressData) {
              latestProgress = progress;
            },
          }),
        );
        const downloadResponse = await responsePromise;

        log(`Response for ${url} from network is: ${downloadResponse.status}`);

        // This avoids caching responses that we know are errors (i.e. HTTP status code of 4xx or 5xx).
        if (downloadResponse.status < 400) {
          // We call .clone() on the request since we might use it in a call to cache.put() later on.
          // Both fetch() and cache.put() "consume" the request, so we need to make a copy.
          // (see https://developer.mozilla.org/en-US/docs/Web/API/Request/clone)
          try {
            await cache.put(url, downloadResponse.clone());
            response = await cache.match(url);
          } catch (err) {
            if (err.name === "QuotaExceededError") {
              // Don't bail just because we can't persist the model file across browser restarts
              console.warn(err);
              log(`${name}: Ran into and ignored a QuotaExceededError`);
              response = downloadResponse;
            } else {
              throw err;
            }
          }
        } else {
          log(`${name}: Not caching the response to ${url}`);
          response = downloadResponse;
        }
      } else {
        log(`${name}: Model file from ${url} previously downloaded already`);
      }
      if (latestProgress?.transferred) {
        console.log(
          `${name} total bytes transferred: ${latestProgress.transferred}`,
        );
        totalBytesTransferred += latestProgress.transferred;
      }

      const blob = await response.blob();
      return { name, data: blob };
    }),
  );

  // Measure the time it takes to download model files
  const downloadEnd = performance.now();
  const downloadDuration = downloadEnd - downloadStart;
  log(
    `All model files for ${languagePair} downloaded / restored from persistent cache in ${downloadDuration /
      1000} seconds (${Math.round((totalBytesTransferred / 1024 / 1024) * 10) /
      10} medibytes transferred over the network)`,
  );

  return blobs;
};
