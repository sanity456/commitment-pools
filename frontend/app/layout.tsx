import type { Metadata } from "next";
// Each document gets a fresh CSP nonce; never cache a rendered nonce for reuse.
export const dynamic = "force-dynamic";
import { product } from "../lib/product";
import { Geist, Geist_Mono, Great_Vibes } from "next/font/google";
import "./globals.css";
import "./product-tools.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const brandScript = Great_Vibes({
  variable: "--font-brand-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(product.origin),
  title: "Commitment Pools — Proof over promises",
  description:
    "Stake on clear terms. Prove each scheduled round. Finish together on Studionet.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Commitment Pools — Proof over promises",
    description:
      "Stake on clear terms. Prove each scheduled round. Finish together on Studionet.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "Commitment Pools — Proof over promises · Built for Studionet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Commitment Pools — Proof over promises",
    description:
      "Stake on clear terms. Prove each scheduled round. Finish together on Studionet.",
    images: ["/og.png"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${brandScript.variable} antialiased`}
      >
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
