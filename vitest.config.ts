import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Enable global imports for `test`, `expect`, etc.
  },
});
