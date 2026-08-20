# prod-builder v2

AI-assisted CLI to scaffold multi-language, multi-framework project structures.

## What changed from v1

The old `index.js` was a single ~400-line file mixing CLI prompts, file
templates, and shell commands. v2 splits that into layers so you can add a
new framework or language without touching the wizard logic:

```
prod-builder/
├── bin/
│   └── index.js                    # thin entrypoint: banner + run()
├── src/
│   ├── cli/
│   │   └── banner.js
│   ├── core/
│   │   ├── ProjectBuilder.js       # orchestrates the whole wizard flow
│   │   ├── PluginRegistry.js       # maps generator id -> generator class
│   │   └── config.js
│   ├── generators/                 # one file per stack = one plugin
│   │   ├── base/BaseGenerator.js   # shape every generator implements
│   │   ├── react-vite.generator.js
│   │   ├── nextjs.generator.js
│   │   ├── node.generator.js
│   │   ├── express.generator.js
│   │   ├── python-fastapi.generator.js
│   │   ├── vanilla.generator.js
│   │   ├── custom.generator.js
│   │   └── index.js                # registry array
│   ├── services/
│   │   ├── fsService.js            # writeFile/ensureDir helpers
│   │   ├── packageManagerService.js# npm/pnpm/yarn install + init
│   │   ├── gitService.js           # git init + first commit
│   │   ├── envService.js           # resolves/saves ANTHROPIC_API_KEY
│   │   └── aiService.js            # Anthropic SDK wrapper
│   └── utils/
│       ├── logger.js               # chalk-wrapped console output
│       ├── contact.js              # your CONTACTS + footer generator
│       └── validators.js
├── .env.example
└── package.json
```

### Why this shape

- **Plugin pattern for generators.** `BaseGenerator` defines
  `prompts()`, `install()`, `scaffold()`, `postScaffold()`, `folderTree()`.
  Every stack is a class extending it. `ProjectBuilder` never knows how many
  stacks exist or what they do — it just asks `PluginRegistry` for the list
  and calls the same four methods on whichever one is picked. Adding Vue,
  Svelte, NestJS, Django, Go, Rust, etc. later means adding one file and one
  line in `generators/index.js` — nothing else changes.
- **Services own side effects.** File writes, shell commands, git, and
  network calls to the AI are isolated in `services/`. Generators only call
  `this.context.fs.writeFile(...)` etc., which makes them trivial to test or
  reuse (e.g. the same `fsService` powers every generator instead of each
  one calling `fs` directly like v1 did).
- **Two bugs fixed along the way**: the React generator's `index.html` was
  missing its `<!DOCTYPE html>` bang and pointed at the wrong script path;
  the Express generator's `.env` file was being written inside `src/`
  instead of the project root (dotenv wouldn't have found it by default).

## AI integration

If you opt in (`Want AI help picking a stack & writing your README?`), the
wizard uses `aiService.js` (a thin wrapper around `@anthropic-ai/sdk`) for
three things:

1. **Stack suggestion** — describe your project in a sentence, AI picks
   the closest matching generator id and whether TypeScript makes sense.
2. **README generation** — instead of the generic template, AI writes a
   real README from your description + the actual folder tree.
3. **Endpoint/feature scaffolding** — for backend/fullstack stacks, after
   scaffolding you can describe a feature ("JWT login/register", "CRUD for
   posts with pagination") and AI returns real files written straight into
   the project, following that stack's conventions.

The API key resolves in order: `ANTHROPIC_API_KEY` env var → saved key in
`~/.prodbuilderrc.json` → interactive password prompt (with an offer to
save it for next time). Nothing is sent anywhere unless you opt in.

`ANTHROPIC_MODEL` is configurable — check
[docs.claude.com](https://docs.claude.com) for current model IDs before
you ship this, since they change over time.

## Usage

```bash
npm install
npm link            # exposes the `init-project` command globally
init-project
```

## Roadmap / how to extend

Each of these is "write one generator file that matches `BaseGenerator`'s
shape, add it to `generators/index.js`":

| Addition | Notes |
|---|---|
| Vue 3 + Vite | mirror `react-vite.generator.js`, swap JSX for SFCs |
| SvelteKit | `category: "fullstack"`, no separate `index.html` needed |
| NestJS | `category: "backend"`, generate module/controller/service triads |
| Fastify | lighter alternative to the Express generator |
| Django / Flask | `usesNpmInit: false`, same pattern as the FastAPI generator |
| Go (net/http or Gin) | `usesNpmInit: false`, write `go.mod` + `main.go` |
| React Native (bare) | reuse INFOcAMPUS's existing folder conventions as the template |

Other directions worth considering once the plugin surface grows:
- A `templates.config.json` so people can override individual file
  templates without forking a generator.
- A non-interactive mode (`init-project --stack express --name api --yes`)
  for CI or scripting — `ProjectBuilder` would need its prompts split from
  its execution logic, which the current method boundaries already support.
- Turning `aiService.scaffoldEndpoint` into a standalone command
  (`init-project ai:endpoint "..."`) so it can be run against an existing
  project, not just right after scaffolding.

---

/*

👤 Created by Artdev
📧 Email: tatchouarthur@gmail.com
🌐 Portfolio: https://arthurtatchou-portfolio.vercel.app
🔗 LinkedIn: https://www.linkedin.com/in/arthur-tatchou-587ba92a9
💻 GitHub: https://github.com/Arthurtat33
📱 WhatsApp: +237652949715

*/
