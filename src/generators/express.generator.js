import inquirer from "inquirer";
import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";
import { getNodeDbTemplate } from "../services/databaseTemplates.js";

export class ExpressGenerator extends BaseGenerator {
  static id = "express";
  static label = "Express API";
  static category = "backend";
  static supportsTypeScript = false;
  static supportsDatabase = true;
  static supportsProjectAI = true;

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
    const { pm, installDevDeps, database, projectAI } = this.context;
    const deps = ["express", "cors", "dotenv"];

    if (database !== "none") deps.push(...getNodeDbTemplate(database).deps);
    if (projectAI) deps.push("@anthropic-ai/sdk");

    this.context.pmService.install(pm, deps);
    if (installDevDeps) this.context.pmService.install(pm, ["eslint", "prettier"], { dev: true });
  }

  async scaffold() {
    const { fs: fsService, projectName, database, projectAI } = this.context;

    ["src/controllers", "src/utils", "src/config", "src/uploads", "src/routes", "src/models", "src/middlewares"].forEach(
      (f) => fsService.ensureDir(f)
    );

    let envContent = "# --------Your environment variables here--------\nPORT=3000\n";
    const mounts = []; // { varName, importPath, mountPath }

    // Health check route always exists so there's something runnable out of the box.
    fsService.writeFile(
      "src/controllers/health.controller.js",
      `export function healthCheck(req, res) {
  res.json({ status: "ok" });
}
`
    );
    fsService.writeFile(
      "src/routes/health.routes.js",
      `import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";

const router = Router();
router.get("/", healthCheck);

export default router;
`
    );
    mounts.push({ varName: "healthRoutes", importPath: "./src/routes/health.routes.js", mountPath: "/api/health" });

    // --- Database ---
    if (database !== "none") {
      const tpl = getNodeDbTemplate(database);
      fsService.writeFile("src/config/db.js", tpl.configFile);
      fsService.writeFile("src/models/user.model.js", tpl.modelFile);
      fsService.writeFile("src/controllers/users.controller.js", tpl.controllerFile);
      fsService.writeFile(
        "src/routes/users.routes.js",
        `import { Router } from "express";
import { listUsers, createUser } from "../controllers/users.controller.js";

const router = Router();
router.get("/", listUsers);
router.post("/", createUser);

export default router;
`
      );
      mounts.push({ varName: "usersRoutes", importPath: "./src/routes/users.routes.js", mountPath: "/api/users" });
      envContent += `${tpl.envLine}\n`;
    } else {
      fsService.writeFile("src/config/db.js", "// No database selected \u2014 wire one up here when you're ready.\n");
    }

    // --- Baked-in AI feature (controller + service + route) ---
    if (projectAI) {
      fsService.writeFile(
        "src/services/ai.service.js",
        `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// Model IDs change over time \u2014 check https://docs.claude.com for the current lineup.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export async function askClaude(prompt) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\\n");
}
`
      );
      fsService.writeFile(
        "src/controllers/ai.controller.js",
        `import { askClaude } from "../services/ai.service.js";

export async function chat(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    const reply = await askClaude(prompt);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
`
      );
      fsService.writeFile(
        "src/routes/ai.routes.js",
        `import { Router } from "express";
import { chat } from "../controllers/ai.controller.js";

const router = Router();
router.post("/chat", chat);

export default router;
`
      );
      mounts.push({ varName: "aiRoutes", importPath: "./src/routes/ai.routes.js", mountPath: "/api/ai" });
      envContent += "ANTHROPIC_API_KEY=\nANTHROPIC_MODEL=claude-sonnet-5\n";
    }

    fsService.writeFile(".env", envContent);
    fsService.writeFile("src/middlewares/index.js", "// --------Your middlewares here--------\n");
    fsService.writeFile("src/utils/index.js", "// --------Your utils here--------\n");

    const importLines = mounts.map((m) => `import ${m.varName} from "${m.importPath}";`).join("\n");
    const useLines = mounts.map((m) => `app.use("${m.mountPath}", ${m.varName});`).join("\n");
    const dbImport = database !== "none" ? `import { connectDB } from "./src/config/db.js";\n` : "";
    const dbCall = database !== "none" ? "  await connectDB();\n" : "";

    fsService.writeFile("server.js", `import "dotenv/config";
import express from "express";
import cors from "cors";
${dbImport}${importLines}

const app = express();
app.use(cors());
app.use(express.json());

${useLines}

app.get("/", (req, res) => {
  res.send(\`<h1>\ud83d\ude80 Welcome to ${projectName}</h1><p>Professional Express server template.</p>\`);
});

const PORT = process.env.PORT || 3000;

async function start() {
${dbCall}  app.listen(PORT, () => console.log(\`\u2705 Server running at http://localhost:\${PORT}\`));
}

start();
${contactFooter()}
`);
  }

  folderTree() {
    return "src/{controllers,routes,models,middlewares,config,utils}, server.js";
  }
}
