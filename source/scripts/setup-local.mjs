import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

// All resources created by this command are local. It never deploys a Site.
const root = process.cwd();
function run(args, options = {}) {
  const r = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}
if (Number(process.versions.node.split(".")[0]) < 22)
  throw new Error("Cần Node.js 22.13 trở lên.");
if (!existsSync("node_modules/vinext"))
  throw new Error("Chạy npm ci trước khi cài đặt dữ liệu local.");
if (!existsSync(".dev.vars")) {
  writeFileSync(
    ".dev.vars",
    "ADMIN_BOOTSTRAP_TOKEN=" + randomBytes(36).toString("base64url") + "\n",
  );
  console.log(
    "Đã tạo mã quản trị riêng trong .dev.vars. Không chia sẻ tệp này công khai.",
  );
}
if (!process.argv.includes("--skip-build"))
  run(["scripts/run-framework.mjs", "build"]);
mkdirSync(".wrangler", { recursive: true });
const original = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
// A config next to the built worker preserves relative asset/module paths.
const config = {
  ...original,
  d1_databases: original.d1_databases.map((d) => ({
    ...d,
    migrations_dir: path.resolve("drizzle"),
  })),
};
writeFileSync("dist/server/retech-local.json", JSON.stringify(config, null, 2));
run(
  [
    "--import",
    "./scripts/sites-env.mjs",
    "./node_modules/wrangler/bin/wrangler.js",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    "dist/server/retech-local.json",
    "--persist-to",
    ".wrangler/state",
  ],
  { stdio: ["pipe", "inherit", "inherit"], input: "y\n" },
);
writeFileSync(
  ".wrangler/setup-completed.json",
  JSON.stringify({ completed_at: new Date().toISOString(), local_only: true }),
);
console.log(
  "Cài đặt local hoàn tất. Chạy npm run dev, mở địa chỉ được terminal hiển thị.",
);
console.log(
  "Tạo tài khoản, mở Tài khoản → Thiết lập quản trị; nhập mã trong .dev.vars để cấp quyền quản trị.",
);
