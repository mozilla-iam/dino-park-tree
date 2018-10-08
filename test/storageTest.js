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

function makeHits(num) {
  return Array.apply(null, { length: num })
    .map(Number.call, Number)
    .map(i => {
      return { _source: i };
    });
}

function makeEs(how) {
  class Es {
    constructor() {
      this.indices = {};
      this.indices.exists = async () => how.exists;
      this.indices.refresh = async () => how.refresh;
      this.scrollId = 0;
    }
    async search({ scroll }) {
      this.scrollId = scroll && 0;
      return {
        hits: {
          total: how.total,
          hits: how.searchHits,
          _scroll_id: scroll && 1
        }
      };
    }
    async scroll() {
      return {
        hits: {
          total: how.total,
          hits: how.scrollHits[this.scrollId++] || [],
          _scroll_id: 1
        }
      };
    }
    async delete() {}
  }
  return Es;
}

describe("constructor", () => {
  it("constructor success", async () => {
    const es = makeEs();
    const storage = await new Storage(TEST_CONFIG, es).init();
    storage.should.exist;
  });

  it("get them all", async () => {
    const hits = makeHits(150);
    const es = makeEs({
      exists: true,
      total: 130,
      searchHits: hits.splice(0, 50),
      scrollHits: [hits.splice(0, 50), hits.splice(0, 30)]
    });
    const storage = new Storage(TEST_CONFIG, es);
    const dinos = await storage.getDinos();
    dinos.length.should.be.equal(130);
  });

  it("delete calls refresh", async () => {
    const es = makeEs({ refresh: Promise.resolve(true) });
    const storage = new Storage(TEST_CONFIG, es);
    const dinos = await storage.deleteUser();
    dinos.should.be.true;
  });

  it("update", async () => {
    const profile = generateProfile(1, 0);
    const es = makeEs({ refresh: Promise.resolve(true) });
    const storage = new Storage(TEST_CONFIG, es);
    const dinos = await storage.update(profile);
    dinos.should.be.true;
  });
});
