const path = require("path");
const { spawnSync } = require("child_process");

require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Usage: node scripts/run-psql.js <sql-file>");
  process.exit(1);
}

const host = process.env.DB_HOST || "127.0.0.1";
const port = process.env.DB_PORT || "5432";
const database = process.env.DB_NAME || "beauty_parlour_db";
const user = process.env.DB_USER || "beauty_user";
const password = process.env.DB_PASSWORD || "beauty";

const result = spawnSync(
  "psql",
  ["-h", host, "-p", port, "-U", user, "-d", database, "-f", sqlFile],
  {
    stdio: "inherit",
    env: { ...process.env, PGPASSWORD: password },
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
