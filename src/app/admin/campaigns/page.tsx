"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/context/app-context";

export default function AdminCampaignsPage() {
  const { db, saveCampaign, deleteCampaign } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [startDate, setStartDate] = useState("2026-10-20");
  const [endDate, setEndDate] = useState("2026-11-30");
  const [bonusPoints, setBonusPoints] = useState("50");
  const [bonusComm, setBonusComm] = useState("2");
  const [guidelines, setGuidelines] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (deleteConfirmId !== campaignId) {
      setDeleteConfirmId(campaignId);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === campaignId ? null : curr));
      }, 5000);
      return;
    }

    try {
      await deleteCampaign(campaignId, true);
      setDeleteConfirmId(null);
      setFeedback(`Campaign "${campaignName}" moved to Trash (48-hour recovery window).`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Failed to delete campaign: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveCampaign({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description,
      objective,
      targetAudience,
      courseIds: db.courses.map((c) => c.id),
      startDate,
      endDate,
      bonusPointsPerEnrolment: Number(bonusPoints),
      bonusCommissionPct: Number(bonusComm),
      status: "active",
      guidelines:
        guidelines ||
        "Share your unique SCDS referral link and adhere to SCDS ethical promotion standards.",
    });
    setName("");
    setDescription("");
    setObjective("");
    setTargetAudience("");
    setGuidelines("");
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Growth Campaigns
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Campaign Management ({db.campaigns.length})
        </h1>
      </div>

      {feedback && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-xs font-semibold text-brand-900 flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-brand-600 hover:text-brand-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3.5"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-600" /> Launch New Campaign
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Holiday Creative Bootcamp Drive"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Objective *
            </label>
            <input
              type="text"
              required
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. 50 verified enrolments"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Audience *
            </label>
            <input
              type="text"
              required
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Campus design & engineering clubs"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bonus Points / Enrolment
              </label>
              <input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bonus Commission %
              </label>
              <input
                type="number"
                value={bonusComm}
                onChange={(e) => setBonusComm(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Publish Campaign
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          {db.campaigns.map((camp) => (
            <div
              key={camp.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {camp.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-semibold text-emerald-700">
                    {camp.status.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                    title={deleteConfirmId === camp.id ? "Click again to confirm delete to trash" : "Move campaign to trash"}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      deleteConfirmId === camp.id
                        ? "bg-rose-700 text-white animate-pulse"
                        : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{deleteConfirmId === camp.id ? "Confirm?" : "Delete"}</span>
                  </button>
                </div>
              </div>
              <p className="text-slate-600">{camp.description}</p>
              <div className="flex flex-wrap gap-3 pt-1 text-slate-500">
                <span>
                  Dates: {camp.startDate} → {camp.endDate}
                </span>
                <span className="font-semibold text-brand-700">
                  +{camp.bonusPointsPerEnrolment} pts · +
                  {camp.bonusCommissionPct}% commission boost
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

