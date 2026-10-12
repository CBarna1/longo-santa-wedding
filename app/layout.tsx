import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Josefin_Sans } from "next/font/google";
import { COUPLE, WEDDING_DATE_SHORT, CITY } from "@/lib/event";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime request to Google.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: `${COUPLE.first} & ${COUPLE.second} · ${WEDDING_DATE_SHORT}`,
  description: `Join us in ${CITY} to celebrate. Kindly RSVP.`,
};

export const viewport: Viewport = {
  themeColor: "#f4f6f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
