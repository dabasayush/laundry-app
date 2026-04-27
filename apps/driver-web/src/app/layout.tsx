import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driver Panel - Laundry App",
  description: "Driver dashboard and order management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
