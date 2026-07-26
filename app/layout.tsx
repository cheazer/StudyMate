import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";

// Display face: carries the personality (streak numbers, headings).
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

// Body face: quiet workhorse for everything else.
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Utility face: timestamps, hour counts, data-flavored labels.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "StudyMate",
  description: "An AI study companion that keeps you on track.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-bg text-ink antialiased`}
      >
        <TopNav />
        {children}
      </body>
    </html>
  );
}
