/**
 * SCDS Ambassador Hub — Safaricom Daraja M-Pesa Integration Service
 * Supports:
 * 1. OAuth 2.0 Token Generation
 * 2. C2B Lipa Na M-Pesa Online (STK Push) for Learner Course Enrolment
 * 3. B2C Payout Disbursement for Ambassador Commission Withdrawals
 * 4. STK Callback Parsing & Idempotent Verification
 * 5. Safe Sandbox / Mock Mode when live Safaricom credentials are not present
 */

export interface MpesaConfig {
  environment: "sandbox" | "production";
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  initiatorName?: string;
  securityCredential?: string;
  callbackUrl?: string;
}

export interface StkPushParams {
  phoneNumber: string;
  amountKes: number;
  accountReference: string; // e.g. Course Code or Referral ID
  transactionDesc: string; // e.g. "SCDS Tuition Enrolment"
  callbackUrl?: string;
}

export interface StkPushResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
  isMock?: boolean;
}

export interface StkCallbackResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  success: boolean;
}

export interface B2cPayoutParams {
  phoneNumber: string;
  amountKes: number;
  remarks: string;
  occasion?: string;
  queueTimeOutUrl?: string;
  resultUrl?: string;
}

export interface B2cPayoutResponse {
  originatorConversationId: string;
  conversationId: string;
  responseCode: string;
  responseDescription: string;
  transactionReference: string;
  isMock?: boolean;
}

export function getMpesaConfig(): MpesaConfig {
  return {
    environment:
      process.env.MPESA_ENVIRONMENT === "production" ? "production" : "sandbox",
    consumerKey: process.env.MPESA_CONSUMER_KEY || "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
    shortcode: process.env.MPESA_SHORTCODE || "174379",
    passkey:
      process.env.MPESA_PASSKEY ||
      "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    initiatorName: process.env.MPESA_INITIATOR_NAME || "testapi",
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || "",
    callbackUrl:
      process.env.MPESA_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mpesa/callback`,
  };
}

export function isMpesaConfigured(): boolean {
  const config = getMpesaConfig();
  return Boolean(config.consumerKey && config.consumerSecret && config.shortcode);
}

export function formatDarajaPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254") && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }
  if (cleaned.startsWith("07") && cleaned.length === 10) {
    return `254${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("01") && cleaned.length === 10) {
    return `254${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return `254${cleaned}`;
  }
  if (cleaned.startsWith("1") && cleaned.length === 9) {
    return `254${cleaned}`;
  }
  return cleaned;
}

export function generateDarajaTimestamp(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function generateDarajaPassword(
  shortcode: string,
  passkey: string,
  timestamp: string
): string {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export function getDarajaBaseUrl(environment: "sandbox" | "production" = "sandbox"): string {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

/**
 * Generates an OAuth bearer token from Safaricom Daraja
 */
export async function getDarajaAuthToken(config = getMpesaConfig()): Promise<string> {
  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error("M-Pesa credentials not configured.");
  }

  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`
  ).toString("base64");

  const baseUrl = getDarajaBaseUrl(config.environment);
  const res = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Daraja OAuth failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Initiates an STK Push (Lipa Na M-Pesa Online) prompt on the learner's phone
 */
export async function initiateStkPush(
  params: StkPushParams,
  config = getMpesaConfig()
): Promise<StkPushResponse> {
  const formattedPhone = formatDarajaPhone(params.phoneNumber);
  if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
    throw new Error("Invalid Kenyan phone number format for M-Pesa.");
  }

  if (params.amountKes <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  // If live credentials are not provided, run in Safe Mock / Sandbox Simulation mode
  if (!config.consumerKey || !config.consumerSecret) {
    const mockCheckoutId = `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      merchantRequestId: `MR-${Date.now()}`,
      checkoutRequestId: mockCheckoutId,
      responseCode: "0",
      responseDescription: "Success. Request accepted for processing (Dev Simulation)",
      customerMessage: `Success. An STK prompt has been simulated for ${formattedPhone} for KES ${params.amountKes.toLocaleString()}.`,
      isMock: true,
    };
  }

  const token = await getDarajaAuthToken(config);
  const timestamp = generateDarajaTimestamp();
  const password = generateDarajaPassword(config.shortcode, config.passkey, timestamp);
  const baseUrl = getDarajaBaseUrl(config.environment);

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amountKes),
    PartyA: formattedPhone,
    PartyB: config.shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: params.callbackUrl || config.callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 13),
  };

  const res = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(
      data.errorMessage || data.ResponseDescription || "Daraja STK Push failed."
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    customerMessage: data.CustomerMessage,
    isMock: false,
  };
}

/**
 * Parses and verifies an incoming Safaricom Daraja STK Push webhook payload
 */
export function parseStkCallback(payload: any): StkCallbackResult {
  const stkCallback = payload?.Body?.stkCallback;
  if (!stkCallback) {
    throw new Error("Invalid Daraja STK callback structure.");
  }

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = stkCallback;

  const success = ResultCode === 0;
  let amount: number | undefined;
  let mpesaReceiptNumber: string | undefined;
  let transactionDate: string | undefined;
  let phoneNumber: string | undefined;

  if (CallbackMetadata?.Item) {
    for (const item of CallbackMetadata.Item) {
      if (item.Name === "Amount") amount = Number(item.Value);
      if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = String(item.Value);
      if (item.Name === "TransactionDate") transactionDate = String(item.Value);
      if (item.Name === "PhoneNumber") phoneNumber = String(item.Value);
    }
  }

  return {
    merchantRequestId: MerchantRequestID,
    checkoutRequestId: CheckoutRequestID,
    resultCode: ResultCode,
    resultDesc: ResultDesc,
    amount,
    mpesaReceiptNumber,
    transactionDate,
    phoneNumber,
    success,
  };
}

/**
 * Initiates an M-Pesa B2C Payout to an ambassador's registered phone number
 */
export async function initiateB2cPayout(
  params: B2cPayoutParams,
  config = getMpesaConfig()
): Promise<B2cPayoutResponse> {
  const formattedPhone = formatDarajaPhone(params.phoneNumber);
  if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
    throw new Error("Invalid Kenyan phone number for B2C payout.");
  }

  if (params.amountKes < 500) {
    throw new Error("Minimum payout withdrawal is KES 500.");
  }

  // Simulated / Mock mode for development or sandbox without live B2C credentials
  if (
    !config.consumerKey ||
    !config.consumerSecret ||
    !config.securityCredential ||
    config.environment === "sandbox"
  ) {
    const mockRef = `SCDS${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).toUpperCase().slice(-3)}`;
    return {
      originatorConversationId: `ORIG-${Date.now()}`,
      conversationId: `CONV-${Date.now()}`,
      responseCode: "0",
      responseDescription: "Accept the service request successfully (Dev/Sandbox Mode)",
      transactionReference: mockRef,
      isMock: true,
    };
  }

  const token = await getDarajaAuthToken(config);
  const baseUrl = getDarajaBaseUrl(config.environment);

  const payload = {
    InitiatorName: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: "BusinessPayment",
    Amount: Math.round(params.amountKes),
    PartyA: config.shortcode,
    PartyB: formattedPhone,
    Remarks: params.remarks.slice(0, 100),
    QueueTimeOutURL:
      params.queueTimeOutUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c/timeout`,
    ResultURL:
      params.resultUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c/result`,
    Occasion: (params.occasion || "SCDS Commission Payout").slice(0, 100),
  };

  const res = await fetch(`${baseUrl}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(
      data.errorMessage || data.ResponseDescription || "Daraja B2C payout initiation failed."
    );
  }

  return {
    originatorConversationId: data.OriginatorConversationID,
    conversationId: data.ConversationID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    transactionReference: data.ConversationID,
    isMock: false,
  };
}

