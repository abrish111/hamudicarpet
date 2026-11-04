import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hamudi Carpet - Shop Management & Monthly Purchase/Sales Dashboard",
  description: "Modern carpet and flooring shop management system with monthly sales, purchases, POS, and inventory tracking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
