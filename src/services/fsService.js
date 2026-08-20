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
};
