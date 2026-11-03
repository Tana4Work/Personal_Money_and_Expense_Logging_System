import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

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
