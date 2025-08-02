import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";


const inter = Inter({
  subsets: ["latin"],

  display: "swap",
});

export const metadata = {
  title: "NeoVar",
  description: "https://neomscientific.com/",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
