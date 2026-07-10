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
    "Wander GitHub for font binaries no catalog lists. Tree-walk repos, group families, preview and save.",
  icons: {
    icon: "/assets/fontgrep_logo.svg",
  },
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
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="fontgrep-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
