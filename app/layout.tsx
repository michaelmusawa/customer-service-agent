import type { Metadata } from "next";
import { poppins } from "@/public/_fonts/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daemon App",
  description: "Daemon for Customer Service App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>{children}</body>
    </html>
  );
}
