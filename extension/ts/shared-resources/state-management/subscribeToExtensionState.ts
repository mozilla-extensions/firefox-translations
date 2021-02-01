import {
  ActionTrackingResult,
  applySerializedActionAndSyncNewModelIds,
  fromSnapshot,
  ModelAutoTypeCheckingMode,
  onActionMiddleware,
  registerRootStore,
  serializeActionCall,
  SerializedActionCall,
  SerializedActionCallWithModelIdOverrides,
  setGlobalConfig,
} from "mobx-keystone";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { captureExceptionWithExtras } from "../ErrorReporting";
import { nanoid } from "nanoid";
import { ExtensionState } from "../models/ExtensionState";

// disable runtime data checking (we rely on TypeScript at compile time so that our model definitions can be cleaner)
setGlobalConfig({
  modelAutoTypeChecking: ModelAutoTypeCheckingMode.AlwaysOff,
});

type MsgListener = (
  actionCall: SerializedActionCallWithModelIdOverrides,
) => void;

interface ExpectedMessageFormat {
  initialState?: any;
  serializedActionCallToReplicate?: SerializedActionCallWithModelIdOverrides;
  requestId: string;
}

class MobxKeystoneProxy {
  private msgListeners: MsgListener[] = [];
  private backgroundContextPort: Port;
  constructor(msgListeners) {
    this.msgListeners = msgListeners;

    // console.debug("MobxKeystoneProxy: Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-mobx-keystone-proxy",
    });

    // listen to updates from host
    const actionCallResultsMessageListener = async (
      m: ExpectedMessageFormat,
    ) => {
      if (m.serializedActionCallToReplicate) {
        const { serializedActionCallToReplicate } = m;
        // console.log("MobxKeystoneProxy received applyActionResult", {serializedActionCallToReplicate});
        this.msgListeners.forEach(listener =>
          listener(serializedActionCallToReplicate!),
        );
        return null;
      }
      if (m.initialState) {
        // handled in another listener, do nothing here
        return null;
      }
      captureExceptionWithExtras(new Error("Unexpected message"), { m });
      console.error("Unexpected message", { m });
    };
    this.backgroundContextPort.onMessage.addListener(
      actionCallResultsMessageListener,
    );
  }
  async requestInitialState(): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = nanoid();
      const resultsMessageListener = async (m: ExpectedMessageFormat) => {
        if (m.initialState) {
          const { initialState } = m;
          if (m.requestId !== requestId) {
            return;
          }
          // console.debug("MobxKeystoneProxy received initialState", {initialState});
          this.backgroundContextPort.onMessage.removeListener(
            resultsMessageListener,
          );
          resolve(initialState);
          return null;
        }
        if (m.serializedActionCallToReplicate) {
          // handled in another listener, do nothing here
          return null;
        }
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
        reject({ m });
      };
      this.backgroundContextPort.onMessage.addListener(resultsMessageListener);
      // console.debug("requestInitialState via content script mobx keystone proxy", {});
      this.backgroundContextPort.postMessage({
        requestInitialState: true,
        requestId,
      });
    });
  }
  async actionCall(actionCall: SerializedActionCall): Promise<any> {
    return new Promise((resolve, _reject) => {
      const requestId = nanoid();
      // console.debug("MobxKeystoneProxy (Content Script Context): actionCall via content script mobx keystone proxy", { actionCall });
      this.backgroundContextPort.postMessage({
        actionCall,
        requestId,
      });
      resolve();
    });
  }
}

class BackgroundContextCommunicator {
  private msgListeners: MsgListener[] = [];
  private mobxKeystoneProxy: MobxKeystoneProxy;
  constructor() {
    this.mobxKeystoneProxy = new MobxKeystoneProxy(this.msgListeners);
  }
  async requestInitialState() {
    return this.mobxKeystoneProxy.requestInitialState();
  }
  onMessage(
    listener: (actionCall: SerializedActionCallWithModelIdOverrides) => void,
  ) {
    this.msgListeners.push(listener);
  }
  sendMessage(actionCall: SerializedActionCall) {
    // send the action to be taken to the host
    this.mobxKeystoneProxy.actionCall(actionCall);
  }
}
const server = new BackgroundContextCommunicator();

export async function subscribeToExtensionState() {
  // we get the snapshot from the server, which is a serializable object
  const rootStoreSnapshot = await server.requestInitialState();
  // and hydrate it into a proper object
  const rootStore = fromSnapshot<ExtensionState>(rootStoreSnapshot);

  let serverAction = false;
  const runServerActionLocally = (
    actionCall: SerializedActionCallWithModelIdOverrides,
  ) => {
    let wasServerAction = serverAction;
    serverAction = true;
    try {
      // in clients we use the sync new model ids version to make sure that
      // any model ids that were generated in the server side end up being
      // the same in the client side
      applySerializedActionAndSyncNewModelIds(rootStore, actionCall);
    } finally {
      serverAction = wasServerAction;
    }
  };

  // listen to action messages to be replicated into the local root store
  server.onMessage(actionCall => {
    runServerActionLocally(actionCall);
  });

  // also listen to local actions, cancel them and send them to the server (background context)
  onActionMiddleware(rootStore, {
    onStart(actionCall, ctx) {
      if (!serverAction) {
        // if the action does not come from the server (background context) cancel it silently
        // and send it to the server (background context)
        // it will then be replicated by the server (background context) and properly executed
        server.sendMessage(serializeActionCall(actionCall, rootStore));
        ctx.data["cancelled"] = true; // just for logging purposes
        // "cancel" the action by returning undefined
        return {
          result: ActionTrackingResult.Return,
          value: undefined,
        };
      } else {
        // run actions that comes from the server (background context) unmodified
        return undefined;
      }
    },
  });

  // recommended by mobx-keystone (allows the model hook `onAttachedToRootStore` to work)
  registerRootStore(rootStore);

  return rootStore;
}
