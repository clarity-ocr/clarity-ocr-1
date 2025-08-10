// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

optimizeDeps: {
  exclude: ["pdfjs-dist"]
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "pdfjs-dist": path.resolve(__dirname, "node_modules/pdfjs-dist"),
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    optimizeDeps: {
      include: ["pdfjs-dist"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            pdfjs: ["pdfjs-dist"],
          },
        },
      },
    },
  };
});
