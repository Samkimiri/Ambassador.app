/**
 * SCDS Ambassador Hub — Transactional Email Notification Service
 * Adheres to SCDS Brand Guidelines:
 * - Primary Electric Blue (#0048E8)
 * - Secondary Golden Yellow (#F8B820)
 * - Deep Navy (#0B1F50)
 * - Supporting Charcoal (#252525) & Off-White (#F5F8FF)
 */

import { getAppUrl } from "@/lib/utils";

export interface EmailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  isMock: boolean;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Base email layout wrapper with SCDS brand header, cards, and footer
 */
export function wrapInScdsEmailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F8FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #252525; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(11, 31, 80, 0.08); border: 1px solid #E6EEFF; }
    .header { background: linear-gradient(135deg, #0B1F50 0%, #0048E8 100%); padding: 32px 28px; text-align: left; }
    .brand-badge { display: inline-block; background-color: #F8B820; color: #0B1F50; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; color: #C5D8FF; font-size: 14px; }
    .content { padding: 32px 28px; font-size: 15px; line-height: 1.6; color: #252525; }
    .highlight-card { background-color: #F5F8FF; border-left: 4px solid #0048E8; padding: 18px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .code-box { background-color: #0B1F50; color: #F8B820; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; font-family: monospace; }
    .button { display: inline-block; background-color: #0048E8; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .footer { background-color: #F5F8FF; border-top: 1px solid #E6EEFF; padding: 24px 28px; text-align: center; font-size: 12px; color: #6B7280; }
    .footer a { color: #0048E8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="brand-badge">SCDS Ambassador Hub</span>
      <h1>${title}</h1>
      <p>Sam Creative Design School — Exceptional, Strategic & Realistic</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p><strong>Sam Creative Design School (SCDS)</strong></p>
      <p>Nairobi, Kenya &bull; <a href="https://samcreativedesignschool.com">samcreativedesignschool.com</a></p>
      <p style="margin-top: 8px;">You are receiving this notification because you are a registered ambassador or prospective student on the SCDS platform.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Ambassador Welcome & Application Approved
 */
export function buildApplicationApprovedEmail(params: {
  fullName: string;
  referralCode: string;
  dashboardUrl?: string;
}): EmailMessage {
  const url = params.dashboardUrl || `${getAppUrl()}/dashboard`;
  const shareLink = `${getAppUrl()}/join?ref=${params.referralCode}`;

  const safeName = escapeHtml(params.fullName);
  const safeCode = escapeHtml(params.referralCode);

  const html = wrapInScdsEmailLayout(
    "Welcome to SCDS Ambassador Hub!",
    `<p>Dear <strong>${safeName}</strong>,</p>
     <p>Congratulations! Your application to represent <strong>Sam Creative Design School (SCDS)</strong> as a Student Ambassador has been approved.</p>
     
     <div class="highlight-card">
       <p style="margin: 0; font-weight: 700; color: #0048E8;">Your Official Referral Code:</p>
       <div class="code-box">${safeCode}</div>
       <p style="margin: 0; font-size: 13px; color: #4B5563;">
         Share your unique link: <br>
         <a href="${shareLink}" style="color: #0048E8; word-break: break-all;">${shareLink}</a>
       </p>
     </div>

     <p>As an active Ambassador, you can now:</p>
     <ul>
       <li>Access the official marketing asset library (posters, reels, course brochures).</li>
       <li>Earn points and up to <strong>15% commission</strong> on every verified student enrolment.</li>
       <li>Request direct M-Pesa payouts straight from your dashboard.</li>
     </ul>

     <p style="text-align: center;">
       <a href="${url}" class="button">Open Your Ambassador Dashboard &rarr;</a>
     </p>

     <p>Best regards,<br><strong>SCDS Student Leadership & Community Team</strong></p>`
  );

  return {
    to: "",
    toName: params.fullName,
    subject: "Welcome to SCDS Ambassador Hub — Application Approved!",
    html,
  };
}

/**
 * 2. Enrolment Verified & Commission Reward Email
 */
export function buildEnrolmentVerifiedEmail(params: {
  ambassadorName: string;
  learnerName: string;
  courseTitle: string;
  pointsEarned: number;
  commissionKes: number;
  newAvailableCommissionKes: number;
  dashboardUrl?: string;
}): EmailMessage {
  const url = params.dashboardUrl || `${getAppUrl()}/dashboard/rewards`;

  const html = wrapInScdsEmailLayout(
    "Enrolment Verified — Commission Awarded!",
    `<p>Dear <strong>${params.ambassadorName}</strong>,</p>
     <p>Great news! Your referred student, <strong>${params.learnerName}</strong>, has successfully paid their tuition fees for <strong>${params.courseTitle}</strong> and their enrolment is now verified.</p>
     
     <div class="highlight-card">
       <h3 style="margin: 0 0 10px 0; color: #0B1F50;">Reward Summary:</h3>
       <table style="width: 100%; border-collapse: collapse;">
         <tr>
           <td style="padding: 6px 0; color: #4B5563;">Points Awarded:</td>
           <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0048E8;">+${params.pointsEarned.toLocaleString()} Pts</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; color: #4B5563;">Commission Credited:</td>
           <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0048E8;">KES ${params.commissionKes.toLocaleString()}</td>
         </tr>
         <tr style="border-top: 1px solid #C5D8FF;">
           <td style="padding: 10px 0 0 0; font-weight: 700; color: #0B1F50;">Total Available Balance:</td>
           <td style="padding: 10px 0 0 0; text-align: right; font-weight: 800; color: #D99B0C; font-size: 17px;">KES ${params.newAvailableCommissionKes.toLocaleString()}</td>
         </tr>
       </table>
     </div>

     <p style="text-align: center;">
       <a href="${url}" class="button">View Balance & Payout Options &rarr;</a>
     </p>

     <p>Keep sharing and inspiring future designers and developers!<br><strong>SCDS Ambassador Team</strong></p>`
  );

  return {
    to: "",
    toName: params.ambassadorName,
    subject: `Enrolment Verified: KES ${params.commissionKes.toLocaleString()} Credited to Your Account!`,
    html,
  };
}

/**
 * 3. M-Pesa Payout Disbursement Confirmation Email
 */
export function buildPayoutDisbursedEmail(params: {
  ambassadorName: string;
  amountKes: number;
  recipientPhone: string;
  transactionReference: string;
  paymentMethod: string;
}): EmailMessage {
  const html = wrapInScdsEmailLayout(
    "Payout Disbursement Confirmed",
    `<p>Dear <strong>${params.ambassadorName}</strong>,</p>
     <p>Your withdrawal request has been approved and processed successfully via <strong>${params.paymentMethod}</strong>.</p>
     
     <div class="highlight-card">
       <table style="width: 100%; border-collapse: collapse;">
         <tr>
           <td style="padding: 6px 0; color: #4B5563;">Disbursed Amount:</td>
           <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #0048E8; font-size: 18px;">KES ${params.amountKes.toLocaleString()}</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; color: #4B5563;">Recipient Phone:</td>
           <td style="padding: 6px 0; text-align: right; font-weight: 600;">${params.recipientPhone}</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; color: #4B5563;">Transaction Reference:</td>
           <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0B1F50;">${params.transactionReference}</td>
         </tr>
       </table>
     </div>

     <p>The funds should reflect in your M-Pesa account immediately. Thank you for your continued dedication to empowering students at SCDS!</p>
     <p>Best regards,<br><strong>SCDS Finance & Operations</strong></p>`
  );

  return {
    to: "",
    toName: params.ambassadorName,
    subject: `SCDS Payout Processed: KES ${params.amountKes.toLocaleString()} (${params.transactionReference})`,
    html,
  };
}

/**
 * 4. Password Reset Email
 */
export function buildPasswordResetEmail(params: {
  fullName: string;
  resetUrl: string;
  resetCode?: string;
  expiresInMinutes?: number;
}): EmailMessage {
  const expires = params.expiresInMinutes ?? 30;
  const safeName = escapeHtml(params.fullName);
  const safeCode = params.resetCode ? escapeHtml(params.resetCode) : "";
  const html = wrapInScdsEmailLayout(
    "Reset Your Password",
    `<p>Dear <strong>${safeName}</strong>,</p>
     <p>We received a request to reset the password for your <strong>SCDS Ambassador Hub</strong> account.</p>
     ${
       safeCode
         ? `<div class="highlight-card">
              <p style="margin: 0; font-weight: 700; color: #0048E8;">Your 6-Digit Reset Code:</p>
              <div class="code-box">${safeCode}</div>
              <p style="margin: 0; font-size: 13px; color: #4B5563;">Enter this code on the password reset page, or click the button below.</p>
            </div>`
         : ""
     }
     <p style="text-align: center;">
       <a href="${params.resetUrl}" class="button">Reset My Password &rarr;</a>
     </p>
     <div class="highlight-card">
       <p style="margin: 0 0 6px 0; font-weight: 700; color: #0B1F50;">Security Details:</p>
       <p style="margin: 0; font-size: 13px; color: #4B5563;">
         This code and link will expire in <strong>${expires} minutes</strong>. If you did not request a password reset, you can safely ignore this email.
       </p>
       <p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280; word-break: break-all;">
         Or copy and paste this link: <a href="${params.resetUrl}" style="color: #0048E8;">${params.resetUrl}</a>
       </p>
     </div>
     <p>Best regards,<br><strong>SCDS Ambassador Hub Security Team</strong></p>`
  );

  return {
    to: "",
    toName: params.fullName,
    subject: safeCode
      ? `Your SCDS Password Reset Code: ${safeCode}`
      : "Reset Your SCDS Ambassador Hub Password",
    html,
    text: `${safeCode ? `Your 6-digit password reset code is ${safeCode}. ` : ""}Reset your SCDS Ambassador Hub password using this link (expires in ${expires} minutes): ${params.resetUrl}`,
  };
}

/**
 * Dispatch an email message via Resend, Sendgrid, or safe dev mock fallback
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const primaryFrom =
      process.env.EMAIL_FROM?.trim() ||
      "SCDS Ambassador Hub <ambassadors@samcreativedesignschool.com>";
    const fallbackFrom = "SCDS Ambassador Hub <onboarding@resend.dev>";

    const dispatchViaResend = async (fromAddress: string) => {
      return fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          ...(message.text ? { text: message.text } : {}),
        }),
      });
    };

    try {
      let res = await dispatchViaResend(primaryFrom);

      // If custom domain is not yet verified in Resend, automatically retry with Resend's default sender
      if (!res.ok && primaryFrom !== fallbackFrom) {
        const firstErrText = await res.text();
        if (
          res.status === 403 ||
          firstErrText.toLowerCase().includes("not verified") ||
          firstErrText.toLowerCase().includes("domain")
        ) {
          const retryRes = await dispatchViaResend(fallbackFrom);
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            return { success: true, messageId: retryData.id, isMock: false };
          }
          const retryErrText = await retryRes.text();
          let parsedMsg = retryErrText;
          try {
            const j = JSON.parse(retryErrText) as { message?: string };
            if (j?.message) parsedMsg = j.message;
          } catch {
            // keep raw text
          }
          return { success: false, error: parsedMsg, isMock: false };
        }

        let parsedMsg = firstErrText;
        try {
          const j = JSON.parse(firstErrText) as { message?: string };
          if (j?.message) parsedMsg = j.message;
        } catch {
          // keep raw text
        }
        return { success: false, error: parsedMsg, isMock: false };
      }

      if (!res.ok) {
        const errorText = await res.text();
        let parsedMsg = errorText;
        try {
          const j = JSON.parse(errorText) as { message?: string };
          if (j?.message) parsedMsg = j.message;
        } catch {
          // keep raw text
        }
        return { success: false, error: parsedMsg, isMock: false };
      }

      const data = await res.json();
      return { success: true, messageId: data.id, isMock: false };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to dispatch email",
        isMock: false,
      };
    }
  }

  // Graceful development simulation log
  const mockId = `mock-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    success: true,
    messageId: mockId,
    isMock: true,
  };
}

