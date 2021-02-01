import {
  connectReduxDevTools,
  ModelAutoTypeCheckingMode,
  registerRootStore,
  setGlobalConfig,
} from "mobx-keystone";
import * as remotedev from "remotedev";
import { ExtensionState } from "../../../shared-resources/models/ExtensionState";
import { isChrome } from "../lib/isChrome";

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
  // (different ports for different browser versions developed simultaneously)
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REMOTE_DEV_SERVER_PORT &&
    !isChrome()
  ) {
    const port = process.env.REMOTE_DEV_SERVER_PORT;
    console.info(
      `Connecting the background store to the Redux dev tools on port ${port}`,
    );
    const connection = remotedev.connectViaExtension({
      name: `Background Context (Port ${port})`,
      realtime: true,
      port,
    });
    connectReduxDevTools(remotedev, connection, rootStore);
  }

  return rootStore;
}
