import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ìrànwọ́: AI help for small businesses", template: "%s · Ìrànwọ́" },
  description: "An AI assistant that knows your shop. Draft invoices, customer replies and product posts in seconds.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
