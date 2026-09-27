import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths, so the build works at any URL (GitHub Pages, Vercel, a subfolder…).
  base: "./",
  server: { host: true },
  // main.ts uses top-level await while loading textures.
  build: { target: "es2022" },
});
