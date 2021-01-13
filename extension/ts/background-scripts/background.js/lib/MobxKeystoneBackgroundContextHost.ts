import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import {
  applySerializedActionAndTrackNewModelIds,
  getSnapshot,
  ModelAutoTypeCheckingMode,
  SerializedActionCall,
  SerializedActionCallWithModelIdOverrides,
  setGlobalConfig,
} from "mobx-keystone";
import { captureExceptionWithExtras } from "../../../shared-resources/ErrorReporting";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";
import { DocumentTranslationState } from "../../../shared-resources/models/DocumentTranslationState";
import { TranslateOwnTextTranslationState } from "../../../shared-resources/models/TranslateOwnTextTranslationState";

// If we don't import and use all relevant models here, we can't reference models in this build
// Ref: https://github.com/xaviergonz/mobx-keystone/issues/183
DocumentTranslationState;
TranslateOwnTextTranslationState;

// disable runtime data checking (we rely on TypeScript at compile time so that our model definitions can be cleaner)
setGlobalConfig({
  modelAutoTypeChecking: ModelAutoTypeCheckingMode.AlwaysOff,
});

export class MobxKeystoneBackgroundContextHost {
  private mobxKeystoneProxyPortListener: (port: Port) => void;
  private connectedPorts: Port[] = [];
  init(backgroundContextRootStore: ExtensionState) {
    // Set up a connection / listener for the mobx-keystone-proxy
    this.mobxKeystoneProxyPortListener = port => {
      if (port.name !== "port-from-mobx-keystone-proxy") {
        return;
      }
      this.connectedPorts.push(port);
      port.onMessage.addListener(
        async (m: {
          requestInitialState: boolean;
          actionCall: SerializedActionCall;
          requestId: string;
        }) => {
          // console.debug("Message from mobx-keystone-proxy:", { m });
          const { requestInitialState, actionCall, requestId } = m;
          if (requestInitialState) {
            const initialState = getSnapshot(backgroundContextRootStore);
            // console.debug({ initialState });
            port.postMessage({
              initialState,
              requestId,
            });
            return null;
          }
          if (actionCall) {
            // apply the action over the server root store
            // sometimes applying actions might fail (for example on invalid operations
            // such as when one client asks to delete a model from an array and other asks to mutate it)
            // so we try / catch it
            let serializedActionCallToReplicate:
              | SerializedActionCallWithModelIdOverrides
              | undefined;
            try {
              // apply the action on the background context side and keep track of new model IDs being
              // generated, so the clients will have the chance to keep those in sync
              const applyActionResult = applySerializedActionAndTrackNewModelIds(
                backgroundContextRootStore,
                actionCall,
              );

              serializedActionCallToReplicate =
                applyActionResult.serializedActionCall;
            } catch (err) {
              console.error("error applying action to server:", err);
            }
            if (serializedActionCallToReplicate) {
              // and distribute message, which includes new model IDs to keep them in sync
              this.connectedPorts.forEach($port => {
                try {
                  $port.postMessage({
                    serializedActionCallToReplicate,
                    requestId,
                  });
                } catch (err) {
                  if (
                    err.message ===
                    "Attempt to postMessage on disconnected port"
                  ) {
                    console.warn(
                      "Attempt to postMessage on disconnected port, but it is ok",
                      err,
                    );
                  } else {
                    throw err;
                  }
                }
              });
            }

            return null;
          }
          captureExceptionWithExtras(new Error("Unexpected message"), { m });
          console.error("Unexpected message", { m });
        },
      );
      port.onDisconnect.addListener((port: Port) => {
        const existingPortIndex = this.connectedPorts.findIndex(
          p => p === port,
        );
        this.connectedPorts.splice(existingPortIndex, 1);
      });
    };
    browser.runtime.onConnect.addListener(this.mobxKeystoneProxyPortListener);
  }
}
