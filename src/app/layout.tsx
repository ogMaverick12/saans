import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saans | Urban air quality assistant",
  description:
    "Check today's air where you live and get a household plan for smog and urban air pollution.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <header className="border-b border-border">
          <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
            <p className="text-lg font-semibold tracking-tight">Saans</p>
            <p className="text-sm text-muted-foreground">
              Urban air quality assistant
            </p>
          </div>
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
            <p>
              Weather and air data by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Open-Meteo.com
              </a>
              . Air quality data from the{" "}
              <a
                href="https://atmosphere.copernicus.eu/"
                target="_blank"
                rel="noreferrer"
                className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                CAMS ENSEMBLE
              </a>{" "}
              data provider.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
