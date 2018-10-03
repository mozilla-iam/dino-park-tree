import { Storage, getProfileData } from "./storage";
import { DinoTree, Dino } from "./dinos";

import { logger } from "./config";

class Orgchart {
  constructor(dinos) {
    this.dinoTree = new DinoTree(dinos);
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
}

export { Orgchart as default };
