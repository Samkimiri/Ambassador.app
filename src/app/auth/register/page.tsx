"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { ambassadorApplicationSchema } from "@/lib/validations";

export default function RegisterApplicationPage() {
  const router = useRouter();
  const { submitApplication } = useApp();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [institution, setInstitution] = useState("");
  const [occupation, setOccupation] = useState("University / College Student");
  const [academicYear, setAcademicYear] = useState("Year 2 Undergraduate");
  const [studyField, setStudyField] = useState("Graphic Design, Multimedia or Tech");
  const [audienceSize, setAudienceSize] = useState("100 - 500 peers / campus contacts");
  const [weeklyHours, setWeeklyHours] = useState("5 - 10 hours/week");
  const [deviceReadiness, setDeviceReadiness] = useState("Laptop & Smartphone with stable 4G/Wi-Fi");
  const [familiarTools, setFamiliarTools] = useState<string[]>([
    "Adobe Photoshop",
    "CapCut Video Editing",
  ]);
  const [pastAmbassadorExperience, setPastAmbassadorExperience] = useState(
    "Campus Club / Society Leader"
  );
  const [resumeUrl, setResumeUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [promotionStrategy, setPromotionStrategy] = useState("WhatsApp Student Groups & Status");
  const [targetAudience, setTargetAudience] = useState("University / College Undergraduates");
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = ambassadorApplicationSchema.safeParse({
      fullName,
      email,
      phone,
      password,
      county,
      institution,
      occupation,
      academicYear,
      studyField,
      audienceSize,
      weeklyHours,
      deviceReadiness,
      familiarTools,
      pastAmbassadorExperience,
      resumeUrl,
      instagram,
      linkedin,
      tiktok,
      twitter,
      portfolio,
      promotionStrategy,
      targetAudience,
      motivation,
      experience,
      acceptedTerms,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please check all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitApplication(parsed.data);
      router.push("/dashboard");
    } catch (err) {
      setIsSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Failed to submit application."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> Official Ambassador Onboarding
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Apply to Join the SCDS Ambassador Hub
            </h1>
            <p className="text-sm text-slate-600">
              New applicants are reviewed by SCDS management before receiving an
              active referral code and ambassador privileges.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Joy Wambui"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.ac.ke"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (M-Pesa / WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  County / Location *
                </label>
                <input
                  type="text"
                  required
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="Nairobi, Kiambu, Mombasa..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution or Organization (If applicable)
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. JKUAT, UoN, TUK, Freelance Collective"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Occupation or Student Status *
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                >
                  <option value="University / College Student">
                    University / College Student
                  </option>
                  <option value="SCDS Alumni / Student">
                    SCDS Alumni / Current Student
                  </option>
                  <option value="Campus Club / Association Representative">
                    Campus Club / Association Representative
                  </option>
                  <option value="Freelance Designer / Developer">
                    Freelance Designer / Developer
                  </option>
                  <option value="Digital Content Creator / Marketer">
                    Digital Content Creator / Marketer
                  </option>
                </select>
              </div>
            </div>

            {/* Candidate Job Qualification & Equipment Readiness */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                    Ambassador Job Readiness &amp; Equipment Assessment
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Helps SCDS evaluate your suitability, bandwidth, equipment, and campus reach for the ambassador role.
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 shrink-0">
                  Candidate Vetting
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year / Standing *
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="1st Year Undergraduate">1st Year Undergraduate</option>
                    <option value="2nd Year Undergraduate">2nd Year Undergraduate</option>
                    <option value="3rd Year Undergraduate">3rd Year Undergraduate</option>
                    <option value="4th Year / Finalist">4th Year / Finalist</option>
                    <option value="Postgraduate / Master's Student">Postgraduate / Master&apos;s Student</option>
                    <option value="Graduate / Working Professional">Graduate / Working Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Major / Field of Study *
                  </label>
                  <input
                    type="text"
                    value={studyField}
                    onChange={(e) => setStudyField(e.target.value)}
                    placeholder="e.g. Graphic Design, Computer Science, Engineering, Marketing"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Campus &amp; Online Audience Reach *
                  </label>
                  <select
                    value={audienceSize}
                    onChange={(e) => setAudienceSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="Under 100 peers (Close circle & study groups)">Under 100 peers (Close circle &amp; study groups)</option>
                    <option value="100 - 500 peers / campus contacts">100 - 500 peers / campus contacts</option>
                    <option value="500 - 2,000 peers & followers">500 - 2,000 peers &amp; followers</option>
                    <option value="2,000+ extensive network (Campus clubs, TikTok, WhatsApp channels)">2,000+ extensive network (Campus clubs, TikTok, WhatsApp channels)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weekly Time Commitment *
                  </label>
                  <select
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="3 - 5 hours/week (Part-time / Weekends)">3 - 5 hours/week (Part-time / Weekends)</option>
                    <option value="5 - 10 hours/week (Active Ambassador)">5 - 10 hours/week (Active Ambassador)</option>
                    <option value="10 - 20 hours/week (Campus Leader)">10 - 20 hours/week (Campus Leader)</option>
                    <option value="20+ hours/week (Dedicated Growth Partner)">20+ hours/week (Dedicated Growth Partner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device &amp; Internet Readiness *
                  </label>
                  <select
                    value={deviceReadiness}
                    onChange={(e) => setDeviceReadiness(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="Laptop & Smartphone with stable 4G/Wi-Fi">Laptop &amp; Smartphone with stable 4G/Wi-Fi (Optimal)</option>
                    <option value="Laptop only with stable Wi-Fi">Laptop only with stable Wi-Fi</option>
                    <option value="Smartphone only with daily mobile internet">Smartphone only with daily mobile internet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Leadership or Ambassador Experience *
                  </label>
                  <select
                    value={pastAmbassadorExperience}
                    onChange={(e) => setPastAmbassadorExperience(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="Campus Club / Society Leader">Campus Club / Society Leader</option>
                    <option value="Class Representative / Academic Lead">Class Representative / Academic Lead</option>
                    <option value="Prior Brand Ambassador / Affiliate Marketer">Prior Brand Ambassador / Affiliate Marketer</option>
                    <option value="Social Media Content Creator">Social Media Content Creator</option>
                    <option value="First-time Ambassador (Excited to learn & represent SCDS)">First-time Ambassador (Excited to learn &amp; represent SCDS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Which SCDS Skills / Creative Tools are you personally familiar with? (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Adobe Photoshop",
                    "Adobe Illustrator",
                    "UI/UX & Figma",
                    "Vibe Coding (Web Dev)",
                    "CapCut Video Editing",
                    "SolidWorks 3D CAD",
                    "AI & Prompt Engineering",
                  ].map((tool) => {
                    const isSelected = familiarTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFamiliarTools(familiarTools.filter((t) => t !== tool));
                          } else {
                            setFamiliarTools([...familiarTools, tool]);
                          }
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition ${
                          isSelected
                            ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resume / CV / Work Samples Link (Optional Google Drive, Dropbox, or PDF link)
                </label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-cv-or-portfolio.pdf"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Professional Online Presence &amp; Socials (Optional but Recommended)
              </span>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instagram Handle / Profile
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle or URL"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    TikTok Profile URL / Handle
                  </label>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@yourtiktok"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    X / Twitter Profile URL
                  </label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@yourhandle or https://x.com/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Design Portfolio / Personal Website URL
                  </label>
                  <input
                    type="text"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://yourportfolio.com or Behance / GitHub"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Outreach &amp; Promotion Strategy *
                </label>
                <select
                  value={promotionStrategy}
                  onChange={(e) => setPromotionStrategy(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                >
                  <option value="WhatsApp Student Groups & Status">WhatsApp Student Groups &amp; Status</option>
                  <option value="Campus & Class Peer Outreach">Campus &amp; Class Peer Outreach</option>
                  <option value="Instagram Reels & TikTok Content">Instagram Reels &amp; TikTok Content</option>
                  <option value="One-on-One Direct Referrals">One-on-One Direct Referrals</option>
                  <option value="Tech & Design Community Meetups">Tech &amp; Design Community Meetups</option>
                  <option value="Multi-Channel Hybrid Outreach">Multi-Channel Hybrid Outreach</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Student Audience *
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                >
                  <option value="University / College Undergraduates">University / College Undergraduates</option>
                  <option value="High School Leavers & Pre-University">High School Leavers &amp; Pre-University</option>
                  <option value="Creative Freelancers & Junior Designers">Creative Freelancers &amp; Junior Designers</option>
                  <option value="Career Switchers & Working Professionals">Career Switchers &amp; Working Professionals</option>
                  <option value="Tech, AI & Coding Enthusiasts">Tech, AI &amp; Coding Enthusiasts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivation for Becoming an SCDS Ambassador * (Min 30 chars)
              </label>
              <textarea
                rows={3}
                required
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Why do you want to represent Sam Creative Design School, and which courses excite your community most?"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevant Marketing, Leadership, or Creative Experience * (Min 20 chars)
              </label>
              <textarea
                rows={3}
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Share any student leadership roles, creative projects, WhatsApp communities, or social channels you manage..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                I accept the{" "}
                <strong>SCDS Ambassador Program Terms &amp; Privacy Notice</strong>.
                I understand that self-referrals, spam, or misrepresenting SCDS
                tuition fees will result in immediate account suspension.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting Application..."
                : "Submit Ambassador Application"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-brand-600 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

