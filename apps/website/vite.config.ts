import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";

const syncExternalStoreShim = fileURLToPath(
  new URL("./src/shims/use-sync-external-store-shim.ts", import.meta.url)
);
const syncExternalStoreSelectorShim = fileURLToPath(
  new URL(
    "./src/shims/use-sync-external-store-with-selector.ts",
    import.meta.url
  )
);

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    mdx(),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          crawlLinks: true,
        },
      },

      pages: [
        {
          path: "/",
        },
        {
          path: "/download",
        },
        {
          path: "/features",
        },
        {
          path: "/privacy",
        },
        {
          path: "/impressum",
        },
        {
          path: "/docs",
        },
        {
          path: "/api/search",
        },
        {
          path: "llms-full.txt",
        },
        {
          path: "llms.txt",
        },
      ],
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: /^use-sync-external-store\/shim$/,
        replacement: syncExternalStoreShim,
      },
      {
        find: /^use-sync-external-store\/shim\/with-selector$/,
        replacement: syncExternalStoreSelectorShim,
      },
    ],
  },
});
