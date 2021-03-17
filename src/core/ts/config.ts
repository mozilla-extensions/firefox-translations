export const config = {
  bergamotRestApiUrl: process.env.BERGAMOT_REST_API_INBOUND_URL,
  useBergamotRestApi: process.env.USE_BERGAMOT_REST_API === "1",
  sentryDsn: process.env.SENTRY_DSN,
  telemetryAppId: process.env.TELEMETRY_APP_ID,
  telemetryDebugMode: process.env.NODE_ENV !== "production",
  supportedLanguagePairs: [
    // "German, French, Spanish, Polish, Czech, and Estonian in and out of English"
    // ISO 639-1 codes
    // Language pairs that are not available are commented out
    ["en", "de"],
    // ["en","fr"],
    ["en", "es"],
    // ["en","pl"],
    // ["en", "cs"],
    ["en", "et"],
    // ["de","en"],
    // ["fr","en"],
    ["es", "en"],
    // ["pl","en"],
    // ["cs", "en"],
    ["et", "en"],
  ],
  privacyNoticeUrl: "https://example.com/privacy-notice",
  feedbackSurveyUrl:
    "https://qsurvey.mozilla.com/s3/bergamot-translate-product-feedback",
};
