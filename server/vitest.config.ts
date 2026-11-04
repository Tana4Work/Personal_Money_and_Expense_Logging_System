import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, serverDirectory, ""));

  return {
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
      fileParallelism: false,
      pool: "forks",
      poolOptions: { forks: { singleFork: true } },
    },
  };
});
