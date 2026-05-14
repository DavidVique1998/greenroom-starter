/**
 * Greenroom — Settlement Signal Integrity tour recorder
 * Generates a .webm video with Driver.js guided annotations.
 *
 * Usage:
 *   node scripts/record-tour.mjs
 *
 * Requires the dev server running on localhost:3000:
 *   npm run dev
 *
 * Output: recordings/tour.webm
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = "./recordings";
const TOUR_TIMEOUT = 30_000; // 30s per tour page

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, distance, steps = 8) {
  const step = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await sleep(120);
  }
}

async function waitForTour(page) {
  await page.waitForFunction(() => window.__tourDone === true, {
    timeout: TOUR_TIMEOUT,
  });
  await sleep(600); // brief pause after tour finishes
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: false });

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: OUTPUT_DIR,
    size: { width: 1440, height: 900 },
  },
});

const page = await context.newPage();

// ─── 1. Shows home — nav badge tour ──────────────────────────────────────────
console.log("→ Shows home (tour: nav badge)");
await page.goto(`${BASE_URL}/shows?tour=1`);
await page.waitForLoadState("networkidle");
await sleep(1200);

await waitForTour(page);

// Brief pause on shows page after tour
await sleep(1500);

// ─── 2. Settlements audit queue ───────────────────────────────────────────────
console.log("→ Settlements queue (tour: queue + cards)");
await page.goto(`${BASE_URL}/settlements?tour=1`);
await page.waitForLoadState("networkidle");
await sleep(1200);

// Scroll gently while tour runs so cards are visible
await smoothScroll(page, 300);
await sleep(800);

await waitForTour(page);
await sleep(1500);

// ─── 3. Settle page — rose banner (clean mismatch) ───────────────────────────
console.log("→ Settle page — rose banner");
const viewLinks = page.locator('a:has-text("View full settlement")');
const firstHref = await viewLinks.first().getAttribute("href").catch(() => null);

if (firstHref) {
  await page.goto(`${BASE_URL}${firstHref}?tour=1`);
} else {
  // fallback: find first flagged show from queue
  await page.goto(`${BASE_URL}/settlements`);
  await page.waitForLoadState("networkidle");
  const href = await page.locator('a:has-text("View full settlement")').first().getAttribute("href");
  await page.goto(`${BASE_URL}${href}?tour=1`);
}

await page.waitForLoadState("networkidle");
await sleep(1200);
await smoothScroll(page, 200);
await sleep(600);

await waitForTour(page);
await sleep(1500);

// ─── 4. Settle page — amber banner (later note conflict) ─────────────────────
console.log("→ Settle page — amber banner (show_0007 / Briar Road)");
await page.goto(`${BASE_URL}/shows/show_0007/settle?tour=1`);
await page.waitForLoadState("networkidle");
await sleep(1200);
await smoothScroll(page, 200);
await sleep(600);

await waitForTour(page);
await sleep(1500);

// ─── 5. Back to queue — tour before resolve ──────────────────────────────────
console.log("→ Settlements queue (tour: before resolve)");
await page.goto(`${BASE_URL}/settlements?tour=1`);
await page.waitForLoadState("networkidle");
await sleep(1200);
await smoothScroll(page, 300);
await sleep(800);

await waitForTour(page);
await sleep(1200);

// ─── 6. Click "Mark Resolved" ────────────────────────────────────────────────
console.log("→ Mark Resolved");
const firstResolveBtn = page.getByRole("button", { name: "Mark Resolved" }).first();
await firstResolveBtn.scrollIntoViewIfNeeded();
await sleep(1000);

await firstResolveBtn.click();
await page.waitForLoadState("networkidle");
await sleep(1200);

// ─── 7. Post-resolve tour — card gone, badge decremented ─────────────────────
console.log("→ Post-resolve tour (queue shrinks, badge decrements)");
await page.goto(`${BASE_URL}/settlements?tour=resolved`);
await page.waitForLoadState("networkidle");
await sleep(1000);

await waitForTour(page);
await sleep(1500);

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log("→ Done — closing browser");
await page.close();
await context.close();
await browser.close();

console.log(`\nVideo saved to: ${OUTPUT_DIR}/`);
console.log("Convert to MP4: ffmpeg -i recordings/<file>.webm -c:v libx264 recordings/tour.mp4");
