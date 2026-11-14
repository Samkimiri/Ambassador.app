import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const ALL_ROUTES = [
  "/",
  "/about",
  "/ambassadors",
  "/courses",
  "/courses/photoshop-masterclass",
  "/join",
  "/offline",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/dashboard",
  "/dashboard/campaigns",
  "/dashboard/guide",
  "/dashboard/leaderboard",
  "/dashboard/notifications",
  "/dashboard/profile",
  "/dashboard/referrals",
  "/dashboard/resources",
  "/dashboard/rewards",
  "/dashboard/support",
  "/admin",
  "/admin/applications",
  "/admin/ambassadors",
  "/admin/referrals",
  "/admin/enrolments",
  "/admin/courses",
  "/admin/campaigns",
  "/admin/rewards",
  "/admin/payouts",
  "/admin/resources",
  "/admin/announcements",
  "/admin/trash",
  "/admin/reports",
  "/admin/settings",
  "/admin/audit-logs",
  "/admin/migration",
];

describe("Mobile responsiveness & overflow regression", () => {
  it("configures viewport-fit=cover and overflow-x-clip safety net", () => {
    const layoutSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8"
    );
    const globalsSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    expect(layoutSrc).toContain('viewportFit: "cover"');
    expect(layoutSrc).toContain("overflow-x-clip");
    expect(globalsSrc).toContain("overflow-x: clip");
    expect(globalsSrc).toContain("env(safe-area-inset-left)");
  });

  it("checks every route at 360x640 and 390x844 for element-level overflow when MOBILE_AUDIT_URL is set", async () => {
    const baseUrl = process.env.MOBILE_AUDIT_URL;
    if (!baseUrl) {
      // Skipped browser run when no running server URL is provided;
      // set MOBILE_AUDIT_URL=http://localhost:3000 to execute live Chromium checks.
      return;
    }

    const pwPath =
      process.env.PLAYWRIGHT_PATH ||
      path.resolve(process.cwd(), "../mobile-audit/node_modules/playwright");
    const require = createRequire(import.meta.url);
    const { chromium } = require(pwPath);

    const browser = await chromium.launch({ headless: true });
    try {
      for (const vp of [
        { width: 360, height: 640 },
        { width: 390, height: 844 },
      ]) {
        const context = await browser.newContext({
          viewport: vp,
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();

        await page.route("**/api/sync", (route: { fulfill: (arg: object) => void }) =>
          route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
        );
        await page.route("**/api/applications", (route: { fulfill: (arg: object) => void }) =>
          route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, applications: [] }) })
        );

        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => {
          localStorage.setItem(
            "scds_ambassador_hub_user_v1",
            JSON.stringify({
              id: "user-admin-1",
              fullName: "Samuel Kimiri",
              email: "samcreativegraphics7@gmail.com",
              phone: "0748201131",
              role: "super_admin",
              status: "active",
            })
          );
        });

        for (const routePath of ALL_ROUTES) {
          await page.goto(`${baseUrl}${routePath}`, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
          await page.waitForTimeout(250);

          const overflow = await page.evaluate(() => {
            const vw = window.innerWidth;
            const docOverflow = document.documentElement.scrollWidth > vw + 1;
            const badElements: string[] = [];

            const isInsideHorizontalScroller = (el: Element): boolean => {
              let cur: Element | null = el;
              while (cur && cur !== document.body) {
                const style = window.getComputedStyle(cur);
                if (
                  (style.overflowX === "auto" || style.overflowX === "scroll") &&
                  cur.scrollWidth > cur.clientWidth
                ) {
                  return true;
                }
                cur = cur.parentElement;
              }
              return false;
            };

            for (const el of Array.from(document.querySelectorAll("*"))) {
              const style = window.getComputedStyle(el);
              if (style.display === "none" || style.visibility === "hidden") continue;
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;
              if (rect.right > vw + 2 || rect.left < -2) {
                if (!isInsideHorizontalScroller(el)) {
                  badElements.push(
                    `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} (${Math.round(rect.left)}..${Math.round(rect.right)} > ${vw})`
                  );
                }
              }
              if (badElements.length >= 5) break;
            }
            return { docOverflow, badElements };
          });

          expect(
            overflow.docOverflow,
            `${routePath} at ${vp.width}x${vp.height} has document scrollWidth > innerWidth`
          ).toBe(false);
          expect(
            overflow.badElements,
            `${routePath} at ${vp.width}x${vp.height} has overflowing elements: ${overflow.badElements.join(", ")}`
          ).toEqual([]);
        }
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }, 180000);
});
