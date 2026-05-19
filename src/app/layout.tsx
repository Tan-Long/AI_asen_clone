import type { Metadata } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import { publicAsset } from "@/lib/public-path";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const headingFont = Be_Vietnam_Pro({
  variable: "--font-poppins",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tan-long.github.io"),
  title: "The Grain of Tomorrow | Arsenic Early-Warning Demo",
  description:
    "A simple landing page and dashboard demo for AI-based early warning of arsenic risk in Vietnamese rice under climate scenarios.",
  keywords: [
    "arsenic",
    "rice",
    "AI",
    "climate change",
    "food safety",
    "Vietnam",
    "GIC",
  ],
  authors: [{ name: "The Grain of Tomorrow" }],
  icons: {
    icon: publicAsset("/images/greenfarming/logo.svg"),
  },
  openGraph: {
    title: "The Grain of Tomorrow | Arsenic Early-Warning Demo",
    description:
      "A simple landing page and dashboard demo for AI-based early warning of arsenic risk in Vietnamese rice under climate scenarios.",
    images: [publicAsset("/images/greenfarming/logo.png")],
    url: "https://tan-long.github.io/AI_asen_clone/",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
