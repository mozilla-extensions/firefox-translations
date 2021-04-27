const developmentBuild = process.env.NODE_ENV !== "production";
export const config = {
  bergamotRestApiUrl: process.env.BERGAMOT_REST_API_INBOUND_URL,
  useBergamotRestApi: process.env.USE_BERGAMOT_REST_API === "1",
  sentryDsn: process.env.SENTRY_DSN,
  bergamotModelsBaseUrl: developmentBuild
    ? "http://0.0.0.0:4000/models"
    : "http://0.0.0.0:4001/models",
  telemetryAppId: process.env.TELEMETRY_APP_ID,
  telemetryDebugMode: developmentBuild,
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
      expectedSha256Hash: string;
    };
  };
}

export const modelRegistry: ModelRegistry = {
  esen: {
    lex: {
      name: "lex.esen.s2t",
      size: 11651603,
      expectedSha256Hash:
        "7571baf6a7d49531b9aaecc998ebc5d84307ddce064a8c175b30de8c427f4854",
    },
    model: {
      name: "model.esen.intgemm.alphas.bin",
      size: 13215960,
      expectedSha256Hash:
        "4b6b7f451094aaa447d012658af158ffc708fc8842dde2f871a58404f5457fe0",
    },
    vocab: {
      name: "vocab.esen.spm",
      size: 414566,
      expectedSha256Hash:
        "909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845",
    },
  },
  eten: {
    lex: {
      name: "lex.eten.s2t",
      size: 18419387,
      expectedSha256Hash:
        "ad7c24f4d8e0064ec2d5cae220eedf8a39396c2f9c785c22b0a183c9087d814a",
    },
    model: {
      name: "model.eten.intgemm.alphas.bin",
      size: 12222624,
      expectedSha256Hash:
        "aac98a2371e216ee2d4843cbe896c617f6687501e17225ac83482eba52fd0028",
    },
    vocab: {
      name: "vocab.eten.spm",
      size: 416995,
      expectedSha256Hash:
        "e3b66bc141f6123cd40746e2fb9b8ee4f89cbf324ab27d6bbf3782e52f15fa2d",
    },
  },
  ende: {
    lex: {
      name: "lex.ende.s2t",
      size: 10746500,
      expectedSha256Hash:
        "0a4045f058d0427af0371a7861fa7856603dbae9513387f01ef2452da54d7cb4",
    },
    model: {
      name: "model.ende.intgemm.alphas.bin",
      size: 13207068,
      expectedSha256Hash:
        "f0946515c6645304f0706fa66a051c3b7b7c507f12d0c850f276c18165a10c14",
    },
    vocab: {
      name: "vocab.deen.spm",
      size: 412505,
      expectedSha256Hash:
        "bc8f8229933d8294c727f3eab12f6f064e7082b929f2d29494c8a1e619ba174c",
    },
  },
  enes: {
    lex: {
      name: "lex.enes.s2t",
      size: 11016547,
      expectedSha256Hash:
        "2f58dc562258d84b6b06d8814f8693d8bc6f73f62c7a026e9567a91ed197a33b",
    },
    model: {
      name: "model.enes.intgemm.alphas.bin",
      size: 12602853,
      expectedSha256Hash:
        "fa7460037a3163e03fe1d23602f964bff2331da6ee813637e092ddf37156ef53",
    },
    vocab: {
      name: "vocab.esen.spm",
      size: 414566,
      expectedSha256Hash:
        "909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845",
    },
  },
  enet: {
    lex: {
      name: "lex.enet.s2t",
      size: 11814371,
      expectedSha256Hash:
        "6751165b3a4a2d7412bd46b42bcb2fc32900f8d2b041465a8a86086559350f60",
    },
    model: {
      name: "model.enet.intgemm.alphas.bin",
      size: 12543318,
      expectedSha256Hash:
        "a28874a8b702a519a14dc71bcee726a5cb4b539eeaada2d06492f751469a1fd6",
    },
    vocab: {
      name: "vocab.eten.spm",
      size: 416995,
      expectedSha256Hash:
        "e3b66bc141f6123cd40746e2fb9b8ee4f89cbf324ab27d6bbf3782e52f15fa2d",
    },
  },
};
