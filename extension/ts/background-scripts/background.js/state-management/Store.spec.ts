/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { assert } from "chai";
import { Store } from "./Store";
import { mockLocalStorage } from "./mockLocalStorage";

describe("Store", function() {
  it("set+get", async function() {
    const store = new Store(mockLocalStorage);
    await store.set({ foo: "bar" });
    const { foo } = await store.get("foo");
    assert.equal(foo, "bar");
  });
});
