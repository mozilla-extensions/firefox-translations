/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
      if (!response) {
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

              // Await onComplete callback from the response progress tracker so that we get bytes transferred
              const bytesTransferred = await allBytesTransferredPromise;
              console.log(
                `${name} total bytes transferred: ${bytesTransferred}`,
              );
              totalBytesTransferred += bytesTransferred;

              // Populate the response from the cache
              response = await cache.match(url);
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
          } else {
            log(`${name}: Not caching the response to ${url}`);
            response = downloadResponse;
          }
        } catch ($$err) {
          console.warn({ $$err });
        }
      } else {
        log(`${name}: Model file from ${url} previously downloaded already`);
      }

      const blob = await response.blob();
      return { name, data: blob };
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
