import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HEATWATCH — Heatwave Monitoring & Early Warning Dashboard",
  description:
    "HEATWATCH: environmental monitoring dashboard built on 50,000 heatwave observations across 10 cities.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
