/* eslint-env node */

const options = {
  parser: "postcss-scss",
  plugins: [
    require("tailwindcss")("./tailwind.config.js"),
    require("postcss-nested"),
    require("postcss-preset-env"),
  ],
};

if (process.env.NODE_ENV === "development") {
  options.map = { inline: true };
} else {
  options.plugins.push(
    require("@fullhuman/postcss-purgecss")({
      content: ["./ts/**/*.tsx"],
      defaultExtractor: content => content.match(/[\w-/:.]+(?<!:)/g) || [],
    }),
  );
  options.plugins.push(
    require("cssnano")({
      preset: "default",
    }),
  );
}

module.exports = options;
