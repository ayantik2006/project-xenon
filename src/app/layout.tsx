import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastManager from "@/components/ToastManager";
import AdminChatWidget from "@/components/AdminChatWidget";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hoardspace.in"),

  title: {
    default: "HoardSpace - Premium Outdoor Advertising",
    template: "%s | HoardSpace",
  },

  description:
    "Find and book premium hoarding spaces for your advertising campaigns",

  keywords: [
    "hoardings",
    "outdoor advertising",
    "billboards",
    "ad spaces",
    "advertising India",
  ],

  authors: [{ name: "HoardSpace Team" }],

  openGraph: {
    title: "HoardSpace - Premium Outdoor Advertising",
    description:
      "Find and book premium hoarding spaces for your advertising campaigns",
    url: "https://hoardspace.in",
    siteName: "HoardSpace",
    images: [
      {
        url: "/companyLogo/Screenshot 2026-03-02 at 02.10.29.png", // create this
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "HoardSpace",
    description:
      "Find and book premium hoarding spaces for your advertising campaigns",
    images: ["/companyLogo/Screenshot 2026-03-02 at 02.10.29.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/icon1.png",
  },

  alternates: {
    canonical: "https://hoardspace.in",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KSCH3Z5Q');
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-74EDCKD95S`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-74EDCKD95S');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KSCH3Z5Q"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ToastManager />
        <Navbar />
        {children}
        <Footer />
        <AdminChatWidget />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "HoardSpace",
              url: "https://hoardspace.in",
              logo: "https://hoardspace.in/companyLogo/Screenshot 2026-03-02 at 02.10.29.png",
            }),
          }}
        />
      </body>
    </html>
  );
}
