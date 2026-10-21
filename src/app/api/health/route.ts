import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isMpesaConfigured, getMpesaConfig } from "@/lib/mpesa";
import { isEmailConfigured } from "@/lib/email";

export async function GET() {
  const mpesaConfig = getMpesaConfig();

  return NextResponse.json(
    {
      status: "ok",
      appName: "SCDS Ambassador Hub",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime ? Math.floor(process.uptime()) : 0,
      services: {
        supabase: {
          configured: isSupabaseConfigured(),
          url: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? "configured"
            : "demo-mode-local-storage",
        },
        mpesa: {
          configured: isMpesaConfigured(),
          environment: mpesaConfig.environment,
          shortcode: mpesaConfig.shortcode,
          mode: isMpesaConfigured() ? "live/sandbox" : "dev-simulation",
        },
        email: {
          configured: isEmailConfigured(),
          provider: process.env.RESEND_API_KEY
            ? "Resend"
            : process.env.SENDGRID_API_KEY
            ? "SendGrid"
            : "dev-simulation",
        },
        pwa: {
          manifest: "/manifest.json",
          serviceWorker: "/sw.js",
        },
      },
      brand: {
        primary: "#0048E8", // Electric Blue
        secondary: "#F8B820", // Golden Yellow
        accent: "#0B1F50", // Deep Navy
      },
    },
    { status: 200 }
  );
}
