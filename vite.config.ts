import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const base = process.env.APP_BASE_PATH ?? "/uyutnaya-matematika/";
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))
  throw new Error(
    "APP_BASE_PATH must be an absolute directory path, for example /uyutnaya-matematika/ or /",
  );
export default defineConfig({
  base,
  build: { manifest: true },
  plugins: [
    react(),
    {
      name: "inline-iphone-icon",
      // Hand the installation sheet the PNG bytes with the document itself.
      // File-based manifest icons remain available for other platforms.
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const icon = readFileSync(
            resolve("public/icons/pompompurin-apple-v3.png"),
          ).toString("base64");
          return html.replace(
            'href="%BASE_URL%icons/pompompurin-apple-v3.png"',
            `href="data:image/png;base64,${icon}"`,
          );
        },
      },
    },
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/pwa",
      filename: "sw.ts",
      injectRegister: false,
      registerType: "prompt",
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        id: base,
        name: "Gemütliche Mathe",
        short_name: "Einmaleins",
        description: "Kleine Schritte zum sicheren Einmaleins",
        lang: "de",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#FFF9EB",
        theme_color: "#FFF9EB",
        icons: [
          {
            src: "icons/pompompurin-192-v3.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pompompurin-512-v3.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest,woff2}"],
        manifestTransforms: [
          async (entries) => {
            // Only files emitted by this build: sync folders can restore old hashed assets.
            const output = JSON.parse(
              readFileSync(resolve("dist/.vite/manifest.json"), "utf8"),
            ) as Record<
              string,
              { file: string; css?: string[]; assets?: string[] }
            >;
            const current = new Set(
              Object.values(output).flatMap((e) => [
                e.file,
                ...(e.css ?? []),
                ...(e.assets ?? []),
              ]),
            );
            const seen = new Set<string>();
            return {
              manifest: entries.filter((e) => {
                if (e.url.startsWith("assets/") && !current.has(e.url))
                  return false;
                if (seen.has(e.url)) return false;
                seen.add(e.url);
                return true;
              }),
              warnings: [],
            };
          },
        ],
      },
    }),
  ],
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
