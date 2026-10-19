"use client";

import React, { useState } from "react";
import { Megaphone } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDateTime } from "@/lib/utils";

export default function AdminAnnouncementsPage() {
  const { db, publishAnnouncement } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    publishAnnouncement({
      title,
      body,
      audience: "all",
      isPinned,
    });
    setTitle("");
    setBody("");
    setIsPinned(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Community Communications
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Broadcast Announcements ({db.announcements.length})
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handlePublish}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-brand-600" /> Publish
            Announcement
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cohort 11 Early-Bird Deadline Friday"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Body *
            </label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-slate-300 text-brand-600"
            />
            Pin to top of Ambassador Dashboard
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Publish Broadcast
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {db.announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {ann.title}
                </h3>
                <span className="text-slate-400">
                  {formatDateTime(ann.publishedAt)}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{ann.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

