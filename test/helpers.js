function generateProfile(id, manager_id) {
  const metadata = { visibility: "staff" };
  return {
    user_id: { value: `user${id}`, metadata },
    first_name: { value: `person ${id}`, metadata },
    last_name: { value: `mc ${id}`, metadata },
    picture: { value: "url…", metadata },
    fun_title: { value: `Funny ${id}`, metadata },
    location_preference: { value: `city ${id}`, metadata },
    business_title: { value: `Employee Nr: ${id}`, metadata },
    access_information: {
      hris: {
        values: {
          EmployeeID: id,
          WorkersManagersEmployeeID: manager_id
        }
      }
    }
  };
}

function generateHierarchy(num) {
  return Array.apply(null, { length: num })
    .map(Number.call, Number)
    .map(i => [i + 1, Math.floor(Math.random() * Math.floor(i + 1))]);
}

function generateProfiles(hierarchy) {
  return hierarchy.map(args => generateProfile(...args));
}

function checkHierarchy(tree, slim) {
  if (tree.length !== slim.length) {
    return false;
  }
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].data.user_id !== `user${slim[i][0]}`) {
      return false;
    }
    if (!checkHierarchy(tree[i].children, slim[i][1])) {
      return false;
    }
  }
  return true;
}

function checkTree(tree, slim) {
  if (tree.length !== slim.length) {
    return false;
  }
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].dino.employeeId !== slim[i]) {
      return false;
    }
  }
  return true;
}

export {
  generateProfile,
  generateProfiles,
  generateHierarchy,
  checkTree,
  checkHierarchy
};
