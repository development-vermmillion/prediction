import type { Metadata, Viewport } from "next";
import { SITE_NAME } from "@/lib/constants";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} — Predict. Play. Win.`, template: `%s · ${SITE_NAME}` },
  description:
    "Predicators is a prediction-games arcade: Aviator, Ludo, Color Prediction and Number Wheel. Play with virtual coins.",
};

export const viewport: Viewport = {
  themeColor: "#07050f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="ambient" aria-hidden />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
