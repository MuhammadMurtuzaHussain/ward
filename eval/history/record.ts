// Records every committed version of every eval result file into the eval history on Tiger Data,
// stamped with its commit and commit time. Re-running is safe: rows already there are skipped, so
// CI can run it on each push and the first run backfills the whole project's history.
//
//   pnpm history:record

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { connect, ensureSchema } from "./db.ts";
import { FILES, flatten, type Suite } from "./flatten.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const git = (...a: string[]) => execFileSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 256 << 20 });

const sql = connect();
await ensureSchema(sql);
let added = 0;
for (const [suite, path] of Object.entries(FILES) as [Suite, string][]) {
  const versions = git("log", "--format=%h %cI", "--", path).trim().split("\n").filter(Boolean);
  for (const v of versions) {
    const [commit, time] = v.split(" ") as [string, string];
    let data: unknown;
    try {
      data = JSON.parse(git("show", `${commit}:${path}`));
    } catch {
      continue; // the commit deleted or renamed the file
    }
    const rows = flatten(suite, data).map((r) => ({ ...r, time, commit }));
    if (!rows.length) continue;
    const res = await sql`INSERT INTO eval_metrics ${sql(rows)} ON CONFLICT DO NOTHING`;
    added += res.count;
  }
  console.log(`${suite}: ${versions.length} versions`);
}
console.log(`${added} new rows`);
await sql.end();
