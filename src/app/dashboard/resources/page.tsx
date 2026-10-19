"use client";

import React, { useState } from "react";
import { Check, Copy, Search, Share2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate } from "@/lib/utils";

export default function AmbassadorResourcesPage() {
  const { db, currentAmbassador } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const amb = currentAmbassador || db.ambassadors[0];
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const referralUrl = `${origin}/join?ref=${amb.referralCode}`;

  const publishedAssets = db.marketingAssets.filter(
    (a) => a.status === "published"
  );
  const categories = [
    "ALL",
    ...Array.from(new Set(publishedAssets.map((a) => a.category))),
  ];

  const filtered = publishedAssets.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "ALL" || a.category === category;
    return matchesSearch && matchesCat;
  });

  const personalizeCaption = (template: string) => {
    return template
      .replace(/\{\{REFERRAL_LINK\}\}/g, referralUrl)
      .replace(/\{\{REFERRAL_CODE\}\}/g, amb.referralCode);
  };

  const handleCopyCaption = (id: string, template: string) => {
    const text = personalizeCaption(template);
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Official Promotional Kit
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            SCDS Marketing Resource Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every caption is automatically personalized with your referral link{" "}
            <code className="font-mono text-brand-700">{referralUrl}</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posters, captions..."
              className="rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-600 focus:outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Resource Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((asset) => {
          const personalized = personalizeCaption(asset.captionTemplate);
          return (
            <div
              key={asset.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                    {asset.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Uploaded {formatDate(asset.createdAt)}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900">
                  {asset.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {asset.description}
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Personalized Ready-to-Share Caption
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                    {personalized}
                  </pre>
                </div>

                <div className="text-[11px] text-slate-500">
                  <strong>Usage Instructions:</strong> {asset.usageInstructions}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCaption(asset.id, asset.captionTemplate)
                  }
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {copiedId === asset.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                      With Referral Link!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Personalized Caption
                    </>
                  )}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(personalized)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

