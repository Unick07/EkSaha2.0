import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

const npmCli = process.env.npm_execpath ||
  join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

const children = [
  spawn(process.execPath, [npmCli, "run", "dev", "-w", "client"], { stdio: "inherit" }),
  spawn(process.execPath, [npmCli, "run", "dev", "-w", "server"], { stdio: "inherit" }),
];

const stop = () => {
  for (const child of children) child.kill("SIGTERM");
};

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stop();
      process.exitCode = code;
    }
  });
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
