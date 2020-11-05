// The maximum amount of net data allowed per request on Bergamot's API.
const MAX_REQUEST_DATA = 5000; // XXX This is the Bing value

// The maximum number of chunks allowed to be translated in a single
// request.
const MAX_REQUEST_CHUNKS = 128; // TODO: Determine the real value for this

// Self-imposed limit of 1920 requests. This means that a page that would need
// to be broken in more than 1920 requests won't be fully translated.
// The maximum amount of data that we will translate for a single page
// is MAX_REQUESTS * MAX_REQUEST_DATA.
const MAX_REQUESTS = 15;
