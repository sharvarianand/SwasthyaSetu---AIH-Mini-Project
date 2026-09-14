import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "SwasthyaSetu", short_name: "SwasthyaSetu", description: "Rural health guidance and referrals", start_url: "/", display: "standalone", background_color: "#f7fbfa", theme_color: "#0d6b62", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
