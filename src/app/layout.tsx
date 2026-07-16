import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentProvider } from "@/components/accent-provider";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tracker",
  description: "Organización, planificación y registro de trabajo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AccentProvider />
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-slate-50 p-6 dark:bg-slate-950">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
