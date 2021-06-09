/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ModelRegistry } from "../../modelRegistry";
import { ModelDownloadProgress } from "../../background-scripts/background.js/lib/BergamotTranslatorAPI";
import {
  DownloadedFile,
  RemoteFile,
  setupPersistRemoteFileWithProgressDuringDownload,
} from "./setupPersistRemoteFileWithProgressDuringDownload";
const mb = bytes => Math.round((bytes / 1024 / 1024) * 10) / 10;

export class LanguagePairUnsupportedError extends Error {
  public name = "LanguagePairUnsupportedError";
}

export const getBergamotModelsForLanguagePair = async (
  languagePair: string,
  bergamotModelsBaseUrl: string,
  modelRegistry: ModelRegistry,
  cache: Cache,
  log: (message: string) => void,
  onModelDownloadProgress: (
    modelDownloadProgress: ModelDownloadProgress,
  ) => void,
): Promise<DownloadedFile[]> => {
  if (!modelRegistry[languagePair]) {
    throw new LanguagePairUnsupportedError(
      `Language pair '${languagePair}' not supported`,
    );
  }

  const downloadStart = Date.now();

  const modelRegistryEntry = modelRegistry[languagePair];

  const modelFiles: RemoteFile[] = Object.keys(modelRegistryEntry).map(
    (type: string) => {
      const {
        name,
        size,
        estimatedCompressedSize,
        expectedSha256Hash,
      } = modelRegistryEntry[type];
      const url = `${bergamotModelsBaseUrl}/${languagePair}/${name}`;
      return {
        type,
        url,
        name,
        size,
        estimatedCompressedSize,
        expectedSha256Hash,
      };
    },
  );

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

  // Summarize periodical updates on total language pair download progress
  const bytesTransferredByType = {
    lex: 0,
    model: 0,
    vocab: 0,
  };
  const filesToTransferByType = {
    lex: false,
    model: false,
    vocab: false,
  };
  const sumLanguagePairFileToTransferSize = attribute => {
    return ["lex", "model", "vocab"]
      .map(type =>
        filesToTransferByType[type] ? modelRegistryEntry[type][attribute] : 0,
      )
      .reduce((a, b) => a + b, 0);
  };
  const broadcastDownloadProgressUpdate = () => {
    const languagePairBytesTransferred =
      bytesTransferredByType.lex +
      bytesTransferredByType.model +
      bytesTransferredByType.vocab;
    const languagePairBytesToTransfer = sumLanguagePairFileToTransferSize(
      "size",
    );
    const languagePairEstimatedCompressedBytesToTransfer = sumLanguagePairFileToTransferSize(
      "estimatedCompressedSize",
    );
    const percentTransferred =
      languagePairBytesToTransfer > 0
        ? languagePairBytesTransferred / languagePairBytesToTransfer
        : 1.0;
    const downloadDurationMs = Date.now() - downloadStart;
    const modelDownloadProgress: ModelDownloadProgress = {
      bytesDownloaded: Math.round(
        percentTransferred * languagePairEstimatedCompressedBytesToTransfer,
      ),
      bytesToDownload: languagePairEstimatedCompressedBytesToTransfer,
      startTs: downloadStart,
      durationMs: downloadDurationMs,
      endTs: undefined,
    };
    onModelDownloadProgress(modelDownloadProgress);
    /*
    console.debug(
      `${languagePair}: onDownloadProgressUpdate - ${Math.round(
        percentTransferred * 100,
      )}% out of ${mb(languagePairEstimatedCompressedBytesToTransfer)} mb (${mb(
        languagePairBytesToTransfer,
      )} mb uncompressed) transferred`,
    );
    */
  };

  // Download or restore model files from persistent cache
  const persistRemoteFileWithProgressDuringDownload = setupPersistRemoteFileWithProgressDuringDownload(
    languagePair,
    persistFiles,
    cache,
    log,
    filesToTransferByType,
    bytesTransferredByType,
    broadcastDownloadProgressUpdate,
  );
  const downloadedFiles: DownloadedFile[] = await Promise.all(
    modelFiles.map(persistRemoteFileWithProgressDuringDownload),
  );

  // Measure the time it took to acquire model files
  const downloadEnd = Date.now();
  const downloadDurationMs = downloadEnd - downloadStart;
  const totalBytes = downloadedFiles
    .map(({ arrayBuffer }) => arrayBuffer.byteLength)
    .reduce((a, b) => a + b, 0);
  const totalBytesDownloaded = downloadedFiles
    .filter(({ downloaded }) => downloaded)
    .map(({ arrayBuffer }) => arrayBuffer.byteLength)
    .reduce((a, b) => a + b, 0);
  // Either report the total time for downloading or the time it has taken to load cached model files
  if (totalBytesDownloaded > 0) {
    const languagePairEstimatedCompressedBytesToTransfer = sumLanguagePairFileToTransferSize(
      "estimatedCompressedSize",
    );
    const finalModelDownloadProgress: ModelDownloadProgress = {
      bytesDownloaded: languagePairEstimatedCompressedBytesToTransfer,
      bytesToDownload: languagePairEstimatedCompressedBytesToTransfer,
      startTs: downloadStart,
      durationMs: downloadDurationMs,
      endTs: downloadEnd,
    };
    onModelDownloadProgress(finalModelDownloadProgress);
  } else {
    const finalModelDownloadProgress: ModelDownloadProgress = {
      bytesDownloaded: 0,
      bytesToDownload: 0,
      startTs: downloadStart,
      durationMs: downloadDurationMs,
      endTs: downloadEnd,
    };
    onModelDownloadProgress(finalModelDownloadProgress);
  }
  log(
    `All model files for ${languagePair} downloaded / restored from persistent cache in ${downloadDurationMs /
      1000} seconds (total uncompressed size of model files: ${mb(
      totalBytes,
    )} mb, of which ${Math.round(
      (totalBytesDownloaded / totalBytes) * 100,
    )}% was downloaded)`,
  );

  return downloadedFiles;
};
