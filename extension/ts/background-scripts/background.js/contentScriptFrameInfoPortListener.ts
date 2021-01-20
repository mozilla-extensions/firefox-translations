import { FrameInfo } from "../../shared-resources/types/bergamot.types";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;

export const contentScriptFrameInfoPortListener = (port: Port) => {
  if (port.name !== "port-from-content-script-frame-info") {
    return;
  }
  port.onMessage.addListener(async function(
    m: { requestId: string },
    senderPort,
  ) {
    // console.debug("Message from port-from-content-script-frame-info:", {m});
    const { requestId } = m;
    const frameInfo: FrameInfo = {
      windowId: senderPort.sender.tab?.windowId,
      tabId: senderPort.sender.tab?.id,
      frameId: senderPort.sender.frameId,
    };
    try {
      port.postMessage({
        requestId,
        frameInfo,
      });
    } catch (err) {
      if (err.message === "Attempt to postMessage on disconnected port") {
        console.warn(
          "Attempt to postMessage on disconnected port, but it is ok",
          err,
        );
      } else {
        throw err;
      }
    }
  });
};
