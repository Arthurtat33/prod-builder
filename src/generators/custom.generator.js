import inquirer from "inquirer";
import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";

export class CustomGenerator extends BaseGenerator {
  static id = "custom";
  static label = "Custom (Manual)";
  static category = "other";
  static usesNpmInit = false;

  async install() {}

  async scaffold() {
    const { fs: fsService } = this.context;
    const { subCount } = await inquirer.prompt([
      { name: "subCount", type: "number", message: "\ud83d\udcc2 Number of subfolders:", default: 0 },
    ]);

    for (let i = 0; i < subCount; i++) {
      const { subName } = await inquirer.prompt([
        { name: "subName", type: "input", message: `\ud83d\udd39 Name of subfolder ${i + 1}:` },
      ]);
      fsService.ensureDir(subName);

      const { fileCount } = await inquirer.prompt([
        { name: "fileCount", type: "number", message: `\ud83d\udcc4 Number of files in ${subName}:`, default: 0 },
      ]);

      for (let j = 0; j < fileCount; j++) {
        const { fileName } = await inquirer.prompt([
          { name: "fileName", type: "input", message: `   \ud83d\udcc4 Name of file ${j + 1}:` },
        ]);
        fsService.writeFile(`${subName}/${fileName}`, `// ${fileName}\n${contactFooter()}\n`);
      }
    }
  }
}
