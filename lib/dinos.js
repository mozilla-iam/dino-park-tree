import { logger } from "./config";

class Dino {
  constructor(fullProfile) {
    this.userId = fullProfile.user_id.value;
    this.employeeId = fullProfile.access_information.hris.values.EmployeeID;
    this.managerId =
      fullProfile.access_information.hris.values.WorkersManagersEmployeeID;
    this.data = slimDownProfile(fullProfile, this.userId);
  }
}

class DinoNode {
  constructor(parent, firstChild, numChildren, dino) {
    this.parent = parent;
    this.firstChild = firstChild;
    this.numChildren = numChildren;
    this.dino = dino;
  }
}

class DinoTree {
  constructor(dinos = []) {
    logger.info(JSON.stringify(dinos.map(d => d.managerId)));
    this.tree = [];
    this.id_to_index = new Map();
    this.init(dinos);
  }

  init(dinos) {
    const roots = findRoots(dinos);
    logger.info(`roots: ${roots.length}`);

    for (let i = 0; i < roots.length; i++) {
      const dino = roots[i];
      this.id_to_index.set(dino.userId, i);
      this.tree.push(new DinoNode(undefined, undefined, 0, dino));
    }
    this.populate(dinos, 0);
    logger.info(`userIds: t${Array.from(this.id_to_index)}`);
  }

  populate(dinos, currentDinoIndex) {
    if (currentDinoIndex >= this.tree.length) {
      return;
    }
    logger.info(currentDinoIndex);
    const node = this.tree[currentDinoIndex];
    const dino = node.dino;
    const directs = findDirects(dinos, dino.employeeId);
    directs.sort(compareDinos);
    const firstChild = this.tree.length;
    let numChildren = directs.length;
    for (const direct of directs) {
      this.id_to_index.set(direct.userId, this.tree.length);
      this.tree.push(new DinoNode(currentDinoIndex, undefined, 0, direct));
    }
    node.firstChild = firstChild;
    node.numChildren = numChildren;
    this.populate(dinos, currentDinoIndex + 1);
  }

  fullOrgchart() {
    const full = [];
    for (let i = 0; i < this.tree.length; i++) {
      const root = this.tree[i];
      if (typeof root.parent !== "undefined") {
        break;
      }
      const herd = this.findHerd(root);
      full.push(herd);
    }
    return full;
  }

  findHerd(node) {
    const children = [];
    if (node.firstChild) {
      for (let i = 0; i < node.numChildren; i++) {
        let child = this.tree[node.firstChild + i];
        let herd = this.findHerd(child);
        children.push(herd);
      }
    }
    return {
      data: node.dino.data,
      children
    };
  }

  findRelated(userId) {
    const index = this.id_to_index.get(userId);
    if (
      typeof index === "undefined" ||
      index < 0 ||
      index >= this.tree.length
    ) {
      return { error: `unknown userid: ${userId}` };
    }
    const dino = this.tree[index];
    logger.info(`dino: ${JSON.stringify(dino)}`);
    const manager =
      typeof dino.parent !== "undefined" && this.tree[dino.parent].dino.data;
    const directs =
      typeof dino.firstChild !== "undefined" &&
      this.tree
        .slice(dino.firstChild, dino.firstChild + dino.numChildren)
        .map(n => n.dino.data);
    return {
      manager: manager || null,
      directs: directs || null
    };
  }
}

function findDirects(dinos, managerId) {
  return dinos.filter(d => d.managerId === managerId);
}

function findRoots(dinos) {
  const current_ids = new Set(dinos.map(d => d.employeeId));
  return dinos.filter(d => !d.managerId || !current_ids.has(d.managerId));
}

function compareDinos(a, b) {
  if (a.data.first_name < b.data.first_name) {
    return -1;
  }
  if (a.data.first_name > b.data.first_name) {
    return 1;
  }
  if (a.data.last_name < b.data.last_name) {
    return -1;
  }
  if (a.data.last_name > b.data.last_name) {
    return 1;
  }
  return 0;
}

function slimDownProfile(fullProfile, userId) {
  return {
    ["user_id"]: userId,
    ["first_name"]: fullProfile.first_name.value,
    ["last_name"]: fullProfile.last_name.value,
    picture: fullProfile.picture.value,
    title: fullProfile.access_information.hris.values.businessTitle,
    ["fun_title"]: fullProfile.fun_title.value
  };
}

export { DinoTree, Dino };
