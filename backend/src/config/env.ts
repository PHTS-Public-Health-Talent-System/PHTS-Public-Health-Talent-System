import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  const root = process.cwd();
  const testPath = path.join(root, ".env.test");
  const localPath = path.join(root, ".env.local");
  const defaultPath = path.join(root, ".env");
  const useTestEnv =
    process.env.NODE_ENV === "test" && fs.existsSync(testPath);
  const envPath = useTestEnv
    ? testPath
    : fs.existsSync(localPath)
      ? localPath
      : defaultPath;
  dotenv.config({ path: envPath });
  loaded = true;
}
