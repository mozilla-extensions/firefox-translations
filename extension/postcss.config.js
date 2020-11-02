/* eslint-env node */

const options = {
  parser: "postcss-scss",
  plugins: [
    require("tailwindcss")("./tailwind.config.js"),
    require("postcss-nested"),
    require("postcss-preset-env"),
  ],
};

module.exports = options;
