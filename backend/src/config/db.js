const path = require("path");
const { Pool } = require("pg");

// The .env lives at the repo root, next to docker-compose.yml — a bare
// dotenv.config() only looks in the backend folder and silently falls back to
// the defaults below. Missing file is a no-op, and real env vars still win, so
// this is safe in Docker where compose supplies them.
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "..", ".env"),
});

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "beauty_parlour_db",
  user: process.env.DB_USER || "beauty_user",
  password: process.env.DB_PASSWORD || "beauty",
});

module.exports = pool;
