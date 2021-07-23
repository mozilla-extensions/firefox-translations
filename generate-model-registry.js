/* eslint-env node */
/* eslint-disable mozilla/balanced-listeners */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const sha256File = require("sha256-file");
const zlib = require("zlib");

const getType = name => {
  if (name.includes("model")) {
    return "model";
  }
  if (name.includes("vocab")) {
    return "vocab";
  }
  if (name.includes("lex")) {
    return "lex";
  }
  return "unknown";
};

async function gunzip(file) {
  const gunzippedFile = file.slice(0, -3);
  return new Promise((resolve, reject) => {
    const fileContents = fs.createReadStream(file);
    const writeStream = fs.createWriteStream(gunzippedFile);
    const unzip = zlib.createGunzip();
    fileContents
      .pipe(unzip)
      .pipe(writeStream)
      .on("finish", err => {
        if (err) return reject(err);
        return resolve(gunzippedFile);
      });
  });
}

async function generateModelRegistry() {
  const modelRegistry = {};

  await Promise.all(
    glob.sync("firefox-translations-models/models/*/*").map(async directory => {
      const languagePair = path.basename(directory);
      modelRegistry[languagePair] = {};
      return Promise.all(
        glob.sync(`${directory}/*.gz`).map(async filePath => {
          const gunzippedFilePath = await gunzip(filePath);
          const name = path.basename(gunzippedFilePath);
          const type = getType(name);
          const stat = fs.statSync(filePath);
          const estimatedCompressedSize = stat.size;
          const gunzippedStat = fs.statSync(gunzippedFilePath);
          const size = gunzippedStat.size;
          const expectedSha256Hash = sha256File(gunzippedFilePath);
          fs.unlinkSync(gunzippedFilePath);
          modelRegistry[languagePair][type] = {
            name,
            size,
            estimatedCompressedSize,
            expectedSha256Hash,
          };
        }),
      );
    }),
  );

  const modelRegistryFileContents = `export interface ModelRegistry {
  [languagePair: string]: {
    [type: string]: {
      name: string;
      size: number;
      estimatedCompressedSize: number;
      expectedSha256Hash: string;
    };
  };
}

export const modelRegistry: ModelRegistry = ${JSON.stringify(
    modelRegistry,
    null,
    2,
  )};
`;

  const targetPath = path.join("src", "core", "ts", "modelRegistry.ts");
  await fs.promises.writeFile(targetPath, modelRegistryFileContents);
}

module.exports = { generateModelRegistry };

if (require.main === module) {
  generateModelRegistry();
}
