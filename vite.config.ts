import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      // ⬇️ NEW: Fixes Google Auth Popup & COOP Errors
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // ⬇️ Essential for PDF.js worker loading in Phase 2
        "pdfjs-dist": path.resolve(__dirname, "node_modules/pdfjs-dist"),
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    define: {
      // ⬇️ Allows accessing app version in code
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    optimizeDeps: {
      // ⬇️ Pre-bundles PDF.js to prevent "require is not defined" errors
      include: ["pdfjs-dist"],
      exclude: ["lucide-react"], // Exclude icons from optimization to allow tree-shaking
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          // ⬇️ Separates PDF logic into its own chunk for performance
          manualChunks: {
            pdfjs: ["pdfjs-dist"],
            vendor: ["react", "react-dom", "react-router-dom", "firebase/app"],
          },
        },
      },
      // ⬇️ Increases chunk size warning limit (PDF workers are large)
      chunkSizeWarningLimit: 1600,
    },
  };
});