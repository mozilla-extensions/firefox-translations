/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { assert } from "chai";
import { mockLocalStorage } from "./mockLocalStorage";

describe("mockLocalStorage", function() {
  it("set+get", async function() {
    await mockLocalStorage.set({ foo: "bar" });
    const { foo } = await mockLocalStorage.get("foo");
    assert.equal(foo, "bar");
  });
});
