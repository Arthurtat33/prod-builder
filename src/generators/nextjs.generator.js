import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";
import { getNodeDbTemplate } from "../services/databaseTemplates.js";

export class NextJsGenerator extends BaseGenerator {
  static id = "nextjs";
  static label = "Next.js";
  static category = "fullstack";
  static supportsTypeScript = true;
  static supportsDatabase = true;
  static supportsProjectAI = true;
  static supportsRenderMode = true;
  static renderModeChoices = [
    { name: "SSR \u2014 dynamic, rendered per request", value: "ssr" },
    { name: "SSG \u2014 pre-rendered at build time", value: "ssg" },
  ];

  async install() {
    const { pm, useTypeScript, database, projectAI } = this.context;
    const deps = ["next", "react", "react-dom"];

    if (database !== "none") deps.push(...getNodeDbTemplate(database).deps);
    if (projectAI) deps.push("@anthropic-ai/sdk");

    this.context.pmService.install(pm, deps);
    if (useTypeScript) {
      this.context.pmService.install(pm, ["typescript", "@types/react", "@types/node"], { dev: true });
    }
  }

  async scaffold() {
    const { fs: fsService, projectName, useTypeScript, renderMode, database, projectAI } = this.context;
    const ext = useTypeScript ? "tsx" : "jsx";
    const jsExt = useTypeScript ? "ts" : "js";

    ["app", "components", "lib"].forEach((f) => fsService.ensureDir(f));

    fsService.writeFile(`app/layout.${ext}`, `export const metadata = {
  title: "${projectName}",
  description: "Built with prod-builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);

    fsService.writeFile(`app/page.${ext}`, `export default function Home() {
  return (
    <main>
      <h1>\ud83d\ude80 Welcome to ${projectName}</h1>
      <p>Rendering mode: ${renderMode.toUpperCase()}</p>
    </main>
  );
}
${contactFooter()}
`);

    // --- Render mode demo route, so the SSR/SSG choice is actually visible ---
    if (renderMode === "ssr") {
      fsService.ensureDir("app/dashboard");
      fsService.writeFile(`app/dashboard/page.${ext}`, `// Forces this route to render on every request instead of being cached.
export const dynamic = "force-dynamic";

async function getData() {
  // Swap for a real fetch/DB call \u2014 this is just proving SSR is live.
  return { generatedAt: new Date().toISOString() };
}

export default async function Dashboard() {
  const data = await getData();
  return (
    <main>
      <h1>Dashboard (SSR)</h1>
      <p>Rendered at: {data.generatedAt}</p>
    </main>
  );
}
`);
    } else {
      fsService.ensureDir("app/posts/[id]");
      fsService.writeFile(`app/posts/[id]/page.${ext}`, `// Pre-renders these params at build time; revalidates hourly.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function Post({ params }) {
  return (
    <main>
      <h1>Post #{params.id} (SSG)</h1>
      <p>This page was pre-rendered at build time.</p>
    </main>
  );
}
`);
    }

    // --- Database (reuses the same templates as Express, adapted to App Router route handlers) ---
    if (database !== "none") {
      fsService.ensureDir("lib/models");
      const tpl = getNodeDbTemplate(database, { dbImportPath: "../db.js" });
      fsService.writeFile(`lib/db.${jsExt}`, tpl.configFile);
      fsService.writeFile(`lib/models/user.${jsExt}`, tpl.modelFile);

      fsService.ensureDir("app/api/users");
      if (database === "mongodb") {
        fsService.writeFile(`app/api/users/route.${jsExt}`, `import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import User from "../../../lib/models/user";

export async function GET() {
  await connectDB();
  return NextResponse.json(await User.find());
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const user = await User.create(body);
  return NextResponse.json(user, { status: 201 });
}
`);
      } else {
        fsService.writeFile(`app/api/users/route.${jsExt}`, `import { NextResponse } from "next/server";
import { ensureUsersTable, findAllUsers, insertUser } from "../../../lib/models/user";

export async function GET() {
  await ensureUsersTable();
  return NextResponse.json(await findAllUsers());
}

export async function POST(req) {
  await ensureUsersTable();
  const body = await req.json();
  const user = await insertUser(body);
  return NextResponse.json(user, { status: 201 });
}
`);
      }
    }

    // --- Baked-in AI feature ---
    if (projectAI) {
      fsService.ensureDir("app/api/ai");
      fsService.writeFile(`app/api/ai/route.${jsExt}`, `import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// Model IDs change over time \u2014 check https://docs.claude.com for the current lineup.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export async function POST(req) {
  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const reply = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\\n");
  return NextResponse.json({ reply });
}
`);
    }

    // --- .env.local (Next's convention) for anything that needs secrets ---
    let envContent = "";
    if (database !== "none") envContent += `${getNodeDbTemplate(database).envLine}\n`;
    if (projectAI) envContent += "ANTHROPIC_API_KEY=\nANTHROPIC_MODEL=claude-sonnet-5\n";
    if (envContent) fsService.writeFile(".env.local", envContent);

    fsService.writeFile("next.config.js", `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`);

    if (useTypeScript) {
      fsService.writeFile(
        "tsconfig.json",
        JSON.stringify(
          {
            compilerOptions: {
              target: "ES2020",
              lib: ["dom", "dom.iterable", "esnext"],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: "esnext",
              moduleResolution: "bundler",
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: "preserve",
              incremental: true,
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
            exclude: ["node_modules"],
          },
          null,
          2
        )
      );
    }
  }

  folderTree() {
    return "app/{layout,page,api/}, components/, lib/";
  }
}
