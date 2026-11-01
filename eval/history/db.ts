// The connection to Ward's eval history on Tiger Data (Timescale Postgres). The connection string
// comes from TIGER_DATABASE_URL in ward/.env or the environment, never from the repo.

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export function connect() {
  const url = process.env.TIGER_DATABASE_URL;
  if (!url) {
    console.error("Missing TIGER_DATABASE_URL. Put the Tiger Data service's connection string in ward/.env.");
    process.exit(1);
  }
  return postgres(url, { ssl: "require", onnotice: () => {} });
}

export async function ensureSchema(sql: ReturnType<typeof connect>) {
  await sql`CREATE TABLE IF NOT EXISTS eval_metrics (
    time timestamptz NOT NULL,
    commit text NOT NULL,
    suite text NOT NULL,
    system text NOT NULL,
    lang text NOT NULL,
    metric text NOT NULL,
    value double precision NOT NULL,
    UNIQUE (time, commit, suite, system, lang, metric)
  )`;
  await sql`SELECT create_hypertable('eval_metrics', by_range('time'), if_not_exists => TRUE)`;
}
