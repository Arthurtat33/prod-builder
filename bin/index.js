#!/usr/bin/env node
import { printBanner } from "../src/cli/banner.js";
import { ProjectBuilder } from "../src/core/ProjectBuilder.js";

printBanner();

new ProjectBuilder().run().catch((err) => {
  console.error("\u274c Something went wrong:", err.message);
  process.exit(1);
});
