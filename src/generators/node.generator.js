import inquirer from "inquirer";
import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter, CONTACTS } from "../utils/contact.js";

export class NodeGenerator extends BaseGenerator {
  static id = "node";
  static label = "Node.js (plain)";
  static category = "backend";

  async prompts() {
    const { installDeps } = await inquirer.prompt([
      {
        name: "installDeps",
        type: "confirm",
        message: "\ud83d\udce6 Install recommended packages (dotenv, nodemon)?",
        default: false,
      },
    ]);
    return { installDeps };
  }

  async install() {
    const { pm, installDeps } = this.context;
    if (installDeps) this.context.pmService.install(pm, ["dotenv", "nodemon"]);
  }

  async scaffold() {
    const { fs: fsService, projectName } = this.context;
    fsService.ensureDir("src");
    fsService.writeFile("src/index.js", `console.log("\ud83d\ude80 ${projectName} Node.js app running!");
console.log("Visit: ${CONTACTS.portfolio} for more projects!");
${contactFooter()}
`);
  }

  folderTree() {
    return "src/index.js";
  }
}
