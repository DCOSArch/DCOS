import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dcos.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DentalConnect OS — Dental Lab Management & Clinic Collaboration Software",
    template: "%s | DentalConnect OS",
  },
  description:
    "DentalConnect OS (DCOS) is the operating system for modern dentistry. Connect dental clinics and laboratories on one real-time cloud platform — 3D case routing, digital prescriptions, instant messaging, inventory tracking, and automated turnaround. Built for clinics and labs worldwide.",
  applicationName: "DentalConnect OS",
  keywords: [
    "dental lab management software",
    "dental case management software",
    "dental laboratory software",
    "dentist lab collaboration platform",
    "3D dental case routing",
    "digital dental prescription software",
    "dental lab client portal",
    "dental turnaround tracking",
    "dental inventory management software",
    "dental clinic lab communication app",
    "cloud dental lab software",
    "dental CAD/CAM workflow software",
    "DSO dental lab platform",
    "DentalConnect OS",
    "DCOS",
  ],
  authors: [{ name: "DentalConnect OS" }],
  creator: "DentalConnect OS",
  publisher: "DentalConnect OS",
  category: "Dental Software",
  // NOTE: deliberately no `alternates.canonical` here. A root-level canonical is
  // inherited by every page that doesn't override it, which would make each of those
  // pages declare itself a duplicate of the homepage. Every indexable route sets its
  // own self-referencing canonical instead.
  alternates: {
    languages: {
      en: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "DentalConnect OS",
    title: "DentalConnect OS — Dental Lab Management & Clinic Collaboration Software",
    description:
      "Connect dental clinics and labs on one real-time platform. 3D case routing, digital prescriptions, and automated turnaround tracking.",
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DentalConnect OS — The Operating System for Modern Dentistry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DentalConnect OS — Dental Lab Management & Clinic Collaboration Software",
    description:
      "Connect dental clinics and labs on one real-time platform. 3D case routing, digital prescriptions, and automated turnaround tracking.",
    images: ["/opengraph-image"],
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
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
  other: {
    "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('darkMode');
                if (saved === 'true' || saved === null) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Google Analytics */}
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors theme="system" />
        <Analytics />
      </body>
    </html>
  );
}
