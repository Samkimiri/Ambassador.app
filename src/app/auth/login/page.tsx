"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { loginSchema } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid credentials.");
      return;
    }

    setSubmitting(true);
    try {
      const serverRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });
      if (serverRes.ok) {
        const res = signInWithEmail(parsed.data.email, parsed.data.password);
        if (!res.ok || !res.user) {
          setError(res.error || "Sign-in failed.");
          return;
        }
        router.push(res.user.role === "super_admin" ? "/admin" : "/dashboard");
        return;
      }

      const errJson = (await serverRes.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (serverRes.status === 401 || serverRes.status === 403 || serverRes.status === 429) {
        setError(errJson?.error || "Invalid email or password.");
        return;
      }
    } catch {
      // Offline fallback to local state verification
    } finally {
      setSubmitting(false);
    }

    const res = signInWithEmail(parsed.data.email, parsed.data.password);
    if (!res.ok || !res.user) {
      setError(res.error || "Sign-in failed.");
      return;
    }

    if (res.user.role === "super_admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-brand-500 font-bold">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 pt-2">
              Sign In to SCDS Ambassador Hub
            </h1>
            <p className="text-xs text-slate-500">
              Access your referral links, marketing resources, commissions, or admin tools.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
            >
              Sign In Securely
            </button>
          </form>

          <p className="text-center text-xs text-slate-600">
            Want to join the ambassador program?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-brand-600 hover:underline"
            >
              Submit an Ambassador Application
            </Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

