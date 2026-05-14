/**
 * Greenroom — Settlement Signal Integrity tour recorder
 * Generates a .webm video of the full feature walkthrough.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, distance, steps = 8) {
  const step = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await sleep(120);
  }
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

// ─── 1. Shows home ────────────────────────────────────────────────────────────
console.log("→ Shows home");
await page.goto(`${BASE_URL}/shows`);
await page.waitForLoadState("networkidle");
await sleep(2500);

// Scroll slowly to show the list
await smoothScroll(page, 600);
await sleep(1500);
await smoothScroll(page, -600);
await sleep(1000);

// ─── 2. Settlements audit queue ───────────────────────────────────────────────
console.log("→ Settlements queue");
await page.click('a[href="/settlements"]');
await page.waitForLoadState("networkidle");
await sleep(2500);

// Scroll to reveal first few cards
await smoothScroll(page, 400);
await sleep(1200);
await smoothScroll(page, 400);
await sleep(1200);
await smoothScroll(page, -800);
await sleep(1000);

// ─── 3. View full settlement (rose variant — clean mismatch) ──────────────────
console.log("→ Settle page — rose banner");
const viewLinks = page.locator('a:has-text("View full settlement")');
await viewLinks.first().click();
await page.waitForLoadState("networkidle");
await sleep(2500);

// Scroll to show banner + lifecycle bar
await smoothScroll(page, 300);
await sleep(2000);
await smoothScroll(page, -300);
await sleep(800);

// ─── 4. Back to queue — show amber variant ────────────────────────────────────
console.log("→ Settle page — amber banner (later note conflict)");
await page.goto(`${BASE_URL}/shows/show_0007/settle`);
await page.waitForLoadState("networkidle");
await sleep(2500);
await smoothScroll(page, 300);
await sleep(2000);
await smoothScroll(page, -300);
await sleep(800);

// ─── 5. Back to queue — resolve one ──────────────────────────────────────────
console.log("→ Mark Resolved");
await page.goto(`${BASE_URL}/settlements`);
await page.waitForLoadState("networkidle");
await sleep(2000);

// Highlight the button region by scrolling to it
const firstResolveBtn = page.getByRole("button", { name: "Mark Resolved" }).first();
await firstResolveBtn.scrollIntoViewIfNeeded();
await sleep(1500);

// Click and wait for revalidation
await firstResolveBtn.click();
await page.waitForLoadState("networkidle");
await sleep(2500);

// Show the updated badge and reduced queue
await smoothScroll(page, 200);
await sleep(1500);
await smoothScroll(page, -200);
await sleep(1500);

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log("→ Done — closing browser");
await page.close();
await context.close();
await browser.close();

console.log(`\nVideo saved to: ${OUTPUT_DIR}/`);
console.log("Convert to MP4: ffmpeg -i recordings/<file>.webm -c:v libx264 recordings/tour.mp4");
