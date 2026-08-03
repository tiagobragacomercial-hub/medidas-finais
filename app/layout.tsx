import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-app", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Medidas Finais para Produção",
  description: "Levantamentos técnicos organizados, seguros e disponíveis offline.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#092c4c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={geist.variable}>{children}</body></html>;
}
