// Shared Node-ecosystem DB templates, reused by the Express and Next.js
// generators so "add MongoDB/Postgres/MySQL" behaves identically everywhere.
//
// dbImportPath lets each generator control the relative import path from
// the model file back to the db config file, since folder layout differs
// between Express (src/models -> ../config/db.js) and Next.js
// (lib/models -> ../db.js).
export function getNodeDbTemplate(db, { dbImportPath = "../config/db.js" } = {}) {
  const templates = {
    mongodb: {
      deps: ["mongoose"],
      envLine: "MONGO_URL=mongodb://localhost:27017/mydb",
      configFile: `import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("\u2705 MongoDB connected");
  } catch (err) {
    console.error("\u274c MongoDB connection error:", err.message);
    process.exit(1);
  }
}
`,
      modelFile: `import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
`,
      controllerFile: `import User from "../models/user.model.js";

export async function listUsers(req, res) {
  const users = await User.find();
  res.json(users);
}

export async function createUser(req, res) {
  const user = await User.create(req.body);
  res.status(201).json(user);
}
`,
    },

    postgres: {
      deps: ["pg"],
      envLine: "DATABASE_URL=postgres://user:password@localhost:5432/mydb",
      configFile: `import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function connectDB() {
  try {
    await pool.query("SELECT 1");
    console.log("\u2705 PostgreSQL connected");
  } catch (err) {
    console.error("\u274c PostgreSQL connection error:", err.message);
    process.exit(1);
  }
}
`,
      modelFile: `import { pool } from "${dbImportPath}";

export async function ensureUsersTable() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  \`);
}

export async function findAllUsers() {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY id DESC");
  return rows;
}

export async function insertUser({ name, email }) {
  const { rows } = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );
  return rows[0];
}
`,
      controllerFile: `import { ensureUsersTable, findAllUsers, insertUser } from "../models/user.model.js";

export async function listUsers(req, res) {
  await ensureUsersTable();
  res.json(await findAllUsers());
}

export async function createUser(req, res) {
  await ensureUsersTable();
  const user = await insertUser(req.body);
  res.status(201).json(user);
}
`,
    },

    mysql: {
      deps: ["mysql2"],
      envLine: "DATABASE_URL=mysql://user:password@localhost:3306/mydb",
      configFile: `import mysql from "mysql2/promise";

export const pool = mysql.createPool(process.env.DATABASE_URL);

export async function connectDB() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("\u2705 MySQL connected");
  } catch (err) {
    console.error("\u274c MySQL connection error:", err.message);
    process.exit(1);
  }
}
`,
      modelFile: `import { pool } from "${dbImportPath}";

export async function ensureUsersTable() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  \`);
}

export async function findAllUsers() {
  const [rows] = await pool.query("SELECT * FROM users ORDER BY id DESC");
  return rows;
}

export async function insertUser({ name, email }) {
  const [result] = await pool.query("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
  return { id: result.insertId, name, email };
}
`,
      controllerFile: `import { ensureUsersTable, findAllUsers, insertUser } from "../models/user.model.js";

export async function listUsers(req, res) {
  await ensureUsersTable();
  res.json(await findAllUsers());
}

export async function createUser(req, res) {
  await ensureUsersTable();
  const user = await insertUser(req.body);
  res.status(201).json(user);
}
`,
    },
  };

  return templates[db] || null;
}
