import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TownConnect — Ask your town anything",
  description: "AI-powered local business discovery powered by Google Places."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
