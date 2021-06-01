/* eslint-env node */

process.env.UI = "firefox-infobar-ui";
process.env.TARGET_BROWSER = "firefox";

const coreConfig = require("../core/webpack.config");

module.exports = coreConfig;
