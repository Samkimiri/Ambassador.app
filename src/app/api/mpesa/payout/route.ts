import { NextRequest, NextResponse } from "next/server";
import { formatDarajaPhone, initiateB2cPayout } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, amountKes, remarks, payoutRequestId } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Recipient phone number is required." },
        { status: 400 }
      );
    }

    if (!amountKes || Number(amountKes) < 500) {
      return NextResponse.json(
        { error: "Minimum payout withdrawal is KES 500." },
        { status: 400 }
      );
    }

    const formattedPhone = formatDarajaPhone(String(phoneNumber));
    if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
      return NextResponse.json(
        {
          error:
            "Invalid Kenyan phone number. Use format 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX.",
        },
        { status: 400 }
      );
    }

    const result = await initiateB2cPayout({
      phoneNumber: formattedPhone,
      amountKes: Number(amountKes),
      remarks: String(remarks || `Payout ${payoutRequestId || ""}`).slice(0, 50),
    });

    return NextResponse.json(
      {
        ok: true,
        transactionReference: result.transactionReference,
        conversationId: result.conversationId,
        originatorConversationId: result.originatorConversationId,
        responseDescription: result.responseDescription,
        isMock: result.isMock ?? false,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to disburse M-Pesa B2C payout.",
      },
      { status: 500 }
    );
  }
}
