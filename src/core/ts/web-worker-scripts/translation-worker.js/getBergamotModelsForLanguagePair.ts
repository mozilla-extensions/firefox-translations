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

  const blobs = await Promise.all(
    modelFiles.map(async ({ url, name }) => {
      let response = await cache.match(url);
      if (!response) {
        log(`Downloading model file from ${url}`);
        try {
          await cache.add(url);
        } catch (err) {
          if (err.name === "QuotaExceededError") {
            // Don't bail just because we can't persist the model file across browser restarts
            console.warn(err);
            log("Ran into and ignored a QuotaExceededError");
          } else {
            throw err;
          }
        }
        response = await cache.match(url);
      } else {
        log(`Model file from ${url} previously downloaded already`);
      }
      const blob = await response.blob();
      return { name, data: blob };
    }),
  );

  return blobs;
};
