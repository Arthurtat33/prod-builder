import fs from "fs";
import os from "os";
import path from "path";
import inquirer from "inquirer";

const CONFIG_PATH = path.join(os.homedir(), ".prodbuilderrc.json");

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export const envService = {
  // Resolution order: env var -> saved global config -> interactive prompt.
  async getAnthropicApiKey() {
    if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

    const cfg = readConfig();
    if (cfg.anthropicApiKey) return cfg.anthropicApiKey;

    const { apiKey, save } = await inquirer.prompt([
      {
        name: "apiKey",
        type: "password",
        mask: "*",
        message: "\ud83d\udd11 Enter your Anthropic API key (only used for AI suggestions):",
      },
      {
        name: "save",
        type: "confirm",
        message: "\ud83d\udcbe Save this key locally for future projects (~/.prodbuilderrc.json)?",
        default: true,
      },
    ]);

    if (save && apiKey) writeConfig({ ...cfg, anthropicApiKey: apiKey });
    return apiKey;
  },
};
