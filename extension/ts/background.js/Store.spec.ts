import { assert } from "chai";
import { Store } from "./Store";
import { mockLocalStorage } from "./lib/mockLocalStorage";

describe("Store", function() {
  it("set+get", async function() {
    const store = new Store(mockLocalStorage);
    await store.set({ foo: "bar" });
    const { foo } = await store.get("foo");
    assert.equal(foo, "bar");
  });
});
