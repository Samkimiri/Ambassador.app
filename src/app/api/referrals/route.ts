import { NextRequest, NextResponse } from "next/server";
import { learnerEnquirySchema } from "@/lib/validations";
import { INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { submitLearnerEnquiryOp } from "@/lib/store-engine";

// Simple in-memory rate limit bucket per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= 10) {
      return NextResponse.json(
        { error: "Too many referral submissions. Please try again in a minute." },
        { status: 429 }
      );
    }
    bucket.count += 1;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
  }

  try {
    const body = await req.json();
    const parsed = learnerEnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input payload." },
        { status: 400 }
      );
    }

    const { referral } = submitLearnerEnquiryOp(
      INITIAL_DATABASE_STATE,
      parsed.data
    );

    return NextResponse.json({ ok: true, referral }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to record referral attribution.",
      },
      { status: 400 }
    );
  }
}

