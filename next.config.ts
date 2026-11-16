import type { NextConfig } from "next";

// Sin cacheComponents: casi todas las pantallas son privadas y por usuario (ver DECISIONES.md).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
