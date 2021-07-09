/* eslint-env node */

const $context = require.context("../../../../src", true, /.spec.ts$/);
$context.keys().forEach(context);
module.exports = $context;
