import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
  display: "swap",
});

export const metadata = {
  title: "Varieon",
  description: "www.neomscientific.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
