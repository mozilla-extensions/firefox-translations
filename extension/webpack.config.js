/* global process, require, module, __dirname */

const path = require("path");

const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

const targetBrowser = process.env.TARGET_BROWSER || "firefox";
const destPath = path.join(__dirname, "build", targetBrowser);

const dotEnvPath =
  process.env.NODE_ENV === "production"
    ? "./.env.production"
    : "./.env.development";

// Make env vars available in the current scope
require("dotenv").config({ path: dotEnvPath });

// Workaround for https://github.com/getsentry/sentry-cli/issues/302
const fs = require("fs");
fs.createReadStream(dotEnvPath).pipe(fs.createWriteStream("./.env"));

const plugins = [
  // Make env vars available in the scope of webpack plugins/loaders
  new Dotenv({
    path: dotEnvPath,
  }),
  new CopyPlugin({
    patterns: [{ from: "src", to: destPath }],
  }),
];

// Only upload sources to Sentry if building a production build or testing the sentry plugin
if (
  process.env.SENTRY_AUTH_TOKEN !== "foo" &&
  (process.env.NODE_ENV === "production" ||
    process.env.TEST_SENTRY_WEBPACK_PLUGIN === "1")
) {
  plugins.push(
    new SentryWebpackPlugin({
      include: destPath,
    }),
  );
}

module.exports = {
  entry: {
    background: "./ts/background.js/index.ts",
    "get-started": "./ts/get-started.js/index.tsx",
    "main-interface": "./ts/main-interface.js/index.tsx",
    "options-ui": "./ts/options-ui.js/index.tsx",
  },
  output: {
    path: destPath,
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
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins,
  mode: "development",
  devtool: "source-map",
};
