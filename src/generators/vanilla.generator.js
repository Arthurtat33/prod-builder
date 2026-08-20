import { BaseGenerator } from "./base/BaseGenerator.js";
import { CONTACTS } from "../utils/contact.js";

export class VanillaGenerator extends BaseGenerator {
  static id = "vanilla";
  static label = "Vanilla HTML/CSS/JS";
  static category = "frontend";
  static usesNpmInit = false;

  async install() {}

  async scaffold() {
    const { fs: fsService, projectName } = this.context;
    fsService.ensureDir("css");
    fsService.ensureDir("js");

    fsService.writeFile("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="./css/style.css" />
  </head>
  <body>
    <h1>\ud83d\ude80 Welcome to ${projectName}</h1>
    <p>This is a professional Vanilla HTML/CSS/JS starter project.</p>
    <footer>Powered by <a href="${CONTACTS.portfolio}">Artdev</a></footer>
    <script src="./js/main.js"></script>
  </body>
</html>
`);

    fsService.writeFile("css/style.css", `body {
  font-family: Arial, sans-serif;
  text-align: center;
  background: #f5f7fa;
  padding: 50px;
}
footer {
  margin-top: 20px;
  font-size: 0.9em;
  color: #555;
}
`);

    fsService.writeFile("js/main.js", `console.log("\ud83d\ude80 Vanilla JS project running!");
console.log("Follow Artdev: ${CONTACTS.linkedin}");
`);
  }

  folderTree() {
    return "index.html, css/style.css, js/main.js";
  }
}
