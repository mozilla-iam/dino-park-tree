import fs from "fs";
import elasticsearch from "elasticsearch";

import { logger } from "./config";
import { Dino } from "./dinos";

const TYPE = "dino";

function getProfileData(cfg) {
  const raw = fs.readFileSync(cfg.dummyJson);
  return JSON.parse(raw);
}

class Storage {
  constructor(cfg) {
    this.client = elasticsearch.Client({
      host: cfg.elasticHost
    });
    this.index = cfg.elasticIndex;
  }

  bulkInsert(profiles) {
    const dinos = profiles.map(p => new Dino(p));
    const body = [];
    for (const dino of dinos) {
      const index = {
        index: { _index: this.index, _type: TYPE, _id: dino.userId }
      };
      body.push(index);
      body.push(dino);
    }
    logger.info(`bulking ${body.length / 2} dinos`);
    return this.client.bulk({ body });
  }

  getDinos() {
    return this.client.search({
      index: this.index,
      type: TYPE,
      size: 2000
    });
  }
}

export { Storage, getProfileData };
