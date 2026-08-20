// Every stack generator (React, Express, FastAPI, ...) extends this.
// Adding a new framework/language = adding one file that implements this shape
// and registering it in src/generators/index.js. Nothing else in the CLI changes.
export class BaseGenerator {
  static id = "base";
  static label = "Base Generator";
  static category = "other"; // "frontend" | "backend" | "fullstack" | "other"
  static supportsTypeScript = false;
  static usesNpmInit = true; // set false for non-Node stacks (e.g. Python)

  constructor(context) {
    // context: { projectName, projectPath, useTypeScript, pm, ai, log, fs, pmService }
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
