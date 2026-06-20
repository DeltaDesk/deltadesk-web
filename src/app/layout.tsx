import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const defaultSans = DM_Sans({
  variable: "--font-default-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk-next",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeltaDesk",
  description: "Mitarbeiterplanung leicht gemacht",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", defaultSans.variable, geistMono.variable, spaceGrotesk.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
