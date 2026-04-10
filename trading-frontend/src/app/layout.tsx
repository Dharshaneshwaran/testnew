import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TradeBoard Pro",
  description: "Premium stock trading dashboard frontend UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#030507] text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
