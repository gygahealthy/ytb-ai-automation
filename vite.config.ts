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
      "@": path.resolve(__dirname, "./src"),
      "@main": path.resolve(__dirname, "./src/main"),
      "@handlers": path.resolve(__dirname, "./src/main/handlers"),
      "@modules": path.resolve(__dirname, "./src/main/modules"),
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@components": path.resolve(__dirname, "./src/renderer/components"),
      "@constants": path.resolve(__dirname, "./src/renderer/constants"),
      "@contexts": path.resolve(__dirname, "./src/renderer/contexts"),
      "@hooks": path.resolve(__dirname, "./src/renderer/hooks"),
      "@ipc": path.resolve(__dirname, "./src/renderer/ipc"),
      "@pages": path.resolve(__dirname, "./src/renderer/pages"),
      "@store": path.resolve(__dirname, "./src/renderer/store"),
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
