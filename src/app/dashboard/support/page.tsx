"use client";

import React, { useState } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDateTime } from "@/lib/utils";
import { SupportRequest } from "@/types";

export default function AmbassadorSupportPage() {
  const { db, currentUser, submitSupportRequest } = useApp();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportRequest["category"]>(
    "Attribution Review"
  );
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const myTickets = db.supportRequests.filter(
    (s) => s.userId === currentUser?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    submitSupportRequest({ subject, category, message });
    setSubject("");
    setMessage("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Ambassador Assistance
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Support &amp; Attribution Help Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit a ticket for referral attribution checks, payout enquiries, or
          campus workshop asset requests.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-brand-600" /> Submit Support
            Ticket
          </h2>

          {submitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Support request logged. SCDS
              management will respond shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SupportRequest["category"])
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium"
              >
                <option value="Attribution Review">
                  Referral Attribution Review
                </option>
                <option value="Commission & Payout">
                  Commission &amp; M-Pesa Payout
                </option>
                <option value="Marketing Assets">
                  Marketing Assets &amp; Campus Events
                </option>
                <option value="Account & Level">Account &amp; Level</option>
                <option value="Technical Support">Technical Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. M-Pesa receipt verification for learner"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide learner email, M-Pesa reference, or event details..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Submit Support Ticket
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            My Support Tickets ({myTickets.length})
          </h2>
          {myTickets.length === 0 ? (
            <p className="text-xs text-slate-500">
              You have not submitted any support tickets yet.
            </p>
          ) : (
            <div className="space-y-3">
              {myTickets.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.subject}</span>
                    <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.category} · {formatDateTime(t.createdAt)}
                  </div>
                  <p className="text-slate-700">{t.message}</p>
                  {t.adminResponse && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
                      <strong>SCDS Admin Response ({t.respondedBy}):</strong>{" "}
                      {t.adminResponse}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

