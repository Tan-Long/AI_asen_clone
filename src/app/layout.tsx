import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { publicAsset } from "@/lib/public-path";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tan-long.github.io"),
  title: "Hạt Gạo Ngày Mai | The Grain of Tomorrow",
  description:
    "AI-based early-warning demo for arsenic risk in Vietnamese rice under climate scenarios.",
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
    title: "Hạt Gạo Ngày Mai | The Grain of Tomorrow",
    description:
      "AI-based early-warning demo for arsenic risk in Vietnamese rice under climate scenarios.",
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
      lang="vi"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
