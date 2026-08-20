import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";

export class NextJsGenerator extends BaseGenerator {
  static id = "nextjs";
  static label = "Next.js";
  static category = "fullstack";
  static supportsTypeScript = true;

  async install() {
    const { pm, useTypeScript } = this.context;
    this.context.pmService.install(pm, ["next", "react", "react-dom"]);
    if (useTypeScript) {
      this.context.pmService.install(pm, ["typescript", "@types/react", "@types/node"], { dev: true });
    }
  }

  async scaffold() {
    const { fs: fsService, projectName, useTypeScript } = this.context;
    const ext = useTypeScript ? "tsx" : "jsx";

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
    </main>
  );
}
${contactFooter()}
`);

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
    return "app/{layout,page}, components/, lib/";
  }
}
