import inquirer from "inquirer";
import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter, CONTACTS } from "../utils/contact.js";

export class ExpressGenerator extends BaseGenerator {
  static id = "express";
  static label = "Express API";
  static category = "backend";
  static supportsTypeScript = false;

  async prompts() {
    const { installDevDeps } = await inquirer.prompt([
      {
        name: "installDevDeps",
        type: "confirm",
        message: "\ud83d\udd27 Install devDependencies (ESLint, Prettier)?",
        default: false,
      },
    ]);
    return { installDevDeps };
  }

  async install() {
    const { pm, installDevDeps } = this.context;
    this.context.pmService.install(pm, ["express", "cors", "dotenv"]);
    if (installDevDeps) {
      this.context.pmService.install(pm, ["eslint", "prettier"], { dev: true });
    }
  }

  async scaffold() {
    const { fs: fsService, projectName } = this.context;

    ["src/controllers", "src/utils", "src/config", "src/uploads", "src/routes", "src/models", "src/middlewares"].forEach(
      (f) => fsService.ensureDir(f)
    );

    fsService.writeFile(".env", "# --------Your environment variables here--------\nMONGO_URL=your-mongodb-url\nPORT=3000\n");

    ["src/controllers", "src/utils", "src/config", "src/routes", "src/models", "src/middlewares"].forEach((f) =>
      fsService.writeFile(`${f}/index.js`, `// --------Your ${f} code here--------\n`)
    );

    fsService.writeFile("src/config/db.js", "// --------Your db connection code here--------\n");

    fsService.writeFile("server.js", `import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(\`
    <h1>\ud83d\ude80 Welcome to ${projectName}</h1>
    <p>This is a professional Express server template.</p>
    <footer style="margin-top:20px;">Powered by <a href="${CONTACTS.portfolio}">Artdev</a></footer>
  \`);
});

app.listen(PORT, () => console.log(\`\u2705 Server running at http://localhost:\${PORT}\`));
${contactFooter()}
`);
  }

  folderTree() {
    return "src/{controllers,routes,models,middlewares,config,utils}, server.js";
  }
}
