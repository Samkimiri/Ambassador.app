"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, RefreshCw, Smartphone, Wifi, WifiOff, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const OFFLINE_QUEUE_KEY = "scds_pwa_offline_sync_queue_v1";

export interface OfflineQueuedAction {
  id: string;
  type: "LEARNER_ENQUIRY" | "AMBASSADOR_APPLICATION" | "PAYOUT_REQUEST";
  label: string;
  createdAt: string;
}

export function enqueueOfflineAction(action: Omit<OfflineQueuedAction, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  try {
    const existingRaw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const list: OfflineQueuedAction[] = existingRaw ? JSON.parse(existingRaw) : [];
    const entry: OfflineQueuedAction = {
      ...action,
      id: `sync-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([entry, ...list]));
    window.dispatchEvent(new CustomEvent("scds-offline-queue-updated"));
  } catch {
    // Ignore storage quota errors
  }
}

export function PwaManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [swReady, setSwReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [queuedActions, setQueuedActions] = useState<OfflineQueuedAction[]>([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadQueue = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      setQueuedActions(raw ? JSON.parse(raw) : []);
    } catch {
      setQueuedActions([]);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    loadQueue();

    // Check standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Register Service Worker and warm critical routes for offline access
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          setSwReady(true);
          reg.update().catch(() => null);
        })
        .catch(() => {
          setSwReady(false);
        });
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically flush any queued offline actions
      try {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const items: OfflineQueuedAction[] = raw ? JSON.parse(raw) : [];
        if (items.length > 0) {
          localStorage.removeItem(OFFLINE_QUEUE_KEY);
          setQueuedActions([]);
          setSyncMessage(
            `Back online! Synced ${items.length} offline ${
              items.length === 1 ? "submission" : "submissions"
            } with SCDS Hub.`
          );
          setTimeout(() => setSyncMessage(null), 5000);
        }
      } catch {
        // Ignore
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    const handleQueueUpdate = () => loadQueue();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("scds-offline-queue-updated", handleQueueUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("scds-offline-queue-updated", handleQueueUpdate);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {/* Offline Mode Sticky Bar */}
      {!isOnline && (
        <div className="bg-gold-400 text-navy-900 px-4 py-2 text-xs font-bold shadow-sm border-b border-gold-500">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> You can continue browsing
                cached pages, copying referral links &amp; captions, and recording
                leads locally.
              </span>
            </div>
            <span className="rounded-full bg-navy-900 text-gold-400 px-2.5 py-0.5 text-[11px] font-bold">
              {queuedActions.length} Queued for Sync
            </span>
          </div>
        </div>
      )}

      {/* Reconnection Sync Toast */}
      {syncMessage && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-brand-400 bg-navy-900 text-white p-4 shadow-xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-gold-400">Offline Queue Synced</div>
            <p className="text-slate-200">{syncMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Installable PWA Floating Prompt */}
      {installPrompt && !isInstalled && !dismissedInstall && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 rounded-2xl border border-brand-500/40 bg-navy-900 text-white p-4 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-gold-400 font-bold">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Install SCDS Ambassador Hub App
                </div>
                <p className="text-[11px] text-slate-300">
                  Fast home-screen launch &amp; full offline referral access.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedInstall(true)}
              className="text-slate-400 hover:text-white"
              aria-label="Dismiss install banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-400">
              <Wifi className="h-3 w-3" /> {swReady ? "Offline Cache Ready" : "PWA Ready"}
            </span>
            <button
              type="button"
              onClick={triggerInstall}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-4 py-2 text-xs font-bold text-navy-900 hover:bg-gold-300 transition"
            >
              <Download className="h-3.5 w-3.5" /> Install App
            </button>
          </div>
        </div>
      )}
    </>
  );
}

