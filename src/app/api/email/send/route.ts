import { NextResponse } from "next/server";
import { buildApplicationApprovedEmail, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, fullName, referralCode, dashboardUrl } = body as {
      type?: string;
      to?: string;
      fullName?: string;
      referralCode?: string;
      dashboardUrl?: string;
    };

    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "Valid recipient email is required." },
        { status: 400 }
      );
    }

    if (type === "application_approved") {
      const origin = request.headers.get("origin");
      const message = buildApplicationApprovedEmail({
        fullName: fullName || "Ambassador",
        referralCode: referralCode || "SCDS-AMB",
        dashboardUrl: dashboardUrl || (origin ? `${origin}/dashboard` : undefined),
      });
      const result = await sendEmail({
        ...message,
        to: to.trim(),
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to dispatch approval email." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        messageId: result.messageId,
        isMock: result.isMock,
      });
    }

    return NextResponse.json(
      { error: "Unsupported email notification type." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process email send.",
      },
      { status: 500 }
    );
  }
}
