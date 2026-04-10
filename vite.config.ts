import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import Components from "unplugin-vue-components/vite";
import { VortResolver } from "./src/components/vort/resolver";
import { searchIndexPlugin } from "./plugins/vite-plugin-search-index";

export default defineConfig({
  plugins: [
    vue(),
    searchIndexPlugin(),
    Components({
      dirs: [],
      resolvers: [VortResolver()],
      dts: "src/components.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
