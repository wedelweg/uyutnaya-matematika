import { rmSync, existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";
const workspace = realpathSync(
  resolve(dirname(fileURLToPath(import.meta.url)), ".."),
);
const target = resolve(workspace, "dist");
if (relative(workspace, target) !== "dist")
  throw new Error("Unexpected build output path");
if (existsSync(target)) {
  const resolved = realpathSync(target);
  if (resolved.toLowerCase() !== target.toLowerCase())
    throw new Error("Refusing to delete a redirected output directory");
  rmSync(target, { recursive: true });
}
