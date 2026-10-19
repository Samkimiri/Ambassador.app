"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/context/app-context";
import { AssetCategory } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminResourcesPage() {
  const { db, saveMarketingAsset } = useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AssetCategory>("Course Posters");
  const [description, setDescription] = useState("");
  const [captionTemplate, setCaptionTemplate] = useState(
    "Join Sam Creative Design School Cohort 11! Explore practical courses here: {{REFERRAL_LINK}} (Code: {{REFERRAL_CODE}})"
  );
  const [usageInstructions, setUsageInstructions] = useState(
    "Share on WhatsApp Status, Instagram, or campus groups."
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !captionTemplate.trim()) return;
    saveMarketingAsset({
      title,
      category,
      description,
      captionTemplate,
      usageInstructions,
      previewType: "poster",
      status: "published",
    });
    setTitle("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Brand &amp; Asset Publishing
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Marketing Resource Library Management ({db.marketingAssets.length})
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3.5"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-600" /> Publish Official Resource
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asset Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Illustrator Vector Logo Pack Flier"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AssetCategory)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              <option value="Course Posters">Course Posters</option>
              <option value="Social Media Graphics">Social Media Graphics</option>
              <option value="Short Promotional Videos">
                Short Promotional Videos
              </option>
              <option value="WhatsApp Promotional Content">
                WhatsApp Promotional Content
              </option>
              <option value="Course Descriptions">Course Descriptions</option>
              <option value="Ready-to-Use Captions">Ready-to-Use Captions</option>
              <option value="Approved Testimonials">
                Approved Testimonials
              </option>
              <option value="Campaign Guidelines">Campaign Guidelines</option>
              <option value="Brand Assets">Brand Assets</option>
              <option value="Referral Campaign Materials">
                Referral Campaign Materials
              </option>
            </select>
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Caption Template (Supports {"{{REFERRAL_LINK}}"} &amp;{" "}
              {"{{REFERRAL_CODE}}"}) *
            </label>
            <textarea
              rows={4}
              required
              value={captionTemplate}
              onChange={(e) => setCaptionTemplate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Usage Instructions
            </label>
            <input
              type="text"
              value={usageInstructions}
              onChange={(e) => setUsageInstructions(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Publish Resource
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {db.marketingAssets.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 font-semibold text-brand-700">
                  {a.category}
                </span>
                <span className="text-slate-400">
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
              <p className="text-slate-600">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

