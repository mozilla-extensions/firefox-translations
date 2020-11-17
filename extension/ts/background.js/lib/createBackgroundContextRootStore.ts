import {
  connectReduxDevTools,
  ModelAutoTypeCheckingMode,
  registerRootStore,
  setGlobalConfig,
} from "mobx-keystone";
import * as remotedev from "remotedev";
import { ExtensionState } from "../../shared-resources/models/ExtensionState";

// enable runtime data checking even in production mode
setGlobalConfig({
  modelAutoTypeChecking: ModelAutoTypeCheckingMode.AlwaysOn,
});
export function createBackgroundContextRootStore(): ExtensionState {
  // the parameter is the initial data for the model
  const rootStore = new ExtensionState({});

  // recommended by mobx-keystone (allows the model hook `onAttachedToRootStore` to work and other goodies)
  registerRootStore(rootStore);

  // connect the store to the redux dev tools
  const connection = remotedev.connectViaExtension({
    name: "Background Context",
    realtime: true,
    port: 8181,
  });
  connectReduxDevTools(remotedev, connection, rootStore);

  return rootStore;
}
