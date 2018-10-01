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
      logger.info(`got ${allProfiles.length} profiles`);
      await storage.bulkInsert(allProfiles);
    }
    const rawDinos = await storage.getDinos();
    const dinos = rawDinos.hits.hits.map(h => h._source);
    logger.info(`got ${dinos.length} dinos`);
    const orgchart = new Orgchart(dinos);

    this.app.get("/orgchart", orgchart.createFullOrgchartHandler());
    this.app.get("/orgchart/:userId", orgchart.createRelatedHandler());
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
