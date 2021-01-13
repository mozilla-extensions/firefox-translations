import { ExtensionPreferences, Store } from "../background-scripts/background.js/lib/Store";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;

export const subscribeToExtensionPreferenceChangesInBackgroundScript = async (
  store: Store,
  callback: (extensionPreferences: ExtensionPreferences) => void,
) => {
  const extensionPreferences = await store.getExtensionPreferences();
  callback(extensionPreferences);
  const originalSetExtensionPreferences = store.setExtensionPreferences.bind(
    store,
  );
  store.setExtensionPreferences = async (
    extensionPreferences: ExtensionPreferences,
  ) => {
    await originalSetExtensionPreferences(extensionPreferences);
    callback(await store.getExtensionPreferences());
  };
};

export const subscribeToExtensionPreferenceChangesInContentScript = async (
  portName: string,
  callback: (extensionPreferences: ExtensionPreferences) => void,
) => {
  const port = browser.runtime.connect(browser.runtime.id, {
    name: portName,
  });
  return new Promise((resolve, reject) => {
    port.postMessage({
      requestExtensionPreferences: true,
    });
    port.onMessage.addListener(
      async (m: { extensionPreferences: ExtensionPreferences }) => {
        if (m.extensionPreferences) {
          const { extensionPreferences } = m;
          callback(extensionPreferences);
          resolve();
        }
        reject("Unexpected message");
      },
    );
  });
};

/**
 * Set up communication channels with content scripts so that they
 * can subscribe to changes in extension preferences
 * @param store
 * @param portNames
 */
export const communicateExtensionPreferenceChangesToContentScripts = async (
  store: Store,
  portNames: string[],
): Promise<(port: Port) => void> => {
  let connectedPorts: { [portName: string]: Port } = {};

  // Broadcast updates to extension preferences
  const originalSetExtensionPreferences = store.setExtensionPreferences.bind(
    store,
  );
  store.setExtensionPreferences = async (
    extensionPreferences: ExtensionPreferences,
  ) => {
    await originalSetExtensionPreferences(extensionPreferences);
    Object.keys(connectedPorts).forEach(async portName => {
      const port = connectedPorts[portName];
      port.postMessage({
        extensionPreferences: await store.getExtensionPreferences(),
      });
    });
  };

  const extensionPreferencesContentScriptPortListener = (port: Port) => {
    if (!portNames.includes(port.name)) {
      return;
    }
    port.onMessage.addListener(async function(m) {
      connectedPorts[port.name] = port;
      // console.debug(`Message from port "${port.name}"`, { m });
      if (m.requestExtensionPreferences) {
        port.postMessage({
          extensionPreferences: await store.getExtensionPreferences(),
        });
      }
      if (m.saveExtensionPreferences) {
        const { updatedExtensionPreferences } = m.saveExtensionPreferences;
        await store.setExtensionPreferences(updatedExtensionPreferences);
        port.postMessage({
          extensionPreferences: await store.getExtensionPreferences(),
        });
      }
    });
    port.onDisconnect.addListener((port: Port) => {
      delete connectedPorts[port.name];
    });
  };
  browser.runtime.onConnect.addListener(
    extensionPreferencesContentScriptPortListener,
  );
  return extensionPreferencesContentScriptPortListener;
};
