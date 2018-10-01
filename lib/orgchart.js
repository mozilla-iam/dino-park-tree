import getProfileData from "./storage";
import { DinoTree, Dino } from "./dinos";

import { logger } from "./config";

class Orgchart {
  constructor(cfg) {
    const allProfiles = getProfileData(cfg);
    const dinos = allProfiles.map(p => new Dino(p));
    this.dinoTree = new DinoTree(dinos);
    this.fullOrgchart = this.dinoTree.fullOrgchart();
  }

  createFullOrgchartHandler() {
    return (req, res) => {
      logger.info("blip");
      return res.json(this.fullOrgchart);
    };
  }

  createRelatedHandler() {
    return (req, res) => {
      const ret = this.dinoTree.findRelated(req.params.userId);
      if (ret.error) {
        res.status(404);
      }
      return res.json(ret);
    };
  }
}

export { Orgchart as default };
