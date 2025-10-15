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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.splittra.se";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Splittra",
  title: {
    default: "Splittra - Simple Expense Sharing",
    template: "%s | Splittra",
  },
  description: "Effortlessly split expenses with friends and family",
  keywords: [
    "split expenses",
    "expense sharing",
    "split bills",
    "household expenses",
    "Splittra",
  ],
  authors: [{ name: "Splittra", url: siteUrl }],
  icons: {
    icon: "/logo.png",
    apple: "/default-avatar.jpg",
    shortcut: "/logocropped.png",
  },
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#000000" }],
  openGraph: {
    title: "Splittra - Simple Expense Sharing",
    description: "Effortlessly split expenses with friends and family",
    url: siteUrl,
    siteName: "Splittra",
    images: [
      {
        url: `${siteUrl}/logocropped.png`,
        width: 1200,
        height: 630,
        alt: "Splittra logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Splittra - Simple Expense Sharing",
    description: "Effortlessly split expenses with friends and family",
    creator: "@splittra",
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-US": `${siteUrl}/`,
      sv: `${siteUrl}/sv`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
      <head>
        {/* Structured data for Organization and WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Splittra",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
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
