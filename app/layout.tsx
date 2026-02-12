import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditClaw - Admin Panel",
  description: "AuditClaw Administration Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
