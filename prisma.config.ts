import { defineConfig } from "prisma/config";

// Prisma 7 moved connection config out of schema.prisma into this file.
// CLI commands (migrate/db push/seed) use `datasource.url` from here.
// The application runtime connects via the driver adapter in lib/prisma.ts.
// We read process.env directly (instead of the throwing `env()` helper) so that
// `prisma generate` works before env vars are provisioned. CLI db commands are
// run via `dotenv -e .env.local -- ...` which populates these vars.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
