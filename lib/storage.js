import fs from "fs";

function getProfileData(cfg) {
  const raw = fs.readFileSync(cfg.dummyJson);
  return JSON.parse(raw);
}

export { getProfileData as default };
