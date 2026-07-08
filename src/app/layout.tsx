import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = localFont({
  src: [
    { path: "../../public/fonts/ui/GeistSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/ui/GeistSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/ui/GeistSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/ui/GeistSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "../../public/fonts/ui/GeistMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/ui/GeistMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/ui/GeistMono-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/ui/GeistMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "fontgrep",
  description:
    "Discover, search and curate open-source fonts via the GitHub code index.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
