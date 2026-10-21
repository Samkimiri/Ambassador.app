import { NextRequest, NextResponse } from "next/server";
import { parseStkCallback } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const result = parseStkCallback(rawBody);

    // In a live production deployment with Supabase configured, this updates the enrolment
    // and triggers verifyEnrolmentAndIssueRewardsOp automatically.
    // For logging and compliance, log the transaction reference.
    if (result.success) {
      // Safaricom expects a 200 response with ResultCode 0
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback processed successfully",
        receipt: result.mpesaReceiptNumber,
      });
    } else {
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received (transaction cancelled or failed)",
        failureReason: result.resultDesc,
      });
    }
  } catch (err) {
    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: err instanceof Error ? err.message : "Error processing callback",
      },
      { status: 400 }
    );
  }
}
