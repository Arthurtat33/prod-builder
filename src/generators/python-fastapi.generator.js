import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";

// Demonstrates the plugin pattern working for a non-Node language.
// Adding Django/Flask/Go/Rust later is the same shape: no npm/pip install
// call, just write files that match that ecosystem's conventions.
export class PythonFastAPIGenerator extends BaseGenerator {
  static id = "python-fastapi";
  static label = "Python (FastAPI)";
  static category = "backend";
  static usesNpmInit = false;

  async install() {
    this.context.log.info(
      "\u2139\ufe0f Python deps are listed in requirements.txt \u2014 run `pip install -r requirements.txt` after scaffolding."
    );
  }

  async scaffold() {
    const { fs: fsService, projectName } = this.context;

    ["app/routers", "app/models", "app/services", "app/core"].forEach((f) => fsService.ensureDir(f));

    fsService.writeFile("requirements.txt", "fastapi\nuvicorn[standard]\npydantic\npython-dotenv\n");

    fsService.writeFile("app/main.py", `from fastapi import FastAPI
from app.routers import health

app = FastAPI(title="${projectName}")

app.include_router(health.router)


@app.get("/")
def root():
    return {"message": "\ud83d\ude80 Welcome to ${projectName}"}
`);

    fsService.writeFile("app/routers/health.py", `from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check():
    return {"status": "ok"}
`);

    ["app/__init__.py", "app/routers/__init__.py", "app/models/__init__.py", "app/services/__init__.py", "app/core/__init__.py"].forEach(
      (f) => fsService.writeFile(f, "")
    );

    fsService.writeFile(".env.example", "APP_ENV=development\n");

    fsService.writeFile("run.sh", `#!/usr/bin/env bash
uvicorn app.main:app --reload
`);

    fsService.writeFile("CONTACT.md", contactFooter("python"));
  }

  folderTree() {
    return "app/{routers,models,services,core}, main.py, requirements.txt";
  }
}
