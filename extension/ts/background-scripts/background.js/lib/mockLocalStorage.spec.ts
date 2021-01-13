import { assert } from "chai";
import { mockLocalStorage } from "./mockLocalStorage";

describe("mockLocalStorage", function() {
  it("set+get", async function() {
    await mockLocalStorage.set({ foo: "bar" });
    const { foo } = await mockLocalStorage.get("foo");
    assert.equal(foo, "bar");
  });
});
