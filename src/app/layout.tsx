import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { AI } from "./actions";

import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AI Spanish Tutor",
  description:
    "A conversational AI Spanish tutor. Built with GPT-4 and the Vercel AI SDK.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full relative">
      <AI>
        <body
          className={cn(
            "min-h-[80vh] h-[80vh] bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          {children}
          <Footer />
        </body>
      </AI>
    </html>
  );
}
