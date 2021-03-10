/* eslint-env node */

// @ts-ignore
const context = require.context("../../../../src", true, /.spec.ts$/);
// @ts-ignore
context.keys().forEach(context);
module.exports = context;
