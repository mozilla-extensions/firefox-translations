/* eslint-env node */

// @ts-ignore
const context = require.context("..", true, /.spec.ts$/);
// @ts-ignore
context.keys().forEach(context);
module.exports = context;
