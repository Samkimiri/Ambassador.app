import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { PwaManager } from "@/components/pwa/pwa-manager";
import { getAppUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "SCDS Ambassador Hub | Sam Creative Design School",
    template: "%s | SCDS Ambassador Hub",
  },
  description:
    "Official Ambassador, Referral & Student Leadership Platform for Sam Creative Design School (SCDS) in Nairobi, Kenya. Exceptional, Strategic & Realistic design & tech training.",
  keywords: [
    "SCDS",
    "Sam Creative Design School",
    "Student Ambassador Kenya",
    "Design School Nairobi",
    "UI/UX Design Kenya",
    "SolidWorks Training Nairobi",
    "Web Development Bootcamp Kenya",
    "Ambassador Program Kenya",
    "M-Pesa Ambassador Commission",
  ],
  authors: [{ name: "Sam Creative Design School", url: "https://samcreativedesignschool.com" }],
  creator: "Sam Creative Design School (SCDS)",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://ambassadors.samcreativedesignschool.com",
    siteName: "SCDS Ambassador Hub",
    title: "SCDS Ambassador Hub — Empowering Student Leaders & Creators",
    description:
      "Join the official SCDS Ambassador Hub. Earn up to 15% commission with instant M-Pesa payouts by referring prospective learners to Kenya's premier creative design & technology school.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SCDS Ambassador Hub — Sam Creative Design School",
    description:
      "Official Ambassador & Referral Platform for Sam Creative Design School (SCDS). Exceptional, Strategic & Realistic.",
  },
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
  themeColor: "#0048E8",
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
      <body className="min-h-screen flex flex-col bg-surface text-charcoal">
        <AppProvider>
          <PwaManager />
          <div className="flex-1 flex flex-col">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}

