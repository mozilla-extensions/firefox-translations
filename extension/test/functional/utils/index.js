/* eslint-env node */

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");

// Re-usable test methods across tests
const { setupWebdriver } = require("./setupWebdriver");
const { ui } = require("./ui");

// What we expose to our add-on-specific tests
module.exports = {
  setupWebdriver,
  ui,
};
