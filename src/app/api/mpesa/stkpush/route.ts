import { NextRequest, NextResponse } from "next/server";
import { formatDarajaPhone, initiateStkPush } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, amountKes, accountReference, transactionDesc } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!amountKes || Number(amountKes) <= 0) {
      return NextResponse.json(
        { error: "Valid amount in KES is required." },
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

    const result = await initiateStkPush({
      phoneNumber: formattedPhone,
      amountKes: Number(amountKes),
      accountReference: String(accountReference || "SCDS_TUITION"),
      transactionDesc: String(transactionDesc || "SCDS Course Enrolment"),
    });

    return NextResponse.json(
      {
        ok: true,
        merchantRequestId: result.merchantRequestId,
        checkoutRequestId: result.checkoutRequestId,
        responseCode: result.responseCode,
        responseDescription: result.responseDescription,
        customerMessage: result.customerMessage,
        isMock: result.isMock ?? false,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to initiate M-Pesa STK push.",
      },
      { status: 500 }
    );
  }
}

