import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import AuthSyncProvider from "@/components/providers/AuthSyncProvider";
import SessionTimeoutProvider from "@/components/providers/SessionTimeoutProvider";
import NavigationProgress from "@/components/providers/NavigationProgress";
import PageTransition from "@/components/providers/PageTransition";
import ServiceWorkerProvider from "@/components/providers/ServiceWorkerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "UG Student Clinic Portal",
  authors: [{ name: "University of Ghana Health Services", url: "https://www.ug.edu.gh" }],
  creator: "University of Ghana Health Services Directorate",
  publisher: "University of Ghana",
  title: "UG Clinic Portal - University of Ghana Student Clinic",
  description: "Official University of Ghana Student Clinic Portal for student consultations, healthcare records, and campus health services.",
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <ServiceWorkerProvider />
        <NavigationProgress />
        <NextAuthProvider>
          <AuthSyncProvider />
          <SessionTimeoutProvider>
            <PageTransition>
              {children}
            </PageTransition>
          </SessionTimeoutProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
