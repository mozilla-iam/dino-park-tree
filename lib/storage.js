import fs from "fs";
import elasticsearch from "elasticsearch";

import { logger } from "./config";
import { Dino } from "./dinos";

const TYPE = "dino";

function getProfileData(cfg) {
  const raw = fs.readFileSync(cfg.dummyJson);
  const profiles = JSON.parse(raw);
  const unique = new Map(profiles.map(p => [p.user_id.value, p]));
  return Array.from(unique.values());
}

class Storage {
  constructor(cfg) {
    this.client = elasticsearch.Client({
      host: cfg.elasticHost
    });
    this.index = cfg.elasticIndex;
  }

  async bulkInsert(profiles) {
    const dinos = profiles.map(p => new Dino(p));
    const body = [];
    for (const dino of dinos) {
      const index = {
        index: { _index: this.index, _type: TYPE, _id: dino.userId }
      };
      body.push(index);
      body.push(dino);
    }
    return this.client.bulk({ body });
  }

  async update(profile) {
    const dino = new Dino(profile);
    return this.client.index({
      index: this.index,
      type: TYPE,
      id: dino.userId,
      body: dino
    });
  }

  async update(userId) {
    return this.client.delete({
      index: this.index,
      type: TYPE,
      id: userId
    });
  }

  async getDinos() {
    const allDinos = [];
    const responseQueue = [];

    let response = await this.client.search({
      index: this.index,
      type: TYPE,
      scroll: "30s",
      size: 100
    });

    responseQueue.push(response);
    while (responseQueue.length) {
      const response = responseQueue.shift();

      response.hits.hits.forEach(hit => {
        allDinos.push(hit._source);
      });

      if (response.hits.total === allDinos.length) {
        break;
      }

      responseQueue.push(
        await this.client.scroll({
          scrollId: response._scroll_id,
          scroll: "30s"
        })
      );
    }
    return allDinos;
  }
}

export { Storage, getProfileData };
