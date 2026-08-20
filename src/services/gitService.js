import { execSync } from "child_process";
import { log } from "../utils/logger.js";

export const gitService = {
  initAndCommit(message = "\ud83d\ude80 Initial project setup") {
    try {
      execSync("git init", { stdio: "ignore" });
      execSync("git add .", { stdio: "ignore" });
      execSync(`git commit -m "${message}"`, { stdio: "ignore" });
      log.success("\ud83d\udcda Git repository initialized & first commit created.");
    } catch {
      log.warn("\u26a0\ufe0f Git not available or init failed \u2014 skipping version control setup.");
    }
  },
};
