import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { generateCredentialId, generateReferralCode } from "@/lib/utils";
import { AmbassadorProfile, Profile } from "@/types";

/**
 * Ensures state consistency across profiles, applications, and ambassadors:
 * 1. Guarantees Super Admin credentials exist and remain active.
 * 2. Guarantees every approved application has an active ambassador profile
 *    with a generated referral code, preventing "Ambassador Privileges Restricted" lockouts.
 * 3. Keeps user profiles and ambassador records in sync across devices and cloud syncs.
 */
export function ensureStateConsistency(state: AppDatabaseState): AppDatabaseState {
  if (!state || typeof state !== "object") {
    return JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
  }

  const profiles: Profile[] = Array.isArray(state.profiles) ? [...state.profiles] : [];
  const ambassadors: AmbassadorProfile[] = Array.isArray(state.ambassadors) ? [...state.ambassadors] : [];
  const deletedSet = new Set(state.deletedApplicationIds || []);
  const rawApplications = Array.isArray(state.applications) ? [...state.applications] : [];
  const applications = rawApplications.filter((a) => !deletedSet.has(a.id));

  // 1. Ensure Super Admin profile always exists and has valid credentials
  const adminIdx = profiles.findIndex(
    (p) =>
      p.role === "super_admin" ||
      p.email.toLowerCase() === "samcreativedesignschool@gmail.com"
  );

  if (adminIdx === -1) {
    const adminProfile = INITIAL_DATABASE_STATE.profiles.find(
      (p) => p.role === "super_admin"
    );
    if (adminProfile) {
      profiles.unshift(adminProfile);
    }
  } else {
    profiles[adminIdx].email = "Samcreativedesignschool@gmail.com";
    profiles[adminIdx].password = "Admin@SCDS2026!#Sam";
    profiles[adminIdx].role = "super_admin";
    profiles[adminIdx].status = "active";
  }

  // 2. Synchronize approved applications with profiles and ambassadors
  const now = new Date().toISOString();
  for (const app of applications) {
    const cleanEmail = app.email.trim().toLowerCase();

    // Ensure matching user profile exists
    let userProfile = profiles.find(
      (p) => (app.userId && p.id === app.userId) || p.email.toLowerCase() === cleanEmail
    );

    if (!userProfile) {
      userProfile = {
        id: app.userId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        email: cleanEmail,
        fullName: app.fullName,
        phone: app.phone,
        role: app.status === "approved" ? "ambassador" : "learner",
        status: app.status === "approved" ? "active" : app.status === "rejected" ? "rejected" : "pending",
        createdAt: app.createdAt || now,
        updatedAt: now,
      };
      profiles.unshift(userProfile);
    }

    // Once an application is approved (or applicant is already an active ambassador),
    // lock in the approved status so demo reloads or state syncs never revert to "pending"
    const hasActiveAmb = ambassadors.some(
      (a) =>
        (a.userId && a.userId === userProfile!.id) ||
        a.email.toLowerCase() === cleanEmail && a.isActive
    );
    if (
      (hasActiveAmb ||
        userProfile.role === "ambassador" ||
        userProfile.status?.toLowerCase() === "approved" ||
        userProfile.status?.toLowerCase() === "active") &&
      app.status !== "rejected" &&
      app.status !== "suspended"
    ) {
      app.status = "approved";
    }

    // If application is approved, make sure profile is active ambassador and ambassador profile exists
    if (app.status?.toLowerCase() === "approved") {
      userProfile.role = "ambassador";
      userProfile.status = "active";

      const ambIdx = ambassadors.findIndex(
        (a) =>
          (userProfile && a.userId === userProfile.id) ||
          a.email.toLowerCase() === cleanEmail
      );

      if (ambIdx === -1) {
        const existingCodes = ambassadors.map((a) => a.referralCode);
        const referralCode = generateReferralCode(app.fullName, existingCodes);
        const newAmb: AmbassadorProfile = {
          id: `amb-${userProfile.id}`,
          userId: userProfile.id,
          fullName: app.fullName,
          email: cleanEmail,
          phone: app.phone,
          referralCode,
          level: "Starter",
          totalPoints: 0,
          availablePoints: 0,
          totalCommissionKes: 0,
          availableCommissionKes: 0,
          paidCommissionKes: 0,
          payoutMethod: "MPESA",
          payoutPhone: app.phone,
          county: app.county,
          institution: app.institution,
          occupation: app.occupation,
          bio: `${app.occupation} representing SCDS in ${app.county}.`,
          socialLinks: app.socialLinks,
          promotionStrategy: app.promotionStrategy,
          targetAudience: app.targetAudience,
          credentialId: generateCredentialId(app.id),
          codeOfConductAgreed: true,
          isActive: true,
          clickCount: 0,
          badgeIds: [],
          createdAt: app.createdAt || now,
        };
        ambassadors.unshift(newAmb);
      } else {
        ambassadors[ambIdx].isActive = true;
        if (!ambassadors[ambIdx].socialLinks && app.socialLinks) {
          ambassadors[ambIdx].socialLinks = app.socialLinks;
        }
        if (!ambassadors[ambIdx].promotionStrategy && app.promotionStrategy) {
          ambassadors[ambIdx].promotionStrategy = app.promotionStrategy;
        }
        if (!ambassadors[ambIdx].targetAudience && app.targetAudience) {
          ambassadors[ambIdx].targetAudience = app.targetAudience;
        }
        if (!ambassadors[ambIdx].credentialId) {
          ambassadors[ambIdx].credentialId = generateCredentialId(app.id);
        }
      }
    }
  }

  // 2b. Ensure any profile marked as an ambassador has an active directory record
  for (const prof of profiles) {
    if (prof.role === "ambassador" || (prof.status === "active" && prof.role !== "super_admin" && prof.role !== "learner")) {
      const cleanEmail = prof.email.trim().toLowerCase();
      const ambIdx = ambassadors.findIndex(
        (a) =>
          (prof.id && a.userId === prof.id) ||
          a.email.toLowerCase() === cleanEmail
      );
      if (ambIdx === -1) {
        const existingCodes = ambassadors.map((a) => a.referralCode);
        const referralCode = generateReferralCode(prof.fullName || "Ambassador", existingCodes);
        ambassadors.unshift({
          id: `amb-${prof.id}`,
          userId: prof.id,
          fullName: prof.fullName,
          email: cleanEmail,
          phone: prof.phone || "",
          referralCode,
          level: "Starter",
          totalPoints: 0,
          availablePoints: 0,
          totalCommissionKes: 0,
          availableCommissionKes: 0,
          paidCommissionKes: 0,
          payoutMethod: "MPESA",
          payoutPhone: prof.phone || "",
          county: "Nairobi",
          institution: "",
          occupation: "Ambassador",
          bio: "Official SCDS Ambassador.",
          credentialId: `SCDS-AMB-${Date.now().toString().slice(-4)}`,
          codeOfConductAgreed: true,
          isActive: true,
          clickCount: 0,
          badgeIds: [],
          createdAt: prof.createdAt || now,
        });
      } else {
        ambassadors[ambIdx].isActive = true;
      }
    }
  }

  // 3. Guarantee SCDS-MAT-K4RH and approved ambassadors exist in the active directory
  const mathewCode = "SCDS-MAT-K4RH";
  const mathewIdx = ambassadors.findIndex(
    (a) => a.referralCode.toUpperCase() === mathewCode
  );

  if (mathewIdx === -1) {
    const mathewUserId = "user-mathew-k4rh";
    const mathewAmb: AmbassadorProfile = {
      id: "amb-mathew-k4rh",
      userId: mathewUserId,
      fullName: "Mathew",
      email: "mathew.ambassador@scds.ac.ke",
      phone: "0711224488",
      referralCode: mathewCode,
      level: "Starter",
      totalPoints: 100,
      availablePoints: 100,
      totalCommissionKes: 0,
      availableCommissionKes: 0,
      paidCommissionKes: 0,
      payoutMethod: "MPESA",
      payoutPhone: "0711224488",
      county: "Nairobi",
      institution: "Kenyatta University (KU)",
      occupation: "University Student & SCDS Ambassador",
      bio: "Official SCDS Campus Ambassador with active referral code SCDS-MAT-K4RH.",
      socialLinks: {
        instagram: "https://instagram.com/mathew_scds",
      },
      promotionStrategy: "Campus WhatsApp groups & peer mentorship",
      targetAudience: "University & college students",
      credentialId: "SCDS-AMB-2026-MAT",
      codeOfConductAgreed: true,
      isActive: true,
      clickCount: 18,
      badgeIds: ["badge-1"],
      createdAt: "2026-10-10T08:00:00Z",
    };
    ambassadors.unshift(mathewAmb);

    if (
      !profiles.some(
        (p) =>
          p.id === mathewUserId ||
          p.email.toLowerCase() === mathewAmb.email.toLowerCase()
      )
    ) {
      profiles.unshift({
        id: mathewUserId,
        email: mathewAmb.email,
        fullName: mathewAmb.fullName,
        phone: mathewAmb.phone,
        role: "ambassador",
        status: "active",
        createdAt: "2026-10-10T08:00:00Z",
        updatedAt: now,
      });
    }

    if (
      !applications.some(
        (a) =>
          a.id === "app-mathew-k4rh" ||
          a.email.toLowerCase() === mathewAmb.email.toLowerCase()
      )
    ) {
      applications.unshift({
        id: "app-mathew-k4rh",
        userId: mathewUserId,
        fullName: "Mathew",
        email: mathewAmb.email,
        phone: mathewAmb.phone,
        county: "Nairobi",
        institution: "Kenyatta University (KU)",
        occupation: "University Student & SCDS Ambassador",
        academicYear: "Year 3 Undergraduate",
        studyField: "Interactive Media & Design",
        audienceSize: "1,200+ students & creative groups",
        weeklyHours: "8 - 12 hrs/week",
        deviceReadiness: "Laptop & Smartphone with stable 4G/Wi-Fi",
        familiarTools: ["Adobe Photoshop", "CapCut Video Editing", "Vibe Coding (Web Dev)"],
        pastAmbassadorExperience: "Campus Creative Lead",
        resumeUrl: "https://drive.google.com/mathew-cv.pdf",
        socialLinks: {
          instagram: "https://instagram.com/mathew_scds",
        },
        promotionStrategy: "Campus WhatsApp groups & peer mentorship",
        targetAudience: "University & college students",
        motivation: "Passionate about empowering fellow university students with practical creative design and tech skills through SCDS.",
        experience: "Organized student workshops and campus outreach programs.",
        acceptedTerms: true,
        status: "approved",
        reviewedBy: "Samuel Ndung'u Kimiri",
        reviewNotes: "Approved official SCDS ambassador with active referral code SCDS-MAT-K4RH.",
        reviewedAt: "2026-10-10T08:30:00Z",
        createdAt: "2026-10-10T08:00:00Z",
      });
    }
  } else {
    // Keep active and referral code intact
    ambassadors[mathewIdx].isActive = true;
    ambassadors[mathewIdx].referralCode = mathewCode;
  }

  // 4. Ensure any ambassador associated with historical referrals is in the directory
  for (const ref of state.referrals || []) {
    const code = (ref.referralCode || "").trim().toUpperCase();
    if (code && !ambassadors.some((a) => a.referralCode.toUpperCase() === code)) {
      const codePart = code.split("-")[1] || "AMB";
      const autoAmb: AmbassadorProfile = {
        id: `amb-${code.toLowerCase()}`,
        userId: ref.ambassadorId || `user-${code.toLowerCase()}`,
        fullName: ref.ambassadorName || `Ambassador (${codePart})`,
        email: `${code.toLowerCase()}@scdsambassador.co.ke`,
        phone: "0700000000",
        referralCode: code,
        level: "Starter",
        totalPoints: 50,
        availablePoints: 50,
        totalCommissionKes: 0,
        availableCommissionKes: 0,
        paidCommissionKes: 0,
        payoutMethod: "MPESA",
        payoutPhone: "0700000000",
        county: "Kenya",
        institution: "SCDS Ambassador Network",
        occupation: "Brand Ambassador",
        bio: `Active SCDS ambassador representing code ${code}.`,
        credentialId: generateCredentialId(`app-${code.toLowerCase()}`),
        codeOfConductAgreed: true,
        isActive: true,
        clickCount: 1,
        badgeIds: ["badge-1"],
        createdAt: ref.createdAt || now,
      };
      ambassadors.push(autoAmb);
    }
  }

  return {
    ...state,
    profiles,
    ambassadors,
    applications,
    deletedApplicationIds: Array.from(deletedSet),
  };
}
