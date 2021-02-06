/* eslint-env node */

if (!process.env.TARGET_BROWSER) {
  throw new Error("Missing TARGET_BROWSER env var");
}
if (!process.env.UI) {
  throw new Error("Missing UI env var");
}
const targetBrowser = process.env.TARGET_BROWSER;
const ui = process.env.UI;
module.exports = {
  targetBrowser,
  ui,
};
