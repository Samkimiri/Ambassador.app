"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Password Reset Instructions Sent
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an SCDS Ambassador Hub account exists for{" "}
                <strong>{email}</strong>, password recovery instructions have
                been dispatched.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-brand-400">
                  <Mail className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 pt-2">
                  Reset Your Password
                </h1>
                <p className="text-xs text-slate-500">
                  Enter the email address associated with your SCDS Ambassador
                  account.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Send Recovery Link
                </button>
              </form>

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

