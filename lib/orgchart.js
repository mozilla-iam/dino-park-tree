import { DinoTree } from "./dinos";

import { logger } from "./config";

class Orgchart {
  constructor(storage, DT = DinoTree) {
    this.storage = storage;
    this.dinoTree = null;
    this.fullOrgchart = null;
    this._DT = DT;
  }

  async init() {
    const dinos = await this.storage.getDinos();
    this.dinoTree = new this._DT(dinos);
    this.fullOrgchart = this.dinoTree.fullOrgchart();
    return this;
  }

  createFullOrgchartHandler() {
    return (req, res) => {
      return res.json(this.fullOrgchart);
    };
  }

  createRelatedHandler() {
    return (req, res) => {
      const ret = this.dinoTree.related(req.params.username);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createExpandedHandler() {
    return (req, res) => {
      const ret = this.dinoTree.expanded(req.params.dinoId);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createTraceHandler() {
    return (req, res) => {
      const ret = this.dinoTree.trace(req.params.username);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createDirectsHandler() {
    return (req, res) => {
      const ret = this.dinoTree.directs(req.params.dinoId);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }

  createBulkHandler() {
    return (req, res) => {
      const s = req.files.data.data.toString("utf8");
      const profiles = JSON.parse(`${s}`);
      this.storage
        .bulkInsert(profiles)
        .then(r => r.skipped || this.init())
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
        .then(r => r.skipped || this.init())
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createDeleteHandler() {
    return (req, res) => {
      this.storage
        .deleteDino(req.params.dinoId)
        .then(() => this.init())
        .then(() => {
          res.json({ status: "deleted" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }
}

export { Orgchart as default };
