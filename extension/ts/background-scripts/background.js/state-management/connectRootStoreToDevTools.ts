/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { connectReduxDevTools } from "mobx-keystone";

export async function connectRootStoreToDevTools(rootStore) {
  // connect the store to the redux dev tools
  // (different ports for different build variants developed simultaneously)
  const { default: remotedev } = await import("remotedev");
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
