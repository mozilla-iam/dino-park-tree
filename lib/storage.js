import fs from "fs";
import elasticsearch from "elasticsearch";
import connectionClass from "http-aws-es";

import { logger } from "./config";
import { Dino } from "./dinos";

const TYPE = "dino";

class Storage {
  constructor(cfg, esClient = elasticsearch.Client) {
    this.cfg = cfg;
    const options = {
      host: this.cfg.elasticHost
    };
    if (cfg.elasticAwsDefaultRegion !== "") {
      options.connectionClass = connectionClass;
    }
    this.client = new esClient(options);
    this.index = this.cfg.elasticIndex;
  }

  async init() {
    if (this.cfg.dummyJson) {
      await this._loadFromDummyJson();
    }
    return this;
  }

  _loadFromDummyJson() {
    const raw = fs.readFileSync(this.cfg.dummyJson);
    const profiles = JSON.parse(raw);
    return this.bulkInsert(profiles);
  }

  async bulkInsert(profiles) {
    const dinos = profiles
      .map(p => {
        try {
          return new Dino(p);
        } catch (e) {
          logger.error(e);
        }
      })
      .filter(d => !d.skip);
    logger.info(`caging ${dinos.length} dinos`);
    if (dinos.length === 0) {
      return { skipped: true };
    }
    const body = [];
    for (const dino of dinos) {
      const index = {
        index: { _index: this.index, _type: TYPE, _id: dino.dinoId }
      };
      body.push(index);
      body.push(dino);
    }
    await this.client.bulk({ body });
    return this.client.indices.refresh({ index: this.index });
  }

  async update(profile) {
    const dino = new Dino(profile);
    if (dino.skip) {
      return { skipped: true };
    }
    logger.info(`updating: ${JSON.stringify(dino.username)}`);
    await this.client.index({
      index: this.index,
      type: TYPE,
      id: dino.dinoId,
      body: dino
    });
    return this.client.indices.refresh({ index: this.index });
  }

  async deleteDino(dinoId) {
    logger.info(`updating: ${JSON.stringify(dinoId)}`);
    await this.client.delete({
      index: this.index,
      type: TYPE,
      id: dinoId
    });
    return this.client.indices.refresh({ index: this.index });
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

export { Storage as default };
