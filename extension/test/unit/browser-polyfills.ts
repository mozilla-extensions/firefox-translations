const {
  AbortController: polyfillAbortController,
  abortableFetch,
} = require("abortcontroller-polyfill/dist/cjs-ponyfill");
const { fetch: polyfillFetch } = abortableFetch(require("node-fetch"));

// @ts-ignore
global.AbortController = polyfillAbortController;

// @ts-ignore
global.fetch = polyfillFetch;

// @ts-ignore
global.browser = {
  runtime: {
    getBrowserInfo: async () => {
      return {
        buildID: "1234567890",
        name: "Test",
        vendor: "Test",
        version: "1.2.3",
      };
    },
    // @ts-ignore
    getManifest: () => {
      return { version: "0.0.0" };
    },
  },
};
