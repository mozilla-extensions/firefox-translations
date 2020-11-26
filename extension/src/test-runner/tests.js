/* eslint-env mocha */
/* global chai */
const { expect } = chai;

describe("test", async () => {
  it("passes", async () => {
    expect(1).to.eql(1);
  });

  it("fails", async () => {
    expect(1).to.eql(2);
  });
});
