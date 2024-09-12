import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["ethers"],
  },
  build: {
    rollupOptions: {
      external: ["ethers5"],
    },
  },
});
