import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SwasthyaSetu — Rural Health Bridge",
    short_name: "SwasthyaSetu",
    description: "Offline-first multilingual healthcare guidance — symptom checker, risk scoring, vitals tracker, and AI triage for rural India.",
    start_url: "/#home",
    display: "standalone",
    background_color: "#f7fbfa",
    theme_color: "#0d6b62",
    orientation: "portrait",
    categories: ["health", "medical", "lifestyle"],
    lang: "en-IN",
    icons: [
      { src: "/icon.svg",    sizes: "any",     type: "image/svg+xml", purpose: "maskable" },
      { src: "/favicon.png", sizes: "512x512", type: "image/png",     purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Symptom Checker", short_name: "Symptoms", url: "/#symptoms", description: "Check your symptoms" },
      { name: "Emergency SOS",   short_name: "SOS",      url: "/#emergency", description: "Emergency guidance and SOS" },
      { name: "Risk Assessment", short_name: "Risk",     url: "/#risk",      description: "CKD and Diabetes risk scoring" },
    ],
  };
}
