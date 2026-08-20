import { execSync } from "child_process";
import fs from "fs";

const INSTALL_CMD = { npm: "npm install", pnpm: "pnpm add", yarn: "yarn add" };
const DEV_FLAG = { npm: "-D", pnpm: "-D", yarn: "-D" };
const INIT_CMD = { npm: "npm init -y", pnpm: "pnpm init", yarn: "yarn init -y" };

export function detectPackageManager(preferred) {
  if (preferred && INSTALL_CMD[preferred]) return preferred;
  if (fs.existsSync("pnpm-lock.yaml")) return "pnpm";
  if (fs.existsSync("yarn.lock")) return "yarn";
  return "npm";
}

export const packageManagerService = {
  init(pm = "npm") {
    execSync(INIT_CMD[pm], { stdio: "inherit" });
  },
  install(pm = "npm", deps = [], { dev = false } = {}) {
    if (!deps.length) return;
    const cmd = `${INSTALL_CMD[pm]} ${dev ? DEV_FLAG[pm] : ""} ${deps.join(" ")}`
      .replace(/\s+/g, " ")
      .trim();
    execSync(cmd, { stdio: "inherit" });
  },
};
