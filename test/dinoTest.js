import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
const should = chai.should();

import { generateProfile } from "./helpers";
import { Dino } from "../lib/dinos";

describe("Dino", () => {
  it("empty constructor throws", () => {
    (() => new Dino()).should.throw();
  });
  it("constructor success", () => {
    const profile = generateProfile(1, 0);
    const dino = new Dino(profile);
    dino.employeeId.should.be.equal(1);
    dino.managerId.should.be.equal(0);
    should.not.exist(dino.skip);
  });
  it("inactive skipped", () => {
    const profile = generateProfile(1, 0);
    profile.active.value = false;
    const dino = new Dino(profile);
    dino.skip.should.be.true;
  });
});
