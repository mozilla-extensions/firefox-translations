export const instrumentResponseWithProgressCallback = (
  response: Response,
  onProgress: (bytesTransferred: number) => void,
) => {
  const { body, headers, status } = response;
  // Only attempt to track download progress on valid responses
  if (status >= 400) {
    return response;
  }
  const reader = body.getReader();
  let bytesTransferred = 0;
  const stream = new ReadableStream({
    start(controller) {
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          if (value) {
            onProgress(bytesTransferred);
            bytesTransferred += value.length;
          }
          controller.enqueue(value);
          push();
        });
      }
      push();
    },
  });
  return new Response(stream, { headers, status });
};
