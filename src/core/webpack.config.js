/* eslint-env node */

const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const { GitRevisionPlugin } = require("git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin({
  lightweightTags: true,
  branch: true,
});
const fs = require("fs");

const {
  targetEnvironment,
  buildPath,
  ui,
  extensionBuildEnvironment,
} = require("../../build-config.js");

const dotEnvPath =
  targetEnvironment === "production"
    ? "../../.env.production"
    : "../../.env.development";

const copyPluginPatterns = [];

// Set entry points based on build variant
const entry = {
  background: `../${ui}/ts/background-scripts/background.js/index.ts`,
  "dom-translation-content-script":
    "../core/ts/content-scripts/dom-translation-content-script.js/index.ts",
  "translation-worker":
    "../core/ts/web-worker-scripts/translation-worker.js/index.ts",
};
if (ui === "cross-browser-ui") {
  entry["options-ui"] =
    "../cross-browser-ui/ts/extension-pages/options-ui.js/index.tsx";
  entry["get-started"] =
    "../cross-browser-ui/ts/extension-pages/get-started.js/index.tsx";
  entry["main-interface"] =
    "../cross-browser-ui/ts/extension-pages/main-interface.js/index.tsx";
  copyPluginPatterns.push({
    from: "../cross-browser-ui/static",
    to: buildPath,
  });
} else {
  copyPluginPatterns.push({
    from: "../firefox-infobar-ui/static",
    to: buildPath,
  });
}
if (targetEnvironment !== "production") {
  entry.tests = "../../test/in-browser/ts/tests.js/index.ts";
  copyPluginPatterns.push({
    from: "../../test/in-browser/static",
    to: buildPath,
  });
}

// Make env vars available in the current scope
fs.createReadStream("../../.env.example").pipe(
  fs.createWriteStream("./.env.example"),
);
require("dotenv").config({ path: dotEnvPath });

// Workaround for https://github.com/getsentry/sentry-cli/issues/302
fs.createReadStream(dotEnvPath).pipe(fs.createWriteStream("../../.env"));

const plugins = [
  // Make .env vars available in the scope of webpack plugins/loaders and the build itself
  new Dotenv({
    path: dotEnvPath,
    safe: true,
  }),
  // Copy non-webpack-monitored files under "static" directories to the build directory
  new CopyPlugin({
    patterns: copyPluginPatterns,
  }),
  // Allows us to compile an extension build id that includes information about the build configuration
  gitRevisionPlugin,
];

//
if (targetEnvironment === "production") {
  // Generate a stats file associated with each build
  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
      statsFilename: `../${ui}.stats.json`,
    }),
  );
} else {
  // Make the remote dev server port environment variable available
  plugins.push(new webpack.EnvironmentPlugin(["REMOTE_DEV_SERVER_PORT"]));
}

// telemetry configuration
let telemetryAppId = "org-mozilla-bergamot-test";

// use test one for cross-browser until we figure out which IDs are more suitable
// and get data collection review approval for these channels of distribution
if (targetEnvironment === "production" && ui === "firefox-infobar-ui") {
  telemetryAppId = "org-mozilla-bergamot";
}

// Make some constants available to the application
plugins.push(
  new webpack.EnvironmentPlugin({
    TELEMETRY_APP_ID: telemetryAppId,
    VERSION: gitRevisionPlugin.version(),
    COMMITHASH: gitRevisionPlugin.commithash(),
    BRANCH: gitRevisionPlugin.branch(),
    LASTCOMMITDATETIME: gitRevisionPlugin.lastcommitdatetime(),
    TARGET_BROWSER: process.env.TARGET_BROWSER,
    UI: process.env.UI,
    extensionBuildEnvironment,
  }),
);

// Only upload sources to Sentry if building a production build or testing the sentry plugin
if (
  process.env.SENTRY_AUTH_TOKEN !== "foo" &&
  (targetEnvironment === "production" ||
    process.env.TEST_SENTRY_WEBPACK_PLUGIN === "1")
) {
  plugins.push(
    new SentryWebpackPlugin({
      include: buildPath,
    }),
  );
}

module.exports = {
  entry,
  output: {
    path: buildPath,
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
    pathinfo: true,
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
        exclude: [
          // the diff2html module emits errors in form of "Cannot find source file ... .ts"
          // but works in general, just source maps needs disabling:
          /node_modules\/diff2html/,
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins,
  mode: "development",
  devtool: "source-map",
  optimization: {
    minimize: ui !== "firefox-infobar-ui",
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks(chunk) {
            // exclude 'translation-worker' from split chunks since chunks
            // are not loaded in web workers (https://github.com/webpack/webpack/issues/7879)
            if (chunk.name === "translation-worker") {
              return false;
            }
            // simulate the "initial" configuration value as per
            // https://github.com/webpack/webpack/blob/4837c3ddb9da8e676c73d97460e19689dd9d4691/lib/optimize/SplitChunksPlugin.js#L248
            return chunk.canBeInitial();
          },
          minChunks: 2,
        },
      },
    },
  },
};
