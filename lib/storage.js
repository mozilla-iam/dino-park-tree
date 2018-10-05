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
    this.client = new elasticsearch.Client({
      host: cfg.elasticHost
    });
    this.index = cfg.elasticIndex;
  }

  async bulkInsert(profiles) {
    const dinos = profiles.map(p => new Dino(p));
    logger.info(`caging ${dinos.length} dinos`);
    const body = [];
    for (const dino of dinos) {
      const index = {
        index: { _index: this.index, _type: TYPE, _id: dino.userId }
      };
      body.push(index);
      body.push(dino);
    }
    await this.client.bulk({ body });
    return this.client.indices.refresh({ index: this.index });
  }

  async update(profile) {
    logger.info(`updating: ${JSON.stringify(profile)}`);
    const dino = new Dino(profile);
    logger.info(`updating: ${JSON.stringify(dino)}`);
    await this.client.index({
      index: this.index,
      type: TYPE,
      id: dino.userId,
      body: dino
    });
    return this.client.indices.refresh({ index: this.index });
  }

  async deleteUser(userId) {
    return this.client.delete({
      index: this.index,
      type: TYPE,
      id: userId
    });
  }

  async getDinos() {
    const allDinos = [];
    const responseQueue = [];

    const exists = await this.client.indices.exists({ index: this.index });
    if (!exists) {
      return allDinos;
    }
    let response = await this.client.search({
      index: this.index,
      type: TYPE,
      scroll: "30s",
      size: 100
    });
    logger.info(`found ${response.hits.total} dinos`);

    responseQueue.push(response);
    while (responseQueue.length) {
      const response = responseQueue.shift();

      response.hits.hits.forEach(hit => {
        allDinos.push(hit._source);
      });

      if (response.hits.total === allDinos.length) {
        logger.info(`stopping after ${allDinos.length} dinos`);
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
