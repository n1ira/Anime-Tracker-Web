import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { AppProvider } from "../lib/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anime Tracker Pro",
  description: "Track and automatically download anime episodes via torrent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Anime Tracker Pro &copy; {new Date().getFullYear()}
            </footer>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
