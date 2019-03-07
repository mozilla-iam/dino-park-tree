import { logger } from "./config";

const ROOTS = [
  "mitchell@mozilla.com",
  "chris@mozilla.com",
  "mark@mozillafoundation.org"
];

class Dino {
  constructor(fullProfile) {
    if (fullProfile.staff_information.staff.value) {
      this.dinoId = fullProfile.uuid.value;
      this.username = fullProfile.primary_username.value;
      this.mail = fullProfile.primary_email.value;
      this.employeeId =
        fullProfile.access_information.hris.values.PrimaryWorkEmail;
      this.managerId =
        fullProfile.access_information.hris.values.Worker_s_Manager_s_Email_Address;
      if (this.employeeId === this.managerId) {
        this.managerId = undefined;
      }
      this.data = _slimDownProfile(fullProfile, this.dinoId);
    } else {
      this.skip = true;
    }
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
    this.tree = [];
    this.id_to_index = new Map();
    this.username_to_index = new Map();
    this.firstLoose = 0;
    this._init(dinos);
  }

  _init(dinos) {
    const roots = _findRoots(dinos);
    for (let i = 0; i < roots.length; i++) {
      const dino = roots[i];
      this.id_to_index.set(dino.dinoId, i);
      this.username_to_index.set(dino.username, i);
      this.tree.push(new DinoNode(-1, undefined, 0, dino));
    }

    logger.info(`got ${this.tree.length} roots in tree`);
    this._populate(dinos, 0);

    this.firstLoose = this.tree.length;
    logger.info(`no mans start at ${this.tree.length}`);
    const noMans = _findNoMans(dinos);
    noMans.sort(_compareDinos);
    for (let i = 0; i < noMans.length; i++) {
      const dino = noMans[i];
      this.id_to_index.set(dino.dinoId, i + this.firstLoose);
      this.username_to_index.set(dino.username, i + this.firstLoose);
      this.tree.push(new DinoNode(-1, undefined, 0, dino));
    }

    this._populate(dinos, this.firstLoose);
  }

  _populate(dinos, currentDinoIndex) {
    if (currentDinoIndex >= this.tree.length) {
      return;
    }
    const node = this.tree[currentDinoIndex];
    const dino = node.dino;
    const directs = _findDirects(dinos, dino.employeeId);
    directs.sort(_compareDinos);
    const firstChild = this.tree.length;
    let numChildren = directs.length;
    for (const direct of directs) {
      if (this.id_to_index.has(direct.dinoId)) {
        logger.error(`Wait what? ${direct.dinoId} already in tree?`);
        return;
      }
      this.id_to_index.set(direct.dinoId, this.tree.length);
      this.username_to_index.set(direct.username, this.tree.length);
      this.tree.push(new DinoNode(currentDinoIndex, undefined, 0, direct));
    }
    node.firstChild = firstChild;
    node.numChildren = numChildren;
    this._populate(dinos, currentDinoIndex + 1);
  }

  _findHerd(node) {
    const children = [];
    if (node.firstChild) {
      for (let i = 0; i < node.numChildren; i++) {
        let child = this.tree[node.firstChild + i];
        let herd = this._findHerd(child);
        children.push(herd);
      }
    }
    return {
      data: node.dino.data,
      children
    };
  }

  _withSiblings(node, children) {
    let index = this._badIndex(node.parent)
      ? 0
      : this.tree[node.parent].firstChild;
    const siblings = [];
    let next = this.tree[index];
    while (next && next.dino.dinoId !== node.dino.dinoId) {
      siblings.push({ data: next.dino.data, children: [] });
      next = this.tree[++index];
    }
    siblings.push({ data: node.dino.data, children });
    next = this.tree[++index];
    while (next && next.parent === node.parent) {
      siblings.push({ data: next.dino.data, children: [] });
      next = this.tree[++index];
    }
    return siblings;
  }

  _traceIndex(node, index, trace) {
    if (this._badIndex(node.parent)) {
      if (index >= this.firstLoose) {
        trace.push(index - this.firstLoose);
        // -1 indicates that we're in the loose section
        trace.push(-1);
      } else {
        trace.push(index);
      }
      return trace;
    }
    let first = this.tree[node.parent].firstChild;
    trace.push(index - first);
    return this._traceIndex(this.tree[node.parent], node.parent, trace);
  }

  _walkUp(node, children = []) {
    const data = this._withSiblings(node, children);
    const parentIndex = node.parent;
    if (this._badIndex(parentIndex)) {
      return data;
    }
    const parent = this.tree[parentIndex];
    return this._walkUp(parent, data);
  }

  _directsData(node) {
    if (typeof node.firstChild !== "undefined") {
      return this.tree
        .slice(node.firstChild, node.firstChild + node.numChildren)
        .map(n => n.dino.data);
    }
    return [];
  }

  _badIndex(index) {
    return (
      typeof index === "undefined" || index < 0 || index >= this.tree.length
    );
  }

  fullOrgchart() {
    const forrest = [];
    for (let i = 0; i < this.tree.length; i++) {
      const r = this.tree[i];
      if (r.parent > -1) {
        break;
      }
      const herd = this._findHerd(r);
      forrest.push(herd);
    }
    const loose = [];
    for (let i = this.firstLoose; i < this.tree.length; i++) {
      const noMan = this.tree[i];
      if (noMan.parent > -1) {
        break;
      }
      const herd = this._findHerd(noMan);
      loose.push(herd);
    }

    return { forrest, loose };
  }

  related(username) {
    const index = this.username_to_index.get(username);
    if (this._badIndex(index)) {
      logger.error(`bad index for ${username}`);
      return { manager: null, directs: [] };
    }
    const node = this.tree[index];
    const manager =
      node.parent > -1 ? snakeCaseKeys(this.tree[node.parent].dino.data) : null;
    const directs = this._directsData(node).map(snakeCaseKeys);
    return {
      manager: manager,
      directs: directs
    };
  }

  directs(dinoId) {
    const index = this.id_to_index.get(dinoId);
    if (this._badIndex(index)) {
      return { error: `unknown userid: ${dinoId}` };
    }
    const node = this.tree[index];
    return this._directsData(node);
  }

  expanded(dinoId) {
    const index = this.id_to_index.get(dinoId);
    if (this._badIndex(index)) {
      return { error: `unknown userid: ${dinoId}` };
    }
    const node = this.tree[index];
    return this._walkUp(node);
  }

  trace(username) {
    const index = this.username_to_index.get(username);
    if (this._badIndex(index)) {
      return { error: `unknown username: ${username}` };
    }
    const node = this.tree[index];
    const trace = this._traceIndex(node, index, []);
    trace.reverse();
    return {
      trace: trace.join("-")
    };
  }
}

function _findDirects(dinos, managerId) {
  return dinos.filter(d => d.managerId === managerId);
}

function _findRoots(dinos) {
  const roots = dinos.filter(d => ROOTS.includes(d.mail));
  const map = new Map(roots.map(d => [d.mail, d]));
  return ROOTS.map(mail => map.get(mail)).filter(d => d);
}

function _findNoMans(dinos) {
  const currentIds = new Set(dinos.map(d => d.employeeId));
  return dinos.filter(
    d =>
      !ROOTS.includes(d.mail) && (!d.managerId || !currentIds.has(d.managerId))
  );
}

function _compareDinos(a, b) {
  if (a.data.firstName < b.data.firstName) {
    return -1;
  }
  if (a.data.firstName > b.data.firstName) {
    return 1;
  }
  if (a.data.lastName < b.data.lastName) {
    return -1;
  }
  if (a.data.lastName > b.data.lastName) {
    return 1;
  }
  return 0;
}

function getStaffField(obj, field) {
  try {
    if (
      field in obj &&
      obj[field].metadata.display !== "private" &&
      obj[field].metadata.display !== null
    ) {
      return obj[field].value;
    }
  } catch (_) {
    logger.error(`missing field ${field}`);
  }
  return null;
}

function _slimDownProfile(fullProfile, dinoId) {
  return {
    dinoId: dinoId,
    username: fullProfile.primary_username.value,
    firstName: fullProfile.first_name.value,
    lastName: getStaffField(fullProfile, "last_name"),
    picture: fullProfile.picture.value,
    title: getStaffField(fullProfile.staff_information, "title"),
    funTitle: getStaffField(fullProfile, "fun_title"),
    location: getStaffField(fullProfile, "location"),
    officeLocation: getStaffField(
      fullProfile.staff_information,
      "office_location"
    )
  };
}

function snakeCaseKeys(o) {
  const s = {};
  for (const [k, v] of Object.entries(o)) {
    s[snakeCase(k)] = v;
  }
  return s;
}

function snakeCase(s) {
  return s.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
}

export { DinoTree, Dino };
