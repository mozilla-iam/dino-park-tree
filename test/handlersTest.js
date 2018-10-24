import EventEmitter from "events";

import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createRequest, createResponse } from "node-mocks-http";

chai.use(chaiAsPromised);
chai.should();

class DinoTreeMock {
  constructor(error) {
    this.error = error;
  }
  _error() {
    return (this.error && { error: this.error }) || {};
  }
  related() {
    return this._error();
  }
  expanded() {
    return this._error();
  }
  directs() {
    return this._error();
  }
  fullOrgchart() {
    return { all: "all" };
  }
  trace() {
    return this._error();
  }
}

import Orgchart from "../lib/orgchart";

describe("Express handlers", () => {
  describe("Basic endpoints", () => {
    const params = { userId: "id" };
    const error = "error";
    const handlers = [
      ["createRelatedHandler", params, error, 404],
      ["createExpandedHandler", params, error, 404],
      ["createTraceHandler", params, error, 404],
      ["createDirectsHandler", params, error, 404],
      ["createFullOrgchartHandler", , error, 200],
      ["createRelatedHandler", params, , 200],
      ["createExpandedHandler", params, , 200],
      ["createDirectsHandler", params, , 200],
      ["createFullOrgchartHandler", , , 200]
    ];

    for (const [handler, params, error, status] of handlers) {
      it(`${handler}`, async () => {
        const storage = {
          getDinos: () => error
        };
        const orgchart = await new Orgchart(storage, DinoTreeMock).init();
        const handle = orgchart[handler]();
        const req = createRequest({ method: "GET", params });
        const res = createResponse({
          eventEmitter: EventEmitter
        });

        const result = new Promise(resolve => {
          res.on("end", () => {
            res._isEndCalled().should.be.true;
            res.statusCode.should.be.equal(status);
            resolve();
          });
        });

        handle(req, res);

        return result;
      });
    }

    it("createFullOrgchartHandler", async () => {
      const storage = {
        getDinos: () => error
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createFullOrgchartHandler();
      const req = createRequest({ method: "GET" });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(200);
          JSON.parse(res._getData()).should.be.deep.equal({ all: "all" });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });

    it("createBulkHandler", async () => {
      const files = {
        data: {
          data: "[]"
        }
      };
      const storage = {
        getDinos: () => error,
        bulkInsert: async profiles => {
          profiles.length.should.be.equal(0);
          return DinoTreeMock;
        }
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createBulkHandler();
      const req = createRequest({ method: "POST", files });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(200);
          JSON.parse(res._getData()).should.be.deep.equal({
            status: "updated"
          });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });

    it("createBulkHandler fails", async () => {
      const files = {
        data: {
          data: "[]"
        }
      };
      const storage = {
        getDinos: () => error,
        bulkInsert: async () => {
          return Promise.reject("FAIL");
        }
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createBulkHandler();
      const req = createRequest({ method: "POST", files });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(503);
          JSON.parse(res._getData()).should.be.deep.equal({
            error: "FAIL"
          });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });

    it("createUpdateHandler", async () => {
      const body = {};
      const storage = {
        getDinos: () => error,
        update: async profile => {
          profile.should.be.deep.equal({});
          return DinoTreeMock;
        }
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createUpdateHandler();
      const req = createRequest({ method: "POST", body });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(200);
          JSON.parse(res._getData()).should.be.deep.equal({
            status: "updated"
          });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });

    it("createUpdateHandler fails", async () => {
      const body = {};
      const storage = {
        getDinos: () => error,
        update: async () => {
          return Promise.reject("FAIL");
        }
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createUpdateHandler();
      const req = createRequest({ method: "POST", body });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(503);
          JSON.parse(res._getData()).should.be.deep.equal({
            error: "FAIL"
          });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });

    it("createDeleteHandler", async () => {
      const storage = {
        getDinos: () => error,
        deleteDino: async userId => {
          userId.should.be.equal("user1");
          return DinoTreeMock;
        }
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createDeleteHandler();
      const req = createRequest({
        method: "POST",
        params: { userId: "user1" }
      });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(200);
          JSON.parse(res._getData()).should.be.deep.equal({
            status: "deleted"
          });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });

    it("createDeleteHandler fails", async () => {
      const storage = {
        getDinos: () => error,
        deleteDino: async () => {
          return Promise.reject("FAIL");
        }
      };
      const orgchart = await new Orgchart(storage, DinoTreeMock).init();
      const handle = orgchart.createDeleteHandler();
      const req = createRequest({
        method: "POST",
        params: { userId: "user1" }
      });
      const res = createResponse({
        eventEmitter: EventEmitter
      });

      const result = new Promise(resolve => {
        res.on("end", () => {
          res._isEndCalled().should.be.true;
          res.statusCode.should.be.equal(503);
          JSON.parse(res._getData()).should.be.deep.equal({
            error: "FAIL"
          });
          resolve();
        });
      });

      handle(req, res);

      return result;
    });
  });
});
