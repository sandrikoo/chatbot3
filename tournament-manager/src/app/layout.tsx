import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "EA FC 26 Tournament Manager",
  description:
    "Premium private tournament management for EA FC 26. Track standings, fixtures, stats and more.",
  keywords: ["EA FC 26", "FIFA", "tournament", "manager", "league"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col pitch-bg">
        <Navbar />
        <main className="pt-14 flex-1">{children}</main>
      </body>
    </html>
  );
}
