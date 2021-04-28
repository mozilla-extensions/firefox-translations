/**
 * Execute a callback immediately and then at most once each {ms} ms
 * Derived from https://stackoverflow.com/a/27078401/682317
 */
export const throttle = (callback: () => void, ms: number) => {
  let waiting = false;
  return function() {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(function() {
        waiting = false;
      }, ms);
    }
  };
};
