// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger"; // Assuming this is a valid plugin

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Server configuration
    server: {
      host: "::", // Listen on all addresses (IPv6)
      port: 8080, // Development server port
    },
    // Plugins
    plugins: [
      react(), // React plugin using SWC
      // Conditionally add componentTagger only in development mode
      mode === 'development' && componentTagger(),
    ].filter(Boolean), // Filter out falsy values (e.g., if componentTagger() is undefined in production)
    // Resolve aliases
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Alias @ to src directory
      },
    },
    // Define global constants that can be accessed in the client code
    // This is useful for non-sensitive environment variables or build-time constants
    // Note: For sensitive vars like API keys, use import.meta.env.VITE_* directly in code
    define: {
      // Example: Make a non-sensitive env var globally available
      '__APP_VERSION__': JSON.stringify(env.npm_package_version), // If you have version in package.json
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
    },
  };
});