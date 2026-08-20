import fs from "fs";
import path from "path";

export const fsService = {
  ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
  },
  writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    this.ensureDir(dir);
    fs.writeFileSync(filePath, content);
  },
  exists(filePath) {
    return fs.existsSync(filePath);
  },
  // Reads a JSON file (or {} if missing), runs `updater` on it, writes it back.
  // Used to add scripts/fields to package.json after `npm init` already ran.
  updateJson(filePath, updater) {
    const current = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : {};
    const updated = updater(current) || current;
    this.writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`);
  },
};
