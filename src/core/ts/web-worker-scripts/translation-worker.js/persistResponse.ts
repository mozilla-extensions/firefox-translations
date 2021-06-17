export const persistResponse = async (
  cache: Cache,
  url: string,
  response: Response,
  log,
) => {
  // Both fetch() and cache.put() "consume" the request, so we need to make a copy.
  // (see https://developer.mozilla.org/en-US/docs/Web/API/Request/clone)
  try {
    // Store fetched contents in cache
    await cache.put(url, response.clone());
  } catch (err) {
    console.warn("Error occurred during cache.put()", { err });
    // Note that this error is currently not thrown at all due to https://github.com/jimmywarting/cache-polyfill/issues/4
    if (err && err.name === "QuotaExceededError") {
      // Don't bail just because we can't persist the model file across browser restarts
      console.warn(err);
      log(`${name}: Ran into and ignored a QuotaExceededError`);
    } else {
      throw err;
    }
  }
};
