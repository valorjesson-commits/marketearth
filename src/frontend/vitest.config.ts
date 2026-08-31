import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    setupFiles: ["./src/__tests__/setup.ts"],
    environment: "jsdom",
    globals: true,
    server: {
      deps: {
        // `@caffeineai/object-storage` and `@caffeineai/core-infrastructure`
        // ship ESM with extensionless relative imports (e.g.
        // `export { ExternalBlob } from "./blob"`). Vitest externalizes
        // node_modules by default, which hands those to Node's ESM loader and
        // fails on the missing extension. Inlining lets Vite resolve them, and
        // lets `vi.mock` intercept `core-infrastructure` in the module graph.
        inline: ["@caffeineai/object-storage", "@caffeineai/core-infrastructure"],
      },
    },
  },
});
