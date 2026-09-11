import type { MetadataRoute } from "next";

const THEME = "#05080D";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Edge — AI Trading Journal",
    short_name: "The Edge",
    description:
      "Track. Learn. Improve. Your AI trading journal with deep stats, rule tracking, and a personal coach.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME,
    theme_color: THEME,
    categories: ["finance", "productivity"],
    lang: "en",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}