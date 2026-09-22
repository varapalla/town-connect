import "./globals.css";

export const metadata = {
  title: "TownConnect — Ask Your Town",
  description: "AI-powered local business discovery for towns",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}