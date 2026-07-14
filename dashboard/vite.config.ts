import stylex from "@stylexjs/unplugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // StyleX compiles at build time via the official unplugin (plugin-react v6
  // is oxc-based, so the Babel-plugin route is unavailable); aggregated CSS is
  // appended to the app's CSS asset, and dev serves it through the
  // virtual:stylex modules imported in main.tsx.
  plugins: [stylex.vite(), react()],
  server: {
    proxy: {
      "/api": "http://localhost:8080",
      "/auth": "http://localhost:8080",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
