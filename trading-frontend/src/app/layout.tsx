import type { Metadata } from "next";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeClassProvider } from "@/components/theme/ThemeClassProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ruroxz Finance Beta",
  description: "Ruroxz Finance Beta market dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/globe.svg" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased" suppressHydrationWarning>
        <ThemeClassProvider />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
