import { describe, expect, it } from "vitest";
import { getSchoolEnrollmentUrl, SCDS_DEFAULT_WEBSITE } from "@/lib/enrollment";

describe("SCDS School Enrollment & Payment Gateway Deep Linking", () => {
  it("generates default school enrollment URL when no parameters are provided", () => {
    const url = getSchoolEnrollmentUrl({});
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://samcreativedesignschool.com");
    expect(parsed.pathname).toBe("/enroll");
    expect(parsed.searchParams.get("source")).toBe("scds_ambassador_referral");
  });

  it("appends referral code, course slug, and student details correctly", () => {
    const url = getSchoolEnrollmentUrl({
      courseSlug: "vibe-coding-web-dev",
      referralCode: "scds-dan-99k1",
      learnerName: "Mercy Wanjiku",
      learnerEmail: "mercy.wanjiku@example.com",
      learnerPhone: "0711223344",
      source: "scds_ambassador_hub_join",
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/enroll");
    expect(parsed.searchParams.get("course")).toBe("vibe-coding-web-dev");
    expect(parsed.searchParams.get("ref")).toBe("SCDS-DAN-99K1");
    expect(parsed.searchParams.get("name")).toBe("Mercy Wanjiku");
    expect(parsed.searchParams.get("email")).toBe("mercy.wanjiku@example.com");
    expect(parsed.searchParams.get("phone")).toBe("0711223344");
    expect(parsed.searchParams.get("source")).toBe("scds_ambassador_hub_join");
  });

  it("preserves customEnrollmentUrl from course database while attaching student & referral parameters", () => {
    const customUrl = "https://samcreativedesignschool.com/enroll?course=photoshop-masterclass";
    const url = getSchoolEnrollmentUrl({
      customEnrollmentUrl: customUrl,
      referralCode: "SCDS-SAM-1234",
      learnerName: "Kevin Otieno",
      learnerEmail: "kevin@gmail.com",
      learnerPhone: "0722334455",
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://samcreativedesignschool.com");
    expect(parsed.pathname).toBe("/enroll");
    expect(parsed.searchParams.get("course")).toBe("photoshop-masterclass");
    expect(parsed.searchParams.get("ref")).toBe("SCDS-SAM-1234");
    expect(parsed.searchParams.get("name")).toBe("Kevin Otieno");
    expect(parsed.searchParams.get("email")).toBe("kevin@gmail.com");
    expect(parsed.searchParams.get("phone")).toBe("0722334455");
  });

  it("handles malformed customEnrollmentUrl gracefully by falling back to base domain /enroll", () => {
    const url = getSchoolEnrollmentUrl({
      customEnrollmentUrl: "not-a-valid-url",
      courseSlug: "capcut-masterclass",
      referralCode: "SCDS-TEST-7777",
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe(SCDS_DEFAULT_WEBSITE);
    expect(parsed.pathname).toBe("/enroll");
    expect(parsed.searchParams.get("course")).toBe("capcut-masterclass");
    expect(parsed.searchParams.get("ref")).toBe("SCDS-TEST-7777");
  });
});
