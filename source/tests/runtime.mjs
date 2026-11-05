import { createRequire } from "node:module";
import { realpathSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(
  realpathSync("node_modules/wrangler/package.json"),
);
const { Miniflare } = require("miniflare");
export async function createTestRuntime() {
  const allFiles = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? allFiles(path.join(dir, e.name))
        : [path.join(dir, e.name)],
    );
  const modulePaths = allFiles("dist/server")
    .filter((f) => /\.m?js$/.test(f))
    .sort((a, b) =>
      a === "dist/server/index.js"
        ? -1
        : b === "dist/server/index.js"
          ? 1
          : a.localeCompare(b),
    );
  const mf = new Miniflare({
    name: "retech-test",
    rootPath: path.resolve("dist/server"),
    modulesRootPath: path.resolve("dist/server"),
    modules: modulePaths.map((p) => ({
      type: "ESModule",
      path: path.resolve(p),
    })),
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    r2Buckets: ["BUCKET"],
    bindings: {
      ADMIN_BOOTSTRAP_TOKEN:
        "isolated-test-bootstrap-token-not-a-production-secret",
    },
    cf: false,
    log: undefined,
  });
  const db = await mf.getD1Database("DB");
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const statements = readFileSync("drizzle/" + file, "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
  return { mf, db };
}
