import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Standalone Vitest config (kept separate from vite.config.js so unit tests run
// without the SvelteKit plugin / SSR machinery). Targets the pure helpers under
// tests/unit.
export default defineConfig({
  // `$lib` so a unit test can exercise a module that imports by the app's own
  // alias without the SvelteKit plugin being loaded.
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
