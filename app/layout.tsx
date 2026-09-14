import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./auth.css";
import "./hero.css";

export const metadata: Metadata = {
  title: "SwasthyaSetu | Rural health support",
  description: "Offline-first multilingual healthcare guidance for rural communities.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0d6b62" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
