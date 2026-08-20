import { ReactViteGenerator } from "./react-vite.generator.js";
import { NextJsGenerator } from "./nextjs.generator.js";
import { NodeGenerator } from "./node.generator.js";
import { ExpressGenerator } from "./express.generator.js";
import { PythonFastAPIGenerator } from "./python-fastapi.generator.js";
import { VanillaGenerator } from "./vanilla.generator.js";
import { CustomGenerator } from "./custom.generator.js";

// This array IS the plugin registry. Add a generator class here to add a
// new framework/language option to the wizard.
export const generators = [
  ReactViteGenerator,
  NextJsGenerator,
  NodeGenerator,
  ExpressGenerator,
  PythonFastAPIGenerator,
  VanillaGenerator,
  CustomGenerator,
];
