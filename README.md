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

## Two separate AI features — don't confuse them

**1. CLI-level AI assistant** (opt in via `Want AI help picking a stack &
writing your README?`). This helps *you build the project*:
- **Stack suggestion** — describe your project in a sentence, AI picks
  the closest matching generator id and whether TypeScript makes sense.
- **README generation** — instead of the generic template, AI writes a
  real README from your description + the actual folder tree.
- **One-off endpoint scaffolding** — right after scaffolding, describe a
  feature ("JWT login/register") and AI writes real files into the project
  once, following that stack's conventions.

**2. Baked-in project AI feature** (opt in per-project via `Bake AI into
this project?`, shown for Express, FastAPI, and Next.js). This adds a
*permanent* AI capability to the app you're generating — not a one-time
generation step, but actual source files that ship with the project:
- Express → `src/services/ai.service.js` + `src/controllers/ai.controller.js`
  + `src/routes/ai.routes.js`, mounted at `POST /api/ai/chat`
- FastAPI → `app/services/ai_service.py` + `app/routers/ai.py`, mounted at
  `POST /ai/chat`
- Next.js → `app/api/ai/route.js`, a real route handler at `POST /api/ai`

Both features use `ANTHROPIC_API_KEY`. For the CLI assistant it resolves:
env var → saved key in `~/.prodbuilderrc.json` → interactive password
prompt (offers to save for next time). For the baked-in project feature,
the key is just left blank in the generated `.env`/`.env.local` for you to
fill in — the generated project has zero access to your CLI's saved key.

`ANTHROPIC_MODEL` is configurable in both places — check
[docs.claude.com](https://docs.claude.com) for current model IDs before
you ship this, since they change over time.

## Database setup

Express, FastAPI, and Next.js all prompt for **MongoDB / PostgreSQL /
MySQL / none**. Whichever you pick, you get a real, connected `users`
resource, not just a driver installed with nothing wired up:

| Stack | Config file | Model | Route |
|---|---|---|---|
| Express | `src/config/db.js` | `src/models/user.model.js` (Mongoose schema, or `pg`/`mysql2` pool queries) | `GET/POST /api/users` |
| FastAPI | `app/core/database.py` | `app/models/user.py` (Motor doc, or SQLAlchemy model) | `GET/POST /users` |
| Next.js | `lib/db.js` | `lib/models/user.js` | `GET/POST /api/users` (App Router route handler) |

React (Vite) deliberately has **no** database option — a frontend
shouldn't hold DB credentials. If your SSR server needs data, call a
backend API (e.g. the Express generator) instead of connecting to a
database directly from the SSR process.

## SSR / SSG

- **React (Vite)** now asks for a rendering mode:
  - `csr` — the original SPA behavior (`vite` dev server, `BrowserRouter`).
  - `ssr` — real `entry-client.jsx` / `entry-server.jsx` split, an Express
    server (`server.js`) that uses Vite in middleware mode for dev and
    serves the built bundle in prod, following the standard Vite SSR guide.
  - `ssg` — same entry-server split, plus `prerender.js`, which renders a
    list of routes to static HTML after `npm run build`. Output in
    `dist/client` is fully static and needs no Node server to serve.
- **Next.js** asks for `ssr` or `ssg` and generates a demo route proving
  it: `app/dashboard/page.jsx` with `export const dynamic = "force-dynamic"`
  for SSR, or `app/posts/[id]/page.jsx` with `generateStaticParams()` for
  SSG — Next handles both natively, no custom server needed.
- **Vanilla HTML/CSS/JS** is already static output by definition, so no
  render-mode prompt applies.

## Generated code quality

Every React (Vite) project now ships with actual structure instead of
placeholder `<div>X component</div>` stubs:
- `react-router-dom` wired up (`src/routes/AppRoutes.jsx`, real `Home`/
  `About` pages, `NavLink` with active-state styling)
- `AuthContext` actually wraps the app in `App.jsx`, not just defined and
  ignored
- `useMobile`/`useToast` hooks actually used (Navbar responds to viewport)
- Every UI component (`Navbar`, `Footer`, `Sidebar`, `Button`, `Card`,
  `Alert`, `Modal`) has real markup + a matching `index.css`, not a bare div

Two bugs from the original template were also fixed along the way: the
`index.html` was missing its `<!DOCTYPE html>` and pointed at the wrong
script path, and Express's `.env` was written inside `src/` where dotenv
wouldn't find it by default.

## Usage

```bash
npm install
npm link            # exposes the `init-project` command globally
init-project
```

## Roadmap / how to extend

Each of these is "write one generator file that matches `BaseGenerator`'s
shape, add it to `generators/index.js`" — the capability flags
(`supportsDatabase`, `supportsProjectAI`, `supportsRenderMode`) and the
shared `databaseTemplates.js` are already there to reuse:

| Addition | Notes |
|---|---|
| Vue 3 + Vite | mirror `react-vite.generator.js`, swap JSX for SFCs; same `supportsRenderMode` pattern works with `vite-plugin-vue` SSR |
| SvelteKit | `category: "fullstack"`, SSR/SSG native — no custom server needed, similar to the Next.js generator |
| NestJS | `category: "backend"`, `supportsDatabase: true` (reuse `databaseTemplates.js` with a TypeORM/Mongoose adapter), generate module/controller/service triads |
| Fastify | lighter alternative to the Express generator, same DB/AI plumbing |
| Django / Flask | `usesNpmInit: false`, mirror the FastAPI generator's DB branching |
| Go (net/http or Gin) | `usesNpmInit: false`, write `go.mod` + `main.go`, own DB template set (`database/sql` + driver) |
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
