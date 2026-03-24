import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capsule Supply Co. | Bulk Toy Capsule Refills",
  description:
    "Wholesale capsule-toy refills with per-case pricing, $12k minimum orders, and fast order requests.",
  metadataBase: new URL("https://capsule-supply.local"),
  openGraph: {
    title: "Capsule Supply Co.",
    description:
      "Submit bulk capsule-toy refill orders with transparent case pricing and consolidated invoicing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
