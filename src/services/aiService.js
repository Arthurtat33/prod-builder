import Anthropic from "@anthropic-ai/sdk";
import { log } from "../utils/logger.js";

// Model IDs change over time \u2014 check https://docs.claude.com for the current lineup
// before shipping. Override via ANTHROPIC_MODEL if this default goes stale.
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export class AIService {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  async _ask(system, user, { json = false } = {}) {
    const res = await this.client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    if (!json) return text;

    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      log.warn("\u26a0\ufe0f Could not parse AI response as JSON, returning raw text.");
      return { raw: text };
    }
  }

  // Recommends a generator id (stack) from a plain-English description.
  async suggestStack(description, availableStacks) {
    const system =
      'You are a senior fullstack architect. Given a project description and a list ' +
      'of available stack ids, respond ONLY with JSON: ' +
      '{"stackId": string, "reason": string, "useTypeScript": boolean}. ' +
      "Pick the closest matching stackId from the provided list.";
    const user = `Description: ${description}\nAvailable stacks: ${availableStacks.join(", ")}`;
    return this._ask(system, user, { json: true });
  }

  // Generates a tailored README body for the scaffolded project.
  async generateReadme({ projectName, stackLabel, folderTree, description }) {
    const system =
      "You write concise, professional README.md files for developer tools and apps. " +
      "Output ONLY markdown, no surrounding code fence.";
    const user = `Project name: ${projectName}\nStack: ${stackLabel}\nDescription: ${
      description || "N/A"
    }\nFolder structure:\n${folderTree}`;
    return this._ask(system, user);
  }

  // Generates real starter files (controller/route/model/etc.) for a described
  // endpoint or feature, matching the conventions of the chosen stack.
  async scaffoldEndpoint({ description, stackId }) {
    const system =
      `You are generating boilerplate source code for a "${stackId}" backend. ` +
      'Respond ONLY with JSON: {"files": [{"path": string, "content": string}]}. ' +
      "Paths are relative to the project root and must match that stack's conventions. " +
      "Keep it minimal and runnable.";
    const user = `Generate the files for this endpoint/feature: ${description}`;
    return this._ask(system, user, { json: true });
  }
}
