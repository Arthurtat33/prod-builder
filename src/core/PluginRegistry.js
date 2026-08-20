import { generators } from "../generators/index.js";

export const PluginRegistry = {
  list() {
    return generators.map((G) => ({ id: G.id, label: G.label, category: G.category }));
  },
  get(id) {
    const Generator = generators.find((G) => G.id === id);
    if (!Generator) throw new Error(`Unknown generator: ${id}`);
    return Generator;
  },
};
