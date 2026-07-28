import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import AuthSyncProvider from "@/components/providers/AuthSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UG Clinic Portal",
  description: "University of Ghana Student Clinic Portal - Book Appointments and Manage Your Healthcare",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextAuthProvider>
          <AuthSyncProvider />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
