import inquirer from "inquirer";
import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter, CONTACTS } from "../utils/contact.js";

export class ReactViteGenerator extends BaseGenerator {
  static id = "react-vite";
  static label = "React (Vite)";
  static category = "frontend";
  static supportsTypeScript = true;
  static supportsRenderMode = true;
  // Pure frontend components shouldn't hold DB credentials directly \u2014 in SSR
  // mode the Node server should call a backend API (e.g. the Express
  // generator) rather than talk to a database itself, so no supportsDatabase here.

  async prompts() {
    const { installDevDeps } = await inquirer.prompt([
      {
        name: "installDevDeps",
        type: "confirm",
        message: "\ud83d\udd27 Install devDependencies (ESLint, Prettier, Husky)?",
        default: false,
      },
    ]);
    return { installDevDeps };
  }

  async install() {
    const { pm, useTypeScript, installDevDeps, renderMode } = this.context;
    this.context.pmService.install(pm, ["react", "react-dom", "react-router-dom"]);
    this.context.pmService.install(pm, ["vite", "@vitejs/plugin-react"], { dev: true });

    if (renderMode === "ssr") {
      this.context.pmService.install(pm, ["express"]);
    }
    if (useTypeScript) {
      this.context.pmService.install(pm, ["typescript", "@types/react", "@types/react-dom"], { dev: true });
    }
    if (installDevDeps) {
      this.context.pmService.install(pm, ["eslint", "prettier", "husky", "lint-staged"], { dev: true });
    }
  }

  async scaffold() {
    const { fs: fsService, useTypeScript, renderMode, projectName } = this.context;
    const ext = useTypeScript ? "tsx" : "jsx";
    const jsExt = useTypeScript ? "ts" : "js";

    [
      "src", "src/components/layout", "src/components/sections", "src/components/UI",
      "src/hooks", "src/lib", "src/services", "src/context", "src/assets", "src/pages", "src/routes",
    ].forEach((f) => fsService.ensureDir(f));

    this.writeSharedApp({ fsService, ext, jsExt, projectName });
    this.writeStyledComponents({ fsService, ext, projectName });

    if (renderMode === "csr") this.scaffoldCSR({ fsService, ext, projectName });
    else if (renderMode === "ssr") this.scaffoldSSR({ fsService, ext, projectName });
    else this.scaffoldSSG({ fsService, ext, projectName });

    fsService.writeFile("vite.config.js", `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`);

    if (useTypeScript) {
      fsService.writeFile(
        "tsconfig.json",
        JSON.stringify(
          {
            compilerOptions: {
              target: "ES2020",
              useDefineForClassFields: true,
              lib: ["ES2020", "DOM", "DOM.Iterable"],
              module: "ESNext",
              skipLibCheck: true,
              moduleResolution: "bundler",
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: "react-jsx",
              // Kept loose on purpose so this starter builds immediately with
              // the untyped prop components below \u2014 tighten as the project matures.
              strict: false,
            },
            include: ["src"],
          },
          null,
          2
        )
      );
    }
  }

  // --- App shell shared by every render mode: routes, pages, context wiring ---
  writeSharedApp({ fsService, ext, jsExt, projectName }) {
    fsService.writeFile(
      "src/index.css",
      `body { margin: 0; font-family: Arial, sans-serif; background: #f5f7fa; color: #2d3436; }
h1, h2, h3 { color: #2d3436; }
a { color: #6c5ce7; text-decoration: none; }

.navbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.navbar__brand { font-weight: 700; font-size: 1.1rem; }
.navbar__links { display: flex; gap: 16px; }
.navbar__links a.active { color: #6c5ce7; font-weight: 600; }
.navbar--mobile .navbar__links { gap: 10px; font-size: 0.9rem; }

.hero { text-align: center; padding: 80px 24px; }
.hero p { color: #555; margin-bottom: 24px; }

.page { max-width: 800px; margin: 0 auto; padding: 40px 24px; }

.sidebar { width: 200px; padding: 16px; background: #fff; }
.sidebar ul { list-style: none; padding: 0; margin: 0; }
.sidebar li { padding: 8px 0; color: #555; }

.card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card__title { margin-top: 0; }

.btn { border: none; border-radius: 8px; padding: 10px 20px; font-size: 0.95rem; cursor: pointer; }
.btn--primary { background: #6c5ce7; color: #fff; }
.btn--secondary { background: #eee; color: #2d3436; }

.alert { padding: 12px 16px; border-radius: 8px; margin: 12px 0; }
.alert--info { background: #e8f0ff; color: #2d3480; }
.alert--success { background: #e6f9ee; color: #17794a; }
.alert--error { background: #fdeaea; color: #a52424; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
.modal { background: #fff; border-radius: 10px; padding: 24px; min-width: 300px; }

footer.footer { text-align: center; padding: 24px; font-size: 0.9em; color: #555; }
`
    );

    fsService.writeFile(`src/context/AuthContext.${ext}`, `import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}
${contactFooter()}
`);

    fsService.writeFile(`src/lib/utils.${jsExt}`, `export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
${contactFooter()}
`);

    fsService.writeFile(`src/services/api.${jsExt}`, `export async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}
${contactFooter()}
`);

    fsService.writeFile(`src/hooks/useMobile.${ext}`, `import { useState, useEffect } from "react";

export default function useMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}
${contactFooter()}
`);

    fsService.writeFile(`src/hooks/useToast.${ext}`, `import { useState } from "react";

export default function useToast() {
  const [message, setMessage] = useState("");
  const showToast = (msg) => setMessage(msg);
  const hideToast = () => setMessage("");
  return { message, showToast, hideToast };
}
${contactFooter()}
`);

    fsService.writeFile(`src/routes/AppRoutes.${ext}`, `import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
`);

    fsService.writeFile(`src/pages/Home.${ext}`, `import HeroSection from "../components/sections/HeroSection";

export default function Home() {
  return (
    <main className="page">
      <HeroSection />
    </main>
  );
}
`);

    fsService.writeFile(`src/pages/About.${ext}`, `export default function About() {
  return (
    <main className="page">
      <h1>About</h1>
      <p>This project was scaffolded with prod-builder.</p>
    </main>
  );
}
`);

    fsService.writeFile(`src/App.${ext}`, `import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/UI/Navbar";
import Footer from "./components/UI/Footer";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <AppRoutes />
      <Footer />
    </AuthProvider>
  );
}
${contactFooter()}
`);
  }

  // --- Real, styled UI components instead of placeholder divs ---
  writeStyledComponents({ fsService, ext, projectName }) {
    fsService.writeFile(`src/components/UI/Navbar.${ext}`, `import { NavLink } from "react-router-dom";
import useMobile from "../../hooks/useMobile";

export default function Navbar() {
  const isMobile = useMobile();

  return (
    <nav className={\`navbar \${isMobile ? "navbar--mobile" : ""}\`}>
      <span className="navbar__brand">${projectName}</span>
      <div className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
          About
        </NavLink>
      </div>
    </nav>
  );
}
`);

    fsService.writeFile(`src/components/UI/Footer.${ext}`, `export default function Footer() {
  return (
    <footer className="footer">
      <p>Built with prod-builder</p>
      <p>
        <a href="${CONTACTS.portfolio}" target="_blank" rel="noreferrer">Portfolio</a>
        {" \u00b7 "}
        <a href="${CONTACTS.github}" target="_blank" rel="noreferrer">GitHub</a>
      </p>
    </footer>
  );
}
`);

    fsService.writeFile(`src/components/UI/Sidebar.${ext}`, `export default function Sidebar() {
  const items = ["Dashboard", "Settings", "Profile"];
  return (
    <aside className="sidebar">
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
`);

    fsService.writeFile(`src/components/UI/Button.${ext}`, `export default function Button({ children, onClick, variant = "primary" }) {
  return (
    <button className={\`btn btn--\${variant}\`} onClick={onClick}>
      {children}
    </button>
  );
}
`);

    fsService.writeFile(`src/components/UI/Card.${ext}`, `export default function Card({ title, children }) {
  return (
    <div className="card">
      {title && <h3 className="card__title">{title}</h3>}
      <div className="card__body">{children}</div>
    </div>
  );
}
`);

    fsService.writeFile(`src/components/UI/Alert.${ext}`, `export default function Alert({ type = "info", children }) {
  return <div className={\`alert alert--\${type}\`}>{children}</div>;
}
`);

    fsService.writeFile(`src/components/UI/Modal.${ext}`, `export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
`);

    fsService.writeFile(`src/components/layout/Header.${ext}`, `export default function Header() {
  return <header>Header</header>;
}
`);

    fsService.writeFile(`src/components/sections/HeroSection.${ext}`, `import Button from "../UI/Button";

export default function HeroSection() {
  return (
    <section className="hero">
      <h1>\ud83d\ude80 Welcome to ${projectName}</h1>
      <p>Start building something great.</p>
      <Button>Get Started</Button>
    </section>
  );
}
`);
  }

  // --- CSR: plain client-side SPA ---
  scaffoldCSR({ fsService, ext, projectName }) {
    fsService.writeFile(`src/main.${ext}`, `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`);

    fsService.writeFile("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>
`);

    fsService.updateJson("package.json", (pkg) => ({
      ...pkg,
      scripts: { ...pkg.scripts, dev: "vite", build: "vite build", preview: "vite preview" },
    }));
  }

  // --- SSR: real entry-client/entry-server split + an Express SSR server ---
  scaffoldSSR({ fsService, ext, projectName }) {
    fsService.writeFile(`src/entry-client.${ext}`, `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`);

    fsService.writeFile(`src/entry-server.${ext}`, `import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";

export function render(url) {
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );
  return { html };
}
`);

    fsService.writeFile("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
    <script type="module" src="/src/entry-client.${ext}"></script>
  </body>
</html>
`);

    fsService.writeFile("server.js", `import fs from "fs";
import path from "path";
import express from "express";

const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5173;

async function createServer() {
  const app = express();
  let vite;

  if (!isProd) {
    vite = await (await import("vite")).createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist/client"), { index: false }));
  }

  app.use("*", async (req, res) => {
    const url = req.originalUrl;
    try {
      let template, render;

      if (!isProd) {
        template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/entry-server.${ext}")).render;
      } else {
        template = fs.readFileSync(path.resolve("dist/client/index.html"), "utf-8");
        render = (await import("./dist/server/entry-server.js")).render;
      }

      const { html: appHtml } = await render(url);
      const html = template.replace("<!--ssr-outlet-->", appHtml);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite?.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  app.listen(PORT, () => console.log(\`\u2705 SSR server running at http://localhost:\${PORT}\`));
}

createServer();
`);

    fsService.updateJson("package.json", (pkg) => ({
      ...pkg,
      scripts: {
        ...pkg.scripts,
        dev: "node server.js",
        "build:client": "vite build --outDir dist/client",
        "build:server": `vite build --ssr src/entry-server.${ext} --outDir dist/server`,
        build: "npm run build:client && npm run build:server",
        // On Windows, set NODE_ENV separately or use a tool like cross-env.
        start: "NODE_ENV=production node server.js",
      },
    }));
  }

  // --- SSG: same entry-server render function, called once per route at build time ---
  scaffoldSSG({ fsService, ext, projectName }) {
    fsService.writeFile(`src/entry-client.${ext}`, `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`);

    fsService.writeFile(`src/entry-server.${ext}`, `import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";

export function render(url) {
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );
  return { html };
}
`);

    fsService.writeFile("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
    <script type="module" src="/src/entry-client.${ext}"></script>
  </body>
</html>
`);

    fsService.writeFile("prerender.js", `import fs from "fs";
import path from "path";

// Add every route you want pre-rendered to static HTML at build time.
const routesToPrerender = ["/", "/about"];

async function run() {
  const { render } = await import("./dist/server/entry-server.js");
  const template = fs.readFileSync(path.resolve("dist/client/index.html"), "utf-8");

  for (const url of routesToPrerender) {
    const { html: appHtml } = await render(url);
    const html = template.replace("<!--ssr-outlet-->", appHtml);
    const filePath = url === "/" ? "dist/client/index.html" : \`dist/client\${url}/index.html\`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
    console.log(\`\u2705 Pre-rendered: \${url} -> \${filePath}\`);
  }
}

run();
`);

    fsService.updateJson("package.json", (pkg) => ({
      ...pkg,
      scripts: {
        ...pkg.scripts,
        dev: "vite",
        "build:client": "vite build --outDir dist/client",
        "build:server": `vite build --ssr src/entry-server.${ext} --outDir dist/server`,
        build: "npm run build:client && npm run build:server",
        generate: "npm run build && node prerender.js",
        // dist/client is fully static after `generate` \u2014 serve it with any static host.
        preview: "npx serve dist/client",
      },
    }));
  }

  folderTree() {
    return "src/{components,hooks,lib,services,context,pages,routes}, index.html";
  }
}
