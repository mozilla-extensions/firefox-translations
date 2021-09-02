const developmentBuild = process.env.NODE_ENV !== "production";
export const config = {
  bergamotRestApiUrl: process.env.BERGAMOT_REST_API_INBOUND_URL,
  useBergamotRestApi: process.env.USE_BERGAMOT_REST_API === "1",
  sentryDsn: process.env.SENTRY_DSN,
  bergamotModelsBaseUrl: developmentBuild
    ? "http://0.0.0.0:4000/models"
    : "https://storage.googleapis.com/bergamot-models-sandbox/0.2.9",
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
    ["de", "en"],
    // ["fr","en"],
    ["es", "en"],
    // ["pl","en"],
    ["cs", "en"],
    ["et", "en"],
    ["en", "de"],
    // ["en","fr"],
    ["en", "es"],
    // ["en","pl"],
    ["en", "cs"],
    ["en", "et"],
    ["ru", "en"],
    ["en", "ru"],
    ["pt", "en"],
    ["en", "pt"],
    ["it", "en"],
  ],
  privacyNoticeUrl: "https://example.com/privacy-notice",
  feedbackSurveyUrl:
    "https://qsurvey.mozilla.com/s3/bergamot-translate-product-feedback",
};
