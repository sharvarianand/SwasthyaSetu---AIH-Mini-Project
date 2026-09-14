import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./auth.css";
import "./hero.css";

export const metadata: Metadata = {
  title: "SwasthyaSetu | Rural Health Support",
  description: "Offline-first multilingual healthcare guidance for rural communities in India. Symptom checker, disease risk assessment, vitals tracker, and AI triage — all offline.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "SwasthyaSetu — Rural Health Bridge",
    description: "Offline-first multilingual health app for rural India. Symptom guidance, CKD & Diabetes risk scoring, Vitals tracking, and in-browser AI triage.",
    type: "website",
    locale: "en_IN",
  },
  keywords: ["rural health", "ASHA worker", "offline health app", "symptom checker", "CKD risk", "diabetes risk", "Maharashtra", "health India", "SwasthyaSetu"],
};

export const viewport: Viewport = {
  themeColor: "#0d6b62",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
