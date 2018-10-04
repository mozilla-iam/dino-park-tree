import EventEmitter from "events";

import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { createRequest, createResponse } from "node-mocks-http";

chai.use(chaiAsPromised);
chai.should();

function DinoTreeMock(error) {
  return {
    related: () => (error && { error }) || {},
    expanded: () => (error && { error }) || {},
    directs: () => (error && { error }) || {},
    fullOrgchart: () => {
      return { all: "all" };
    }
  };
}

import * as dinos from "../lib/dinos";
sinon.stub(dinos, "DinoTree").callsFake(DinoTreeMock);
import Orgchart from "../lib/orgchart";

describe("Express handlers", () => {
  describe("Basic endpoints", () => {
    const params = { userId: "id" };
    const error = "error";
    const handlers = [
      ["createRelatedHandler", params, error, 404],
      ["createExpandedHandler", params, error, 404],
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
        const orgchart = new Orgchart(storage);
        await orgchart.init();
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

    it("createFullOrgchart", async () => {
      const storage = {
        getDinos: () => error
      };
      const orgchart = new Orgchart(storage);
      await orgchart.init();
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
  });
});
