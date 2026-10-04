import { spawnSync } from "node:child_process";

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const windows = process.platform === "win32";
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
    shell: windows,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npmCmd = "npm";

run(npmCmd, ["run", "e2e:prepare"]);
run(npmCmd, ["run", "build"]);
run(
  npmCmd,
  ["exec", "playwright", "test", "e2e/screenshots.spec.ts"],
  { ...process.env, SCREENSHOTS: "1" },
);
