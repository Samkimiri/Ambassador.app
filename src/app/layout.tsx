import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { EnvironmentBanner } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: {
    default: "SCDS Ambassador Hub | Sam Creative Design School",
    template: "%s | SCDS Ambassador Hub",
  },
  description:
    "Official Ambassador, Referral & Growth Platform for Sam Creative Design School (SCDS). Exceptional, Strategic & Realistic.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AppProvider>
          <EnvironmentBanner />
          <div className="flex-1 flex flex-col">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}

