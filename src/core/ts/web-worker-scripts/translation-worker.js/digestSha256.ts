/**
 * Derived from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
 */
export const digestSha256 = async (buffer: ArrayBuffer): Promise<string> => {
  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  // convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};
