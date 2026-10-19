"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { formatKes } from "@/lib/utils";

export default function CoursesPage() {
  const { db, capturedReferralCode } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const published = db.courses.filter((c) => c.status === "published");
  const categories = ["ALL", ...Array.from(new Set(published.map((c) => c.category)))];

  const filtered = published.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "ALL" || c.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-12 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Sam Creative Design School
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              Official Practical Courses
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Hands-on mentorship, weekly portfolio assignments, 24/7 LMS access, and verified certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-brand-400">
                    {course.shortCode}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {course.duration}
                  </span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                  {course.category}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {course.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {course.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Tuition Fee</div>
                    <div className="text-lg font-extrabold text-slate-900">
                      {formatKes(course.publishedFeeKes)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Next Intake</div>
                    <div className="text-xs font-semibold text-emerald-700">
                      {course.nextIntake}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="rounded-xl border border-slate-300 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Course Details
                  </Link>
                  <Link
                    href={`/join?course=${course.slug}${
                      capturedReferralCode ? `&ref=${capturedReferralCode}` : ""
                    }`}
                    className="rounded-xl bg-brand-600 py-2.5 text-center text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Enquire / Enroll
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

