import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

import { generateProfiles, checkTree, checkHierarchy } from "./helpers";
import { DinoTree, Dino } from "../lib/dinos";

describe("DinoTree", () => {
  it("empty constructor", () => {
    (() => new DinoTree()).should.not.throw();
  });

  it("simple tree", () => {
    const h = [[1, 0], [2, 0], [3, 1]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    dinoTree.tree.length.should.be.equal(3);
    dinoTree.id_to_index.size.should.be.equal(3);
    const levels = [1, 2, 3];
    checkTree(dinoTree.tree, levels).should.be.true;
    const org = [[1, [[3, []]]], [2, []]];
    const fullOrg = dinoTree.fullOrgchart();
    checkHierarchy(fullOrg, org).should.be.true;
  });

  it("create tree with non-manager dinos", () => {
    const h = [[1, 0], [2, 0], [3, 5]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    dinoTree.tree.length.should.be.equal(3);
    dinoTree.id_to_index.size.should.be.equal(3);
    const levels = [1, 2, 3];
    checkTree(dinoTree.tree, levels).should.be.true;
    const org = [[1, []], [2, []], [3, []]];
    const fullOrg = dinoTree.fullOrgchart();
    checkHierarchy(fullOrg, org).should.be.true;
  });

  it("directs", () => {
    const h = [[1, 0], [2, 0], [4, 1], [3, 1]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    const directs = dinoTree.directs("dino1");
    directs.length.should.be.equal(2);
    directs[0].dinoId.should.be.equal("dino3");
    directs[1].dinoId.should.be.equal("dino4");
    const noDirects = dinoTree.directs("dino2");
    noDirects.length.should.be.equal(0);
  });

  it("trace", () => {
    const h = [[1, 0], [2, 0], [4, 1], [3, 1]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    const traced = dinoTree.trace("username3");
    console.log(JSON.stringify(traced));
    traced.trace.should.exist;
    traced.trace.should.be.equal("0-0");
  });

  it("related", () => {
    const h = [[1, 0], [2, 1], [4, 2], [3, 2]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    const related = dinoTree.related("username2");
    related.manager.should.exist;
    related.directs.length.should.be.equal(2);
    related.manager.dinoId.should.be.equal("dino1");
    related.directs[0].dinoId.should.be.equal("dino3");
    related.directs[1].dinoId.should.be.equal("dino4");
  });

  it("directs", () => {
    const h = [[1, 0], [2, 0], [4, 1], [3, 1]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    const directs = dinoTree.directs("dino1");
    directs.length.should.be.equal(2);
    directs[0].dinoId.should.be.equal("dino3");
    directs[1].dinoId.should.be.equal("dino4");
    const noDirects = dinoTree.directs("dino2");
    noDirects.length.should.be.equal(0);
  });

  it("expanded", () => {
    const h = [[1, 0], [2, 0], [4, 1], [3, 1]];
    const dinos = generateProfiles(h).map(p => new Dino(p));
    const dinoTree = new DinoTree(dinos);
    const expanded = dinoTree.expanded("dino3");
    expanded.length.should.be.equal(2);
    expanded[0].children.length.should.be.equal(2);
    expanded[0].data.dinoId.should.be.equal("dino1");
    expanded[1].data.dinoId.should.be.equal("dino2");
    expanded[0].children[0].data.dinoId.should.be.equal("dino3");
    expanded[0].children[1].data.dinoId.should.be.equal("dino4");
  });
});
