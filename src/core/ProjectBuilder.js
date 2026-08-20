import path from "path";
import inquirer from "inquirer";
import { PluginRegistry } from "./PluginRegistry.js";
import { detectPackageManager, packageManagerService } from "../services/packageManagerService.js";
import { gitService } from "../services/gitService.js";
import { fsService } from "../services/fsService.js";
import { envService } from "../services/envService.js";
import { AIService } from "../services/aiService.js";
import { contactFooter } from "../utils/contact.js";
import { log } from "../utils/logger.js";
import { isValidProjectName } from "../utils/validators.js";

export class ProjectBuilder {
  async run() {
    // --- CLI-level AI assistant: helps pick a stack & writes the README.
    // This is separate from "AI integration inside the generated project" below.
    const { useAI } = await inquirer.prompt([
      {
        name: "useAI",
        type: "confirm",
        message: "\ud83e\udd16 Want AI help picking a stack & writing your README?",
        default: false,
      },
    ]);

    let aiService = null;
    let aiSuggestion = null;
    let description = null;

    if (useAI) {
      const apiKey = await envService.getAnthropicApiKey();
      aiService = new AIService(apiKey);

      const { desc } = await inquirer.prompt([
        { name: "desc", type: "input", message: "\ud83d\udcdd Describe your project in one sentence:" },
      ]);
      description = desc;

      try {
        aiSuggestion = await aiService.suggestStack(
          desc,
          PluginRegistry.list().map((g) => g.id)
        );
        log.info(`\ud83e\udd16 AI suggests: ${aiSuggestion.stackId} \u2014 ${aiSuggestion.reason}`);
      } catch {
        log.warn("\u26a0\ufe0f AI suggestion failed, continuing without it.");
      }
    }

    const { projectType } = await inquirer.prompt([
      {
        name: "projectType",
        type: "list",
        message: "\ud83d\udcc2 Choose a project type:",
        choices: PluginRegistry.list().map((g) => ({ name: g.label, value: g.id })),
        default: aiSuggestion?.stackId,
      },
    ]);

    const { projectName } = await inquirer.prompt([
      {
        name: "projectName",
        type: "input",
        message: "\ud83d\udcc1 Project folder name:",
        default: "my-project",
        validate: (v) => isValidProjectName(v) || "Use letters, numbers, - and _ only.",
      },
    ]);

    const Generator = PluginRegistry.get(projectType);

    let useTypeScript = false;
    if (Generator.supportsTypeScript) {
      const { ts } = await inquirer.prompt([
        {
          name: "ts",
          type: "confirm",
          message: "\ud83d\udd37 Use TypeScript?",
          default: aiSuggestion?.useTypeScript ?? false,
        },
      ]);
      useTypeScript = ts;
    }

    let renderMode = null;
    if (Generator.supportsRenderMode) {
      const { mode } = await inquirer.prompt([
        {
          name: "mode",
          type: "list",
          message: "\ud83d\udda5\ufe0f Rendering mode:",
          choices: Generator.renderModeChoices || [
            { name: "CSR \u2014 client-side rendered (default SPA)", value: "csr" },
            { name: "SSR \u2014 server-rendered on every request", value: "ssr" },
            { name: "SSG \u2014 pre-rendered static pages", value: "ssg" },
          ],
        },
      ]);
      renderMode = mode;
    }

    let database = "none";
    if (Generator.supportsDatabase) {
      const { db } = await inquirer.prompt([
        {
          name: "db",
          type: "list",
          message: "\ud83d\uddc4\ufe0f Database:",
          choices: [
            { name: "MongoDB (Mongoose)", value: "mongodb" },
            { name: "PostgreSQL", value: "postgres" },
            { name: "MySQL", value: "mysql" },
            { name: "None / skip", value: "none" },
          ],
          default: "none",
        },
      ]);
      database = db;
    }

    let projectAI = false;
    if (Generator.supportsProjectAI) {
      const { wantAI } = await inquirer.prompt([
        {
          name: "wantAI",
          type: "confirm",
          message: "\ud83e\udd16 Bake AI into this project (Claude-powered controller/service + endpoint)?",
          default: false,
        },
      ]);
      projectAI = wantAI;
    }

    let pm = "npm";
    if (Generator.usesNpmInit) {
      const { pmChoice } = await inquirer.prompt([
        {
          name: "pmChoice",
          type: "list",
          message: "\ud83d\udce6 Package manager:",
          choices: ["npm", "pnpm", "yarn"],
          default: "npm",
        },
      ]);
      pm = detectPackageManager(pmChoice);
    }

    const projectPath = path.join(process.cwd(), projectName);
    fsService.ensureDir(projectPath);
    process.chdir(projectPath);

    log.step(`Scaffolding ${Generator.label}: ${projectName}\n`);

    const context = {
      projectName,
      projectPath,
      useTypeScript,
      pm,
      renderMode,
      database,
      projectAI,
      ai: aiService,
      log,
      fs: fsService,
      pmService: packageManagerService,
    };
    const generator = new Generator(context);

    const extraAnswers = await generator.prompts();
    Object.assign(context, extraAnswers);

    if (Generator.usesNpmInit) packageManagerService.init(pm);

    await generator.install();
    await generator.scaffold();
    await generator.postScaffold();

    if (aiService && ["backend", "fullstack"].includes(Generator.category)) {
      await this.maybeScaffoldEndpoint({ aiService, Generator });
    }

    await this.writeReadme({ Generator, generator, projectName, description, aiService });
    this.ensureGitignore();
    gitService.initAndCommit();

    log.success(`\n\u2705 Project "${projectName}" created successfully!`);
    log.warn(`\ud83d\udccc Tip: cd ${projectName} && git log to see your first commit.`);
  }

  // Generators can write their own .gitignore; this is a safety net so that
  // .env files (which now often hold real API keys / DB URLs) never end up
  // in the first commit if a generator forgets.
  ensureGitignore() {
    if (fsService.exists(".gitignore")) return;
    fsService.writeFile(
      ".gitignore",
      "node_modules/\n.env\n.env.local\ndist/\nbuild/\n.next/\n__pycache__/\n*.pyc\n"
    );
  }

  async maybeScaffoldEndpoint({ aiService, Generator }) {
    const { wantEndpoint } = await inquirer.prompt([
      {
        name: "wantEndpoint",
        type: "confirm",
        message: "\ud83e\udd16 Want AI to scaffold one more sample endpoint/feature right now?",
        default: false,
      },
    ]);
    if (!wantEndpoint) return;

    const { endpointDesc } = await inquirer.prompt([
      {
        name: "endpointDesc",
        type: "input",
        message: "\ud83d\udcdd Describe the endpoint/feature (e.g. 'user auth with JWT login/register'):",
      },
    ]);

    try {
      const { files } = await aiService.scaffoldEndpoint({
        description: endpointDesc,
        stackId: Generator.id,
      });
      (files || []).forEach((f) => fsService.writeFile(f.path, f.content));
      log.success(`\u2705 AI generated ${files?.length || 0} file(s) for: ${endpointDesc}`);
    } catch {
      log.warn("\u26a0\ufe0f AI endpoint scaffolding failed \u2014 skipping.");
    }
  }

  async writeReadme({ Generator, generator, projectName, description, aiService }) {
    let body;
    if (aiService) {
      try {
        body = await aiService.generateReadme({
          projectName,
          stackLabel: Generator.label,
          folderTree: generator.folderTree(),
          description,
        });
      } catch {
        log.warn("\u26a0\ufe0f AI README generation failed, using default template.");
      }
    }
    if (!body) {
      body = `# ${projectName}\n\n${Generator.label} project scaffolded with prod-builder.\n`;
    }
    fsService.writeFile("README.md", `${body}\n\n---\n\n${contactFooter()}\n`);
  }
}
