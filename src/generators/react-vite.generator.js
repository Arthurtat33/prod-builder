import inquirer from "inquirer";
import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";

export class ReactViteGenerator extends BaseGenerator {
  static id = "react-vite";
  static label = "React (Vite)";
  static category = "frontend";
  static supportsTypeScript = true;

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
    const { pm, useTypeScript, installDevDeps } = this.context;
    this.context.pmService.install(pm, ["react", "react-dom", "vite"]);
    if (useTypeScript) {
      this.context.pmService.install(pm, ["typescript", "@types/react", "@types/react-dom"], { dev: true });
    }
    if (installDevDeps) {
      this.context.pmService.install(pm, ["eslint", "prettier", "husky", "lint-staged"], { dev: true });
    }
  }

  async scaffold() {
    const { fs: fsService, useTypeScript, projectName } = this.context;
    const ext = useTypeScript ? "tsx" : "jsx";
    const jsExt = useTypeScript ? "ts" : "js";

    [
      "src", "src/components/layout", "src/components/sections", "src/components/UI",
      "src/hooks", "src/lib", "src/services", "src/context", "src/assets", "src/pages",
    ].forEach((f) => fsService.ensureDir(f));

    fsService.writeFile(`src/main.${ext}`, `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

    fsService.writeFile(
      "src/index.css",
      `body { margin: 0; font-family: Arial, sans-serif; background: #f5f7fa; }
h1 { color: #2d3436; }
footer { text-align: center; padding: 20px; font-size: 0.9em; color: #555; }
`
    );

    fsService.writeFile(`src/App.${ext}`, `import Navbar from "./components/UI/Navbar";
import Footer from "./components/UI/Footer";
import Sidebar from "./components/UI/Sidebar";
import HeroSection from "./components/sections/HeroSection";

export default function App() {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <HeroSection />
      <Footer />
    </div>
  );
}
${contactFooter()}
`);

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

    ["Navbar", "Footer", "Sidebar", "Modal", "Alert", "Button", "Card"].forEach((name) => {
      fsService.writeFile(`src/components/UI/${name}.${ext}`, `export default function ${name}() {
  return <div>${name} component</div>;
}
${contactFooter()}
`);
    });

    fsService.writeFile(`src/components/layout/Header.${ext}`, `export default function Header() {
  return <header>Header</header>;
}
${contactFooter()}
`);

    fsService.writeFile(`src/components/sections/HeroSection.${ext}`, `export default function HeroSection() {
  return <section>Hero Section</section>;
}
${contactFooter()}
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
              strict: true,
            },
            include: ["src"],
          },
          null,
          2
        )
      );
    }
  }

  folderTree() {
    return "src/{components/{layout,sections,UI},hooks,lib,services,context,pages}, index.html";
  }
}
