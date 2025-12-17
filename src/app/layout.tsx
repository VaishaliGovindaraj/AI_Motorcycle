import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MotoShops EU - European Motorcycle Directory",
  description: "Find motorcycle shops and repair services across Europe. Browse by country and city with our comprehensive directory of motorcycle dealers.",
  keywords: ["motorcycle shops", "motorcycle repair", "Europe", "motorcycle dealers", "bike shops"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
