import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  root: "./src/renderer",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/renderer"),
      "@domain": path.resolve(__dirname, "./src/domain"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@common": path.resolve(__dirname, "./src/common"),
    },
  },
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
