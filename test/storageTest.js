import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import elasticsearch from "elasticsearch";

chai.use(chaiAsPromised);
chai.should();

import { TEST_CONFIG } from "./configs";
import { generateProfile } from "./helpers";
import Storage from "../lib/storage";

function makeEs() {
  class Es {
    constructor() {}
  }
  return Es;
}

describe("constructor", () => {
  it("constructor success", () => {
    const es = makeEs();
    const storage = new Storage(TEST_CONFIG, es);
    storage.should.exist;
  });
});
