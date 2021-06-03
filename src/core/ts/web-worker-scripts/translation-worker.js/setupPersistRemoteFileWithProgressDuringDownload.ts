import { instrumentResponseWithProgressCallback } from "./instrumentResponseWithProgressCallback";
import { persistResponse } from "./persistResponse";
import { digestSha256 } from "./digestSha256";
import { throttle } from "./throttle";

export interface FileDownloadRequest {
  type: string;
  url: string;
  name: string;
  size: number;
  expectedSha256Hash: string;
}

export interface DownloadedFile {
  type: string;
  name: string;
  arrayBuffer: ArrayBuffer;
  downloaded: boolean;
  sha256Hash: string;
}

export class FileDownloadError extends Error {
  public name = "FileDownloadError";
}

export const setupPersistRemoteFileWithProgressDuringDownload = (
  contextName: string,
  persistFiles: boolean,
  cache: Cache,
  log: (str: string) => void,
  filesToTransferByType: { [type: string]: boolean },
  bytesTransferredByType: { [type: string]: number },
  broadcastDownloadProgressUpdate: () => void,
) => {
  const throttledBroadcastDownloadProgressUpdate = throttle(
    broadcastDownloadProgressUpdate,
    100,
  );

  return async ({
    type,
    url,
    name,
    expectedSha256Hash,
  }: FileDownloadRequest) => {
    let response = await cache.match(url);
    let downloaded = false;
    if (!response || response.status >= 400) {
      log(`Downloading file ${name} from ${url}`);
      downloaded = true;
      filesToTransferByType[type] = true;

      try {
        const downloadResponsePromise = fetch(url);

        // Await initial response headers before continuing
        const downloadResponseRaw = await downloadResponsePromise;

        // Hook up progress callbacks to track actual download of the files
        const onProgress = (bytesTransferred: number) => {
          // console.debug(`${name}: onProgress - ${mb(bytesTransferred)} mb out of ${mb(size)} mb transferred`);
          bytesTransferredByType[type] = bytesTransferred;
          throttledBroadcastDownloadProgressUpdate();
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
        const errorToThrow = new FileDownloadError($$err.message);
        errorToThrow.stack = $$err.stack;
        throw errorToThrow;
      }
    } else {
      log(`${name}: File from ${url} previously downloaded already`);
    }

    if (response.status >= 400) {
      throw new FileDownloadError("File download failed");
    }

    const arrayBuffer = await response.arrayBuffer();

    // Verify the hash of downloaded files
    const sha256Hash = await digestSha256(arrayBuffer);
    if (sha256Hash !== expectedSha256Hash) {
      console.warn(
        `File download integrity check failed for ${contextName}'s ${type} file`,
        {
          sha256Hash,
          expectedSha256Hash,
        },
      );
      throw new FileDownloadError(
        `File download integrity check failed for ${contextName}'s ${type} file`,
      );
    }

    return { type, name, arrayBuffer, downloaded, sha256Hash };
  };
};
