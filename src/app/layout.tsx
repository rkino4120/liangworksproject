import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VR Galleries - WebGL/WebGPU作品集",
    template: "%s | VR Galleries"
  },
  description: "Three.js、Babylon.jsを使用したWebGL/WebGPU作品を展示するVRアートギャラリー。インタラクティブな3D体験をお楽しみください。",
  keywords: ["WebGL", "WebGPU", "Three.js", "Babylon.js", "VR", "3D", "インタラクティブ", "アート", "ギャラリー"],
  authors: [{ name: "VR Galleries Team" }],
  creator: "VR Galleries",
  publisher: "VR Galleries",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://vrgalleries.com",
    siteName: "VR Galleries",
    title: "VR Galleries - WebGL/WebGPU作品集",
    description: "Three.js、Babylon.jsを使用したWebGL/WebGPU作品を展示するVRアートギャラリー",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VR Galleries Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "VR Galleries - WebGL/WebGPU作品集",
    description: "Three.js、Babylon.jsを使用したWebGL/WebGPU作品を展示するVRアートギャラリー",
    images: ["/images/og-image.jpg"]
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
  metadataBase: new URL('http://localhost:3001'),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
