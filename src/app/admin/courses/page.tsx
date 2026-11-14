"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatKes } from "@/lib/utils";

export default function AdminCoursesPage() {
  const { db, saveCourse, deleteCourse } = useApp();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [category, setCategory] = useState("Design Software");
  const [duration, setDuration] = useState("4 Weeks (30 Days)");
  const [publishedFeeKes, setPublishedFeeKes] = useState("2500");
  const [commissionRatePct, setCommissionRatePct] = useState("15");
  const [pointsReward, setPointsReward] = useState("250");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (deleteConfirmId !== courseId) {
      setDeleteConfirmId(courseId);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === courseId ? null : curr));
      }, 5000);
      return;
    }

    try {
      await deleteCourse(courseId, true);
      setDeleteConfirmId(null);
      setFeedback(`Course "${courseTitle}" moved to Trash (48-hour recovery window).`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Failed to delete course: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    saveCourse({
      id: editingId || undefined,
      title,
      slug,
      shortCode: shortCode || title.slice(0, 2).toUpperCase(),
      category,
      duration,
      publishedFeeKes: Number(publishedFeeKes),
      currency: "KES",
      commissionRatePct: Number(commissionRatePct),
      pointsReward: Number(pointsReward),
      description,
      enrollmentUrl: `https://samcreativedesignschool.com/enroll?course=${slug}`,
      highlights: ["Practical Projects", "LMS Access", "Verified Certificate"],
      status: "published",
      nextIntake: "Cohort 11 · Oct 2026",
    });
    setTitle("");
    setSlug("");
    setShortCode("");
    setDescription("");
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Curriculum &amp; Tuition Configuration
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Course Management ({db.courses.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update course fees, durations, commission percentages, or add new SCDS
          programs at any time.
        </p>
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
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3.5"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-600" />
            {editingId ? "Update Course" : "Add / Configure Course"}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!editingId) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                  );
                }
              }}
              placeholder="e.g. Blender 3D Animation"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Code
              </label>
              <input
                type="text"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                placeholder="3D"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fee (KES)
              </label>
              <input
                type="number"
                value={publishedFeeKes}
                onChange={(e) => setPublishedFeeKes(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commission %
              </label>
              <input
                type="number"
                value={commissionRatePct}
                onChange={(e) => setCommissionRatePct(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Points Reward
              </label>
              <input
                type="number"
                value={pointsReward}
                onChange={(e) => setPointsReward(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-brand-600 py-2.5 text-sm sm:text-xs font-semibold text-white hover:bg-brand-700"
          >
            {editingId ? "Save Course Updates" : "Save Course"}
          </button>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="sm:hidden px-4 py-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100">
            Swipe horizontally to view full table →
          </div>
          <div className="overflow-x-auto max-w-full">
            <table className="w-full min-w-[540px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Published Fee</th>
                <th className="py-3 px-4">Commission / Points</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.courses.map((c) => (
                <tr key={c.id}>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.title}</div>
                    <div className="text-slate-500">{c.category}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{c.duration}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatKes(c.publishedFeeKes)}
                  </td>
                  <td className="py-3.5 px-4 text-brand-700 font-semibold">
                    {c.commissionRatePct}% · {c.pointsReward} pts
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setTitle(c.title);
                          setSlug(c.slug);
                          setShortCode(c.shortCode);
                          setCategory(c.category);
                          setDuration(c.duration);
                          setPublishedFeeKes(String(c.publishedFeeKes));
                          setCommissionRatePct(String(c.commissionRatePct));
                          setPointsReward(String(c.pointsReward));
                          setDescription(c.description);
                        }}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                        title={deleteConfirmId === c.id ? "Click again to confirm delete to trash" : "Move course to trash"}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          deleteConfirmId === c.id
                            ? "bg-rose-700 text-white animate-pulse"
                            : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{deleteConfirmId === c.id ? "Confirm?" : "Delete"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

