import { DinoTree } from "./dinos";

import { logger } from "./config";

class Orgchart {
  constructor(storage) {
    this.storage = storage;
    this.dinoTree = null;
    this.fullOrgchart = null;
  }

  async init(DT = DinoTree) {
    const dinos = await this.storage.getDinos();
    this.dinoTree = new DT(dinos);
    this.fullOrgchart = this.dinoTree.fullOrgchart();
  }

  createFullOrgchartHandler() {
    return (req, res) => {
      return res.json(this.fullOrgchart);
    };
  }

  createRelatedHandler() {
    return (req, res) => {
      const ret = this.dinoTree.related(req.params.userId);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createExpandedHandler() {
    return (req, res) => {
      const ret = this.dinoTree.expanded(req.params.userId);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createDirectsHandler() {
    return (req, res) => {
      const ret = this.dinoTree.directs(req.params.userId);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createBulkHandler() {
    return (req, res) => {
      const s = req.files.data.data.toString("ascii");
      const profiles = JSON.parse(s);
      this.storage
        .bulkInsert(profiles)
        .then(r => this.init())
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createUpdateHandler() {
    return (req, res) => {
      this.storage
        .update(req.body)
        .then(() => this.init())
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }
}

export { Orgchart as default };
