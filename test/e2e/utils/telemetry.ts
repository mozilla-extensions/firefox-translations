import { join } from "path";
import * as waitOn from "wait-on";
import * as fs from "fs";

export const maxToleratedTelemetryUploadingDurationInSeconds = 10;

const range = (start, end) => Array.from(Array(end + 1).keys()).slice(start);

export const readSeenTelemetry = async (
  startSequenceNo,
  endSequenceNo,
  proxyInstanceId: string,
  timeout: number,
) => {
  const telemetryStoragePath = join(
    process.cwd(),
    "test",
    "e2e",
    "results",
    "telemetry",
    proxyInstanceId,
  );
  const telemetryJsonFilePaths = range(
    startSequenceNo,
    endSequenceNo,
  ).map(sequenceNo => join(telemetryStoragePath, `${sequenceNo}.json`));
  await waitOn({
    resources: telemetryJsonFilePaths,
    timeout, // timeout in ms, default Infinity
  });
  const telemetryJsonTexts = await Promise.all(
    telemetryJsonFilePaths.map(telemetryJsonFilePath =>
      fs.promises.readFile(telemetryJsonFilePath, "utf8"),
    ),
  );
  return telemetryJsonTexts.map(telemetryJsonText =>
    JSON.parse(telemetryJsonText),
  );
};
