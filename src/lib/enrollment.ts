/**
 * SCDS Official School Enrollment & Payment Gateway Deep Link Builder
 * 
 * Directs referred prospective students straight to the main school website
 * (https://samcreativedesignschool.com/enroll) with their ambassador referral attribution,
 * course selection, and pre-filled contact details so they can seamlessly:
 * 1. Create their student LMS account
 * 2. Complete cohort enrollment
 * 3. Make tuition payment (M-Pesa / Card)
 */

export interface SchoolEnrollmentParams {
  courseSlug?: string;
  referralCode?: string;
  learnerName?: string;
  learnerEmail?: string;
  learnerPhone?: string;
  source?: string;
  customEnrollmentUrl?: string;
}

export const SCDS_DEFAULT_WEBSITE = "https://samcreativedesignschool.com";

export function getSchoolBaseWebsite(): string {
  const envUrl = process.env.NEXT_PUBLIC_SCDS_MAIN_WEBSITE;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return SCDS_DEFAULT_WEBSITE;
}

/**
 * Builds the complete deep link connecting referred students to the main SCDS enrollment
 * and payment platform with referral attribution and pre-populated student parameters.
 */
export function getSchoolEnrollmentUrl(params: SchoolEnrollmentParams = {}): string {
  const baseWebsite = getSchoolBaseWebsite();

  let targetUrl: URL;

  if (params.customEnrollmentUrl && params.customEnrollmentUrl.trim().length > 0) {
    try {
      targetUrl = new URL(params.customEnrollmentUrl.trim());
    } catch {
      targetUrl = new URL(`${baseWebsite}/enroll`);
    }
  } else {
    targetUrl = new URL(`${baseWebsite}/enroll`);
  }

  // Pre-fill course query param if provided and not already present
  if (params.courseSlug && !targetUrl.searchParams.has("course")) {
    targetUrl.searchParams.set("course", params.courseSlug.trim().toLowerCase());
  }

  // Bind the ambassador attribution code so the student's enrollment and payment
  // is tracked to the referring ambassador on the school platform as well
  if (params.referralCode && params.referralCode.trim().length > 0) {
    targetUrl.searchParams.set("ref", params.referralCode.trim().toUpperCase());
  }

  // Pre-fill student contact details to eliminate friction during account creation
  if (params.learnerName && params.learnerName.trim().length > 0) {
    targetUrl.searchParams.set("name", params.learnerName.trim());
  }
  if (params.learnerEmail && params.learnerEmail.trim().length > 0) {
    targetUrl.searchParams.set("email", params.learnerEmail.trim().toLowerCase());
  }
  if (params.learnerPhone && params.learnerPhone.trim().length > 0) {
    targetUrl.searchParams.set("phone", params.learnerPhone.trim());
  }

  targetUrl.searchParams.set("source", params.source || "scds_ambassador_referral");

  return targetUrl.toString();
}
