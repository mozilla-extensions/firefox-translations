const developmentBuild = process.env.NODE_ENV !== "production";
export const config = {
  bergamotRestApiUrl: process.env.BERGAMOT_REST_API_INBOUND_URL,
  useBergamotRestApi: process.env.USE_BERGAMOT_REST_API === "1",
  sentryDsn: process.env.SENTRY_DSN,
  bergamotModelsBaseUrl: developmentBuild
    ? "http://0.0.0.0:4000/models"
    : "https://storage.googleapis.com/bergamot-models-sandbox/0.2.0",
  wasmBinariesBaseUrl: developmentBuild
    ? "http://0.0.0.0:4000/wasm"
    : "https://storage.googleapis.com/bergamot-models-sandbox/wasm/1",
  telemetryAppId: process.env.TELEMETRY_APP_ID,
  telemetryDebugMode: developmentBuild,
  extensionBuildId: `${process.env.VERSION}-${process.env.extensionBuildEnvironment}#${process.env.BRANCH}`,
  supportedLanguagePairs: [
    // "German, French, Spanish, Polish, Czech, and Estonian in and out of English"
    // ISO 639-1 codes
    // Language pairs that are not available are commented out
    // ["de","en"],
    // ["fr","en"],
    ["es", "en"],
    // ["pl","en"],
    // ["cs", "en"],
    ["et", "en"],
    ["en", "de"],
    // ["en","fr"],
    ["en", "es"],
    // ["en","pl"],
    // ["en", "cs"],
    ["en", "et"],
  ],
  privacyNoticeUrl: "https://example.com/privacy-notice",
  feedbackSurveyUrl:
    "https://qsurvey.mozilla.com/s3/bergamot-translate-product-feedback",
};

export interface ModelRegistry {
  [languagePair: string]: {
    [type: string]: {
      name: string;
      size: number;
      estimatedCompressedSize: number;
      expectedSha256Hash: string;
    };
  };
}

export const modelRegistry: ModelRegistry = {
  esen: {
    lex: {
      name: "lex.50.50.esen.s2t.bin",
      size: 3860888,
      estimatedCompressedSize: 1978538,
      expectedSha256Hash:
        "f11a2c23ef85ab1fee1c412b908d69bc20d66fd59faa8f7da5a5f0347eddf969",
    },
    model: {
      name: "model.esen.intgemm.alphas.bin",
      size: 17140755,
      estimatedCompressedSize: 13215960,
      expectedSha256Hash:
        "4b6b7f451094aaa447d012658af158ffc708fc8842dde2f871a58404f5457fe0",
    },
    vocab: {
      name: "vocab.esen.spm",
      size: 825463,
      estimatedCompressedSize: 414566,
      expectedSha256Hash:
        "909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845",
    },
  },
  eten: {
    lex: {
      name: "lex.50.50.eten.s2t.bin",
      size: 3974944,
      estimatedCompressedSize: 1920655,
      expectedSha256Hash:
        "6992bedc590e60e610a28129c80746fe5f33144a4520e2c5508d87db14ca54f8",
    },
    model: {
      name: "model.eten.intgemm.alphas.bin",
      size: 17140754,
      estimatedCompressedSize: 12222624,
      expectedSha256Hash:
        "aac98a2371e216ee2d4843cbe896c617f6687501e17225ac83482eba52fd0028",
    },
    vocab: {
      name: "vocab.eten.spm",
      size: 828426,
      estimatedCompressedSize: 416995,
      expectedSha256Hash:
        "e3b66bc141f6123cd40746e2fb9b8ee4f89cbf324ab27d6bbf3782e52f15fa2d",
    },
  },
  ende: {
    lex: {
      name: "lex.50.50.ende.s2t.bin",
      size: 3062492,
      estimatedCompressedSize: 1575385,
      expectedSha256Hash:
        "764797d075f0642c0b079cce6547348d65fe4e92ac69fa6a8605cd8b53dacb3f",
    },
    model: {
      name: "model.ende.intgemm.alphas.bin",
      size: 17140498,
      estimatedCompressedSize: 13207068,
      expectedSha256Hash:
        "f0946515c6645304f0706fa66a051c3b7b7c507f12d0c850f276c18165a10c14",
    },
    vocab: {
      name: "vocab.deen.spm",
      size: 797501,
      estimatedCompressedSize: 412505,
      expectedSha256Hash:
        "bc8f8229933d8294c727f3eab12f6f064e7082b929f2d29494c8a1e619ba174c",
    },
  },
  enes: {
    lex: {
      name: "lex.50.50.enes.s2t.bin",
      size: 3347104,
      estimatedCompressedSize: 1720700,
      expectedSha256Hash:
        "3a113d713dec3cf1d12bba5b138ae616e28bba4bbc7fe7fd39ba145e26b86d7f",
    },
    model: {
      name: "model.enes.intgemm.alphas.bin",
      size: 17140755,
      estimatedCompressedSize: 12602853,
      expectedSha256Hash:
        "fa7460037a3163e03fe1d23602f964bff2331da6ee813637e092ddf37156ef53",
    },
    vocab: {
      name: "vocab.esen.spm",
      size: 825463,
      estimatedCompressedSize: 414566,
      expectedSha256Hash:
        "909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845",
    },
  },
  enet: {
    lex: {
      name: "lex.50.50.enet.s2t.bin",
      size: 2700780,
      estimatedCompressedSize: 1336443,
      expectedSha256Hash:
        "3d1b40ff43ebef82cf98d416a88a1ea19eb325a85785eef102f59878a63a829d",
    },
    model: {
      name: "model.enet.intgemm.alphas.bin",
      size: 17140754,
      estimatedCompressedSize: 12543318,
      expectedSha256Hash:
        "a28874a8b702a519a14dc71bcee726a5cb4b539eeaada2d06492f751469a1fd6",
    },
    vocab: {
      name: "vocab.eten.spm",
      size: 828426,
      estimatedCompressedSize: 416995,
      expectedSha256Hash:
        "e3b66bc141f6123cd40746e2fb9b8ee4f89cbf324ab27d6bbf3782e52f15fa2d",
    },
  },
};
