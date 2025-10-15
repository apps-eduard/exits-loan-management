const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  dir: "src/migrations",
  migrationsTable: "app_migrations",
  verbose: process.env.NODE_ENV !== "production",
};
