import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { EnvironmentBanner } from "@/components/layout/site-header";
import { PwaManager } from "@/components/pwa/pwa-manager";

export const metadata: Metadata = {
  title: {
    default: "SCDS Ambassador Hub | Sam Creative Design School",
    template: "%s | SCDS Ambassador Hub",
  },
  description:
    "Official Offline-First Ambassador, Referral & Growth Platform for Sam Creative Design School (SCDS). Exceptional, Strategic & Realistic.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SCDS Hub",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
          <PwaManager />
          <EnvironmentBanner />
          <div className="flex-1 flex flex-col">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}

