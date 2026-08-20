import { BaseGenerator } from "./base/BaseGenerator.js";
import { contactFooter } from "../utils/contact.js";

// Demonstrates the plugin pattern working for a non-Node language: no
// npm/pip install call happens here (Python deps just land in
// requirements.txt), but database/AI support follow the same shape as the
// Node generators.
export class PythonFastAPIGenerator extends BaseGenerator {
  static id = "python-fastapi";
  static label = "Python (FastAPI)";
  static category = "backend";
  static usesNpmInit = false;
  static supportsDatabase = true;
  static supportsProjectAI = true;

  async install() {
    this.context.log.info(
      "\u2139\ufe0f Python deps are listed in requirements.txt \u2014 run `pip install -r requirements.txt` after scaffolding."
    );
  }

  async scaffold() {
    const { fs: fsService, projectName, database, projectAI } = this.context;

    ["app/routers", "app/models", "app/services", "app/core"].forEach((f) => fsService.ensureDir(f));

    const requirements = ["fastapi", "uvicorn[standard]", "pydantic", "python-dotenv"];
    const routerImports = ["from app.routers import health"];
    const routerIncludes = ["app.include_router(health.router)"];

    fsService.writeFile("app/routers/health.py", `from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check():
    return {"status": "ok"}
`);

    // --- Database ---
    if (database === "mongodb") {
      requirements.push("motor", "pydantic[email]");
      fsService.writeFile("app/core/database.py", `import os
import motor.motor_asyncio

client = motor.motor_asyncio.AsyncIOMotorClient(
    os.getenv("MONGO_URL", "mongodb://localhost:27017")
)
db = client.get_default_database()
`);
      fsService.writeFile("app/models/user.py", `from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
`);
      fsService.writeFile("app/routers/users.py", `from fastapi import APIRouter
from app.core.database import db
from app.models.user import UserCreate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
async def list_users():
    users = await db["users"].find().to_list(100)
    for u in users:
        u["_id"] = str(u["_id"])
    return users


@router.post("/")
async def create_user(user: UserCreate):
    result = await db["users"].insert_one(user.dict())
    return {"id": str(result.inserted_id), **user.dict()}
`);
      routerImports.push("from app.routers import users");
      routerIncludes.push("app.include_router(users.router)");
    } else if (database === "postgres" || database === "mysql") {
      requirements.push("sqlalchemy", database === "postgres" ? "psycopg2-binary" : "pymysql");
      const defaultUrl =
        database === "postgres"
          ? "postgresql://user:password@localhost:5432/mydb"
          : "mysql+pymysql://user:password@localhost:3306/mydb";

      fsService.writeFile("app/core/database.py", `import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "${defaultUrl}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`);
      fsService.writeFile("app/models/user.py", `from sqlalchemy import Column, Integer, String
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
`);
      fsService.writeFile("app/routers/users.py", `from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.database import get_db, Base, engine
from app.models.user import User

Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    name: str
    email: EmailStr


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("/")
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(**payload.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
`);
      routerImports.push("from app.routers import users");
      routerIncludes.push("app.include_router(users.router)");
    } else {
      fsService.writeFile("app/core/database.py", "# No database selected \u2014 wire one up here when you're ready.\n");
    }

    // --- Baked-in AI feature ---
    if (projectAI) {
      requirements.push("anthropic");
      fsService.writeFile("app/services/ai_service.py", `import os
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
# Model IDs change over time \u2014 check https://docs.claude.com for the current lineup.
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")


def ask_claude(prompt: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in response.content if block.type == "text")
`);
      fsService.writeFile("app/routers/ai.py", `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import ask_claude

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    prompt: str


@router.post("/chat")
def chat(payload: ChatRequest):
    try:
        return {"reply": ask_claude(payload.prompt)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
`);
      routerImports.push("from app.routers import ai");
      routerIncludes.push("app.include_router(ai.router)");
    }

    fsService.writeFile("requirements.txt", `${requirements.join("\n")}\n`);

    fsService.writeFile("app/main.py", `from fastapi import FastAPI
${routerImports.join("\n")}

app = FastAPI(title="${projectName}")

${routerIncludes.join("\n")}


@app.get("/")
def root():
    return {"message": "\ud83d\ude80 Welcome to ${projectName}"}
`);

    ["app/__init__.py", "app/routers/__init__.py", "app/models/__init__.py", "app/services/__init__.py", "app/core/__init__.py"].forEach(
      (f) => fsService.writeFile(f, "")
    );

    let envContent = "APP_ENV=development\n";
    if (database === "mongodb") envContent += "MONGO_URL=mongodb://localhost:27017/mydb\n";
    if (database === "postgres") envContent += "DATABASE_URL=postgresql://user:password@localhost:5432/mydb\n";
    if (database === "mysql") envContent += "DATABASE_URL=mysql+pymysql://user:password@localhost:3306/mydb\n";
    if (projectAI) envContent += "ANTHROPIC_API_KEY=\nANTHROPIC_MODEL=claude-sonnet-5\n";
    fsService.writeFile(".env.example", envContent);

    fsService.writeFile("run.sh", "#!/usr/bin/env bash\nuvicorn app.main:app --reload\n");
    fsService.writeFile("CONTACT.md", contactFooter("python"));
  }

  folderTree() {
    return "app/{routers,models,services,core}, main.py, requirements.txt";
  }
}
