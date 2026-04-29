import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { verifyIcons } from "./scripts/verify-icons.mjs";

// Fails the build if index.html / manifest.json / browserconfig.xml reference
// any icon file that doesn't exist in public/. Runs only for production builds.
function verifyIconsPlugin() {
  return {
    name: "verify-icons",
    apply: "build" as const,
    buildStart() {
      verifyIcons({ root: __dirname });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    verifyIconsPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
