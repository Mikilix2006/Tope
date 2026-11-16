import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    // Variables de .env.test (base de datos tope_test). Nunca la de desarrollo.
    env: { ...loadEnv(mode, process.cwd(), ""), TZ: "Europe/Madrid" },
    globalSetup: ["./tests/global-setup.ts"],
    // Todos los tests de integración comparten la misma base de datos: uno detrás de otro.
    fileParallelism: false,
    // bcrypt con coste 12 tarda unos cientos de ms por hash.
    testTimeout: 20_000,
  },
}));
