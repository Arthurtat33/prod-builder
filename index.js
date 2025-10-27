#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import inquirer from "inquirer";
import chalk from "chalk";

const CONTACTS = {
  email: "tatchouarthur@gmail.com",
  portfolio: "https://artdev-portofolio.netlify.app",
  linkedin: "https://www.linkedin.com/in/arthur-tatchou-587ba92a9",
  github: "https://github.com/Arthurtat33",
  whatsapp: "+237652949715",
};

const CONTACT_FOOTER = ` /*

👤 Created by Artdev 
📧 Email: ${CONTACTS.email}
🌐 Portfolio: ${CONTACTS.portfolio}
🔗 LinkedIn: ${CONTACTS.linkedin} 
💻 GitHub: ${CONTACTS.github} 
📱 WhatsApp: ${CONTACTS.whatsapp}

*/ `;

async function main() {
  console.clear();
  console.log(chalk.cyan.bold("🚀 Ultimate Project Wizard\n"));

  const { projectType } = await inquirer.prompt([
    {
      name: "projectType",
      type: "list",
      message: "📂 Choose a project type:",
      choices: ["React", "Node.js", "Express", "Vanilla HTML/CSS/JS", "Custom (Manual)"],
    },
  ]);

  const { projectName } = await inquirer.prompt([
    {
      name: "projectName",
      type: "input",
      message: "📁 Project folder name:",
      default: "my-project"
    },
  ]);

  const projectPath = path.join(process.cwd(), projectName);
  if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath);
  process.chdir(projectPath);

  console.log(chalk.green(`\n📦 Creating ${projectType} project: ${projectName}\n`));

  switch (projectType) {
    case "React": await generateReactTemplate();
      break;
    case "Node.js": await generateNodeTemplate();
      break;
    case "Express": await generateExpressTemplate();
      break;
    case "Vanilla HTML/CSS/JS": await generateVanillaTemplate();
      break;
    default: await generateCustomStructure();
      break;
  }


  generateReadme(projectType, projectName);
  await initGitRepo();

  console.log(chalk.green.bold(`\n✅ Project "${projectName}" created successfully!`));
  console.log(chalk.yellow(`📌 Tip: cd ${projectName} && git log to see your first commit.`));
}

// ---------- TEMPLATE GENERATORS ----------

// ---------- REACT TEMPLATE GENERATOR ---------- 
async function generateReactTemplate() {
  execSync("npm init -y", { stdio: "inherit" });

  const { installDeps } = await inquirer.prompt([
    {
      name: "installDeps",
      type: "confirm",
      message: "📦 Install React + Vite dependencies?",
      default: true
    },
  ]);

  if (installDeps) execSync("npm install react react-dom vite", { stdio: "inherit" });

  const { installDevDeps } = await inquirer.prompt([
    {
      name: "installDevDeps",
      type: "confirm",
      message: "🔧 Install devDependencies (ESLint, Prettier, Husky)?",
      default: false
    },
  ]);

  if (installDevDeps) execSync("npm install -D eslint prettier husky lint-staged", { stdio: "inherit" });

  // Folder structure
  const folders = [
    "src",
    "src/components/layout",
    "src/components/sections",
    "src/components/UI",
    "src/hooks",
    "src/lib",
    "src/services",
    "src/context",
    "src/assets",
    "src/pages"
  ];
  folders.forEach(f => fs.mkdirSync(f, { recursive: true }));

  // src/main.jsx 
  fs.writeFileSync("src/main.jsx",
    `import React from "react";
     import ReactDOM from "react-dom/client";
     import App from "./App";
     import "./index.css";

     ReactDOM.createRoot(document.getElementById("root")).render(
     <React.StrictMode> <App /> </React.StrictMode>); 
    `);

  // src/index.css 
  fs.writeFileSync("src/index.css",
    `body { margin: 0; font-family: Arial, sans-serif; background: #f5f7fa; } 
     h1 { color: #2d3436; }
     footer { text-align: center; padding: 20px; font-size: 0.9em; color: #555; }`);

  // src/App.jsx
  fs.writeFileSync("src/App.jsx",
    `import Navbar from "./components/UI/Navbar";
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
        </div>); 
     } 
        ${CONTACT_FOOTER} `);

  // src/context/authContext.js

  fs.writeFileSync("src/context/AuthContext.js",
    `import { createContext, useState } from "react";

     export const AuthContext = createContext();

     export function AuthProvider({ children }) {
      const [user, setUser] = useState(null);
      return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>; 
     }
      ${CONTACT_FOOTER} `);

  // src/lib/utils.js 
  fs.writeFileSync("src/lib/utils.js",
    `export function formatDate(date) { 
    return new Date(date).toLocaleDateString();
    }
    ${CONTACT_FOOTER}
  `);

  // src/services/api.js 
  fs.writeFileSync("src/services/api.js",
    `export async function fetchData(url) {
     const res = await fetch(url);
      return res.json(); 
      }
       ${CONTACT_FOOTER}`);

  // src/hooks/useMobile.jsx 
  fs.writeFileSync("src/hooks/useMobile.jsx",
    `import { useState, useEffect } from "react";
     export default function useMobile() {
     const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
     useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize); 
      }, []); 
      return isMobile; 
     }
      ${CONTACT_FOOTER}`);

  // src/hooks/useToast.jsx 
  fs.writeFileSync("src/hooks/useToast.jsx",
    `import { useState } from "react";
     export default function useToast() { 
      const [message, setMessage] = useState("");
      const showToast = msg => setMessage(msg);
      const hideToast = () => setMessage("");
      return { message, showToast, hideToast }; 
    }
    ${CONTACT_FOOTER}`);

  // Components UI
  const uiComponents = ["Navbar", "Footer", "Sidebar", "Modal", "Alert", "Button", "Card"];
  uiComponents.forEach(name => {

    fs.writeFileSync(`src/components/UI/${name}.jsx`,
      `export default function ${name}() {
        return <div>${name} component</div>;
      } 
     ${CONTACT_FOOTER}`);
  });

  // Components layout
  fs.writeFileSync("src/components/layout/Header.jsx",
    `export default function Header() {
      return <header>Header</header>; 
     } 
    ${CONTACT_FOOTER}`);

  // Components sections 
  fs.writeFileSync("src/components/sections/HeroSection.jsx",
    `export default function HeroSection() {
      return <section>Hero Section</section>; 
     } 
    ${CONTACT_FOOTER}`);

  // index.html 
  fs.writeFileSync("index.html",
    `<DOCTYPE html >
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${path.basename(process.cwd())}</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="./src/main.jsx"></script>
      </body>
    </html>`);
}

async function generateNodeTemplate() {
  execSync("npm init -y", { stdio: "inherit" });

  const { installDeps } = await inquirer.prompt([
    {
      name: "installDeps",
      type: "confirm",
      message: "📦 Install recommended Node.js packages (dotenv, nodemon)?",
      default: false
    },
  ]);

  if (installDeps) {
    execSync("npm install dotenv nodemon", { stdio: "inherit" });
  }

  const { installDevDeps } = await inquirer.prompt([
    {
      name: "installDevDeps",
      type: "confirm",
      message: "🔧 Install devDependencies (ESLint, Prettier)?",
      default: false
    },
  ]);

  if (installDevDeps) {
    execSync("npm install -D eslint prettier", { stdio: "inherit" });
  }

  fs.mkdirSync("src", { recursive: true });
  fs.writeFileSync("src/index.js", `
  console.log("🚀 ${path.basename(process.cwd())} Node.js app running!");
  console.log("Visit: ${CONTACTS.portfolio} for more projects!"); ${CONTACT_FOOTER} `
  );
}

async function generateExpressTemplate() {
  execSync("npm init -y", { stdio: "inherit" });

  const { installDeps } = await inquirer.prompt([
    {
      name: "installDeps",
      type: "confirm",
      message: "📦 Install Express + middleware packages?",
      default: true
    },
  ]);

  if (installDeps) {
    execSync("npm install express cors dotenv", { stdio: "inherit" });
  }

  const { installDevDeps } = await inquirer.prompt([
    {
      name: "installDevDeps",
      type: "confirm",
      message: "🔧 Install devDependencies (ESLint, Prettier)?",
      default: false
    },
  ]);
  if (installDevDeps) {
    execSync("npm install -D eslint prettier", { stdio: "inherit" });
  }

    // Folder structure
  const folders = [
    "src",
    "src/controllers",
    "src/utils",
    "src/config",
    "src/uploads",
    "src/routes",
    "src/models",
    "src/middlewares"
  ];
  folders.forEach(f => fs.mkdirSync(f, { recursive: true }));

  // src/.env 
  fs.writeFileSync("src/.env",`//--------Your environments variables here--------\nMONGO_URL=your-mongodb-url`);
  // src/.controllers/index.js

  const indexFolders = [
    "src/controllers",
    "src/utils",
    "src/config",
    "src/routes",
    "src/models",
    "src/middlewares"
  ]
  indexFolders.forEach(f =>  fs.writeFileSync(`${f}/index.js`,`//--------Your ${f} code here--------`));

  // src/config/db.js
  fs.writeFileSync("src/config/db.js",`//--------Your db code here--------`);

  fs.writeFileSync("server.js", `
  import express from "express";
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get("/", (req, res) => {
    res.send(`+ "`" + `

      < h1 >🚀 Welcome to ${path.basename(process.cwd())}</h1 >
    <p>This is a professional Express server template.</p>
    <footer style="margin-top:20px;">Powered by <a href="${CONTACTS.portfolio}">Artdev</a></footer>
    ` + "`" + `);
    });
  app.listen(PORT, () => console.log("✅ Server running at http://localhost:PORT"));
  ${CONTACT_FOOTER} `);
}

async function generateVanillaTemplate() {
  fs.mkdirSync("css", { recursive: true });
  fs.mkdirSync("js", { recursive: true });

  fs.writeFileSync("index.html", `
    <!DOCTYPE html >
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${path.basename(process.cwd())}</title>
          <link rel="stylesheet" href="./css/style.css" />
        </head>
        <body>
          <h1>🚀 Welcome to ${path.basename(process.cwd())}</h1>
          <p>This is a professional Vanilla HTML/CSS/JS starter project.</p>
          <footer>Powered by <a href="${CONTACTS.portfolio}">Artdev</a></footer>
          <script src="./js/main.js"></script>
        </body>
      </html>`);

  fs.writeFileSync("css/style.css", `
    body {
    font-family: Arial, sans-serif;
    text-align: center;
    background: #f5f7fa;
    padding: 50px;
  }
    footer {
    margin-top: 20px;
    font-size: 0.9em;
    color: #555;
  } `);

  fs.writeFileSync("js/main.js", `
  console.log("🚀 Vanilla JS project running!");
  console.log("Follow Artdev: ${CONTACTS.linkedin}"); ${CONTACT_FOOTER} `);
}

async function generateCustomStructure() {
  const { subCount } = await inquirer.prompt([
    {
      name: "subCount",
      type: "number",
      message: "📂 Number of subfolders:",
      default: 0
    },
  ]);

  for (let i = 0; i < subCount; i++) {
    const { subName } = await inquirer.prompt([
      {
        name: "subName",
        type: "input",
        message: `🔹 Name of subfolder ${i + 1}: `
      }
    ]);
    fs.mkdirSync(subName, { recursive: true });

    const { fileCount } = await inquirer.prompt([
      {
        name: "fileCount",
        type: "number",
        message: `📄 Number of files in ${subName}: `,
        default: 0
      }
    ]);

    for (let j = 0; j < fileCount; j++) {
      const { fileName } = await inquirer.prompt([
        {
          name: "fileName",
          type: "input",
          message: `   📄 Name of file ${j + 1} (with .js): `
        }
      ]);
      fs.writeFileSync(`${subName} /${fileName}`, `/ / ${fileName} \n${CONTACT_FOOTER} `);
    }

  }
}

function generateReadme(projectType, projectName) {
  const readme = `# ${projectName}

  ![Tech](https://img.shields.io/badge/Type-${projectType.replace(/ /g, "_")}-brightgreen)

🚀 About

This is a ${projectType} project scaffolded with the Ultimate Project Wizard.

📦 Installation

  \`\`\`
    bash 
    cd ${projectName}
    npm install
    # if applicable
    \`\`\`

🏃 Usage

    React / Vanilla: Open\`index.html\` in browser or use Vite / Parcel.

    Node.js: Run\`node src / index.js\`.

    Express: Run \`node src / server.js\` and visit http://localhost:3000.

📁 Project Structure

    \`\`\`
     ${projectType}
     Project 
     ├── src / 
     │   ├── components / (React) 
     │   ├── hooks / (React) 
     │   ├── pages / (React) 
     │   ├── server.js(Express) 
     │   └── index.js(Node) └── README.md
     \`\`\`

👤 Author

  Artdev

📧 Email: ${CONTACTS.email}

🌐 Portfolio: ${CONTACTS.portfolio}

🔗 LinkedIn: ${CONTACTS.linkedin}

💻 GitHub: ${CONTACTS.github}

📱 WhatsApp: ${CONTACTS.whatsapp}

  ---

  ${CONTACT_FOOTER} `;
  fs.writeFileSync("README.md", readme);
}

async function initGitRepo() {
  try {
    execSync("git init", { stdio: "ignore" });
    execSync("git add .", { stdio: "ignore" });
    execSync('git commit -m "🚀 Initial project setup"', { stdio: "ignore" });
    console.log(chalk.blue("📚 Git repository initialized & first commit created."));
  } catch (error) {
    console.log(chalk.red("⚠️ Failed to initialize Git. Please install Git and try again."));
  }
}

main();