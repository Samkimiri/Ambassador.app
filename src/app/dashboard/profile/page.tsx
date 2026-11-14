"use client";

import React, { useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { LevelBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

export default function AmbassadorProfilePage() {
  const { db, currentAmbassador, updateAmbassadorProfile } = useApp();
  const amb = currentAmbassador || db.ambassadors[0];

  const [phone, setPhone] = useState(amb.phone);
  const [county, setCounty] = useState(amb.county);
  const [institution, setInstitution] = useState(amb.institution);
  const [bio, setBio] = useState(amb.bio);
  const [payoutPhone, setPayoutPhone] = useState(amb.payoutPhone || amb.phone);

  const [linkedin, setLinkedin] = useState(amb.socialLinks?.linkedin || "");
  const [instagram, setInstagram] = useState(amb.socialLinks?.instagram || "");
  const [tiktok, setTiktok] = useState(amb.socialLinks?.tiktok || "");
  const [twitter, setTwitter] = useState(amb.socialLinks?.twitter || "");
  const [portfolio, setPortfolio] = useState(amb.socialLinks?.portfolio || "");

  const [promotionStrategy, setPromotionStrategy] = useState(
    amb.promotionStrategy || "WhatsApp Student Groups & Status"
  );
  const [targetAudience, setTargetAudience] = useState(
    amb.targetAudience || "University / College Undergraduates"
  );

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAmbassadorProfile({
      phone,
      county,
      institution,
      bio,
      payoutPhone,
      socialLinks: {
        linkedin: linkedin.trim() || undefined,
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        twitter: twitter.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
      },
      promotionStrategy,
      targetAudience,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const credentialId =
    amb.credentialId || `SCDS-AMB-2026-${amb.id.slice(-4).toUpperCase()}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Official Identity &amp; Payout Settings
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          My Ambassador Profile &amp; Digital Credential
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your verified contact details, online social portfolio, registered M-Pesa payout number, and campus strategy.
        </p>
      </div>

      {/* Official SCDS Ambassador Digital ID Card */}
      <div className="rounded-2xl border-2 border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md">
                SCDS
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 block">
                  Sam Creative Design School
                </span>
                <span className="text-xs text-slate-400">Official Brand Ambassador ID</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Verifiable Credential</div>
              <div className="font-mono text-xs sm:text-sm font-bold text-brand-400">
                {credentialId}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-1.5">
                <span>{amb.fullName}</span>
                <BadgeCheck className="h-5 w-5 text-brand-400" />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {amb.occupation} · {amb.institution || "Independent"} · {amb.county}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <LevelBadge level={amb.level} />
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Verified Active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Referral Code:</span>
                <span className="font-mono font-bold text-brand-300">{amb.referralCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">M-Pesa Line:</span>
                <span className="font-semibold text-white">{amb.payoutPhone || amb.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issued On:</span>
                <span className="text-slate-300">{formatDate(amb.createdAt)}</span>
              </div>
              <div className="border-t border-slate-800 pt-1 text-[11px] text-brand-400 font-medium">
                Authorized for Cohort 11 Admissions Referrals
              </div>
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Profile settings and social accounts updated successfully.</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" /> Basic Account Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Admin Verified)
                </label>
                <input
                  type="text"
                  disabled
                  value={amb.fullName}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Code (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={amb.referralCode}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered M-Pesa Payout Number (Safaricom) *
                </label>
                <input
                  type="tel"
                  required
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Automated B2C commission disbursements are paid directly to this number.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  County / Location
                </label>
                <input
                  type="text"
                  required
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus / Institution / Organization
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Nairobi, Strathmore, TUK"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-600" /> Public Social Media &amp; Design Profiles
            </h2>
            <p className="text-xs text-slate-500">
              Sharing your verified handles allows SCDS management to amplify your content and co-brand campaigns.
            </p>

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
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instagram Handle / URL
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
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
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
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
                  placeholder="@yourhandle"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portfolio / Personal Website URL
                </label>
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yourportfolio.com or Behance"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Campaign Strategy & Audience */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" /> Outreach Strategy &amp; Audience Segment
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Promotion Channel
                </label>
                <select
                  value={promotionStrategy}
                  onChange={(e) => setPromotionStrategy(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
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
                  Target Student Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
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
                Ambassador Bio / Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a brief bio about your creative journey..."
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-500 transition"
            >
              Save Profile &amp; Social Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
