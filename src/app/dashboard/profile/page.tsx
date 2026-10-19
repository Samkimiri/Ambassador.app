"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import { LevelBadge } from "@/components/ui/status-badge";

export default function AmbassadorProfilePage() {
  const { db, currentAmbassador, updateAmbassadorProfile } = useApp();
  const amb = currentAmbassador || db.ambassadors[0];

  const [phone, setPhone] = useState(amb.phone);
  const [county, setCounty] = useState(amb.county);
  const [institution, setInstitution] = useState(amb.institution);
  const [bio, setBio] = useState(amb.bio);
  const [payoutPhone, setPayoutPhone] = useState(amb.payoutPhone || amb.phone);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAmbassadorProfile({
      phone,
      county,
      institution,
      bio,
      payoutPhone,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Account &amp; Payout Settings
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          My Ambassador Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update permitted profile information and your registered M-Pesa payout phone number.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{amb.fullName}</h2>
            <p className="text-xs text-slate-500">{amb.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge level={amb.level} />
            <span className="rounded-lg bg-slate-950 px-3 py-1 text-xs font-mono font-bold text-brand-400">
              {amb.referralCode}
            </span>
          </div>
        </div>

        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Profile settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name (Admin Verified)
              </label>
              <input
                type="text"
                disabled
                value={amb.fullName}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-mono text-slate-500"
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered M-Pesa Payout Number
              </label>
              <input
                type="tel"
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                County / City
              </label>
              <input
                type="text"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institution / Organization
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Ambassador Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700 shrink-0" />
            Role &amp; Ambassador Tier are strictly managed by SCDS Super
            Administrators and cannot be self-escalated.
          </div>

          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
}

