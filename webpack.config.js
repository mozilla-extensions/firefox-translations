/* global process, require, module, __dirname */

const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

const { targetEnvironment, buildPath, ui } = require("./build-config.js");

const dotEnvPath =
  targetEnvironment === "production"
    ? "./.env.production"
    : "./.env.development";

const copyPluginPatterns = [{ from: "src/core/static", to: buildPath }];

// Set entry points based on build variant
const entry = {
  background: `./src/${ui}/ts/background-scripts/background.js/index.ts`,
  "dom-translation-content-script":
    "./src/core/ts/content-scripts/dom-translation-content-script.js/index.ts",
  "translation-worker":
    "./src/core/ts/web-worker-scripts/translation-worker.js/index.ts",
};
if (ui === "cross-browser-ui") {
  entry["options-ui"] =
    "./src/cross-browser-ui/ts/extension-pages/options-ui.js/index.tsx";
  entry["get-started"] =
    "./src/cross-browser-ui/ts/extension-pages/get-started.js/index.tsx";
  entry["main-interface"] =
    "./src/cross-browser-ui/ts/extension-pages/main-interface.js/index.tsx";
  copyPluginPatterns.push({
    from: "src/cross-browser-ui/static",
    to: buildPath,
  });
} else {
  copyPluginPatterns.push({
    from: "src/firefox-infobar-ui/static",
    to: buildPath,
  });
}
if (targetEnvironment !== "production") {
  entry.tests = "./test/in-browser/ts/tests.js/index.ts";
  copyPluginPatterns.push({ from: "test/in-browser/static", to: buildPath });
}

// Make env vars available in the current scope
require("dotenv").config({ path: dotEnvPath });

// Workaround for https://github.com/getsentry/sentry-cli/issues/302
const fs = require("fs");
fs.createReadStream(dotEnvPath).pipe(fs.createWriteStream("./.env"));

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

plugins.push(
  new webpack.EnvironmentPlugin({
    TELEMETRY_APP_ID: telemetryAppId,
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
          "postcss-loader",
        ],
      },
      {
        test: /\.svg/,
        use: {
          loader: "svg-url-loader",
          options: {},
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|png|jpeg|jpg)$/,
        use: [{ loader: "file-loader" }],
      },
      {
        test: /\.js$/,
        exclude: /node_modules[/\\](?!react-data-grid[/\\]lib)/,
        use: "babel-loader",
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
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: "initial",
          minChunks: 2,
        },
      },
    },
  },
};
