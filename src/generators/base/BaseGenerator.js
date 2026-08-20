// Every stack generator (React, Express, FastAPI, ...) extends this.
// Adding a new framework/language = adding one file that implements this shape
// and registering it in src/generators/index.js. Nothing else in the CLI changes.
export class BaseGenerator {
  static id = "base";
  static label = "Base Generator";
  static category = "other"; // "frontend" | "backend" | "fullstack" | "other"
  static supportsTypeScript = false;
  static usesNpmInit = true; // set false for non-Node stacks (e.g. Python)

  // Opt-in capability flags. ProjectBuilder only prompts for these when true,
  // and passes the answer into context before install()/scaffold() run.
  static supportsRenderMode = false; // frontend: CSR / SSR / SSG
  static renderModeChoices = null; // override the default 3-way prompt if needed
  static supportsDatabase = false; // backend: MongoDB / PostgreSQL / MySQL / none
  static supportsProjectAI = false; // bakes a Claude-powered controller/service into the project

  constructor(context) {
    // context: { projectName, projectPath, useTypeScript, pm, renderMode,
    //            database, projectAI, ai, log, fs, pmService }
    this.context = context;
  }

  // Extra inquirer questions specific to this generator. Return an object
  // of answers to merge into the shared context.
  async prompts() {
    return {};
  }

  async install() {}

  async scaffold() {}

  async postScaffold() {}

  // Optional: short string describing the generated tree, used in AI README prompts.
  folderTree() {
    return "(see project files)";
  }
}
