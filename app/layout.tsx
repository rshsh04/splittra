import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import ToasterClient from "@/components/ToasterClient";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Splittra - Simple Expense Sharing",
  description: "Effortlessly split expenses with friends and family",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read cookie server-side best effort; fallback to 'en'.
  // In app router layout, we don't have direct cookie access without headers.
  // We'll default to 'en' and the client will correct.
  return (
    <html lang="en" dir="ltr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LocaleProvider initialLocale="en">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-blue-600 px-4 py-2 rounded shadow z-50"
          >
            Skip to main content
          </a>
          <div id="main-content" className="outline-none focus:outline-none">
            {children}
          </div>
          <ToasterClient />
        </LocaleProvider>
      </body>
    </html>
  );
}
