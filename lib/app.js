import http from "http";

import express from "express";
import bodyParser from "body-parser";

import { logger } from "./config";

import { Storage, getProfileData } from "./storage";
import Orgchart from "./orgchart";

class App {
  constructor(cfg) {
    this.port = cfg.port;
    this.shutdownTimeout = cfg.shutdownTimeout;
    this.app = express();
    this.app.use(bodyParser.json());
  }

  async init(cfg) {
    const storage = new Storage(cfg);
    if (cfg.dummyJson) {
      const allProfiles = getProfileData(cfg);
      await storage.bulkInsert(allProfiles);
    }
    const orgchart = new Orgchart(storage);
    await orgchart.init();

    this.app.get("/orgchart", orgchart.createFullOrgchartHandler());
    this.app.get("/orgchart/related/:userId", orgchart.createRelatedHandler());
    this.app.get("/orgchart/directs/:userId", orgchart.createDirectsHandler());
    this.app.get(
      "/orgchart/expanded/:userId",
      orgchart.createExpandedHandler()
    );
  }

  run() {
    this.server = http.createServer(this.app);
    return this.server.listen(this.port);
  }

  stop() {
    let timer;
    const killer = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("timed out closing http server")),
        this.shutdownTimeout
      );
    });
    const close = new Promise(resolve =>
      this.server.close(() => {
        clearTimeout(timer);
        resolve();
      })
    );
    return Promise.race([close, killer]);
  }
}

export { App as default };
