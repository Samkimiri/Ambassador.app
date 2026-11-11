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

