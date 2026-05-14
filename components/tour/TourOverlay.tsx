"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export type TourPage = "shows" | "settlements" | "settle-rose" | "settle-amber" | "settlements-resolved";

const STEP_DURATION = 3800;

const STEPS: Record<TourPage, { element: string; title: string; description: string }[]> = {
  shows: [
    {
      element: "[data-tour='settlements-nav']",
      title: "Settlement Integrity",
      description: "New entry point — flagged settlements live here. The badge shows how many need a human decision right now.",
    },
    {
      element: "[data-tour='nav-badge']",
      title: "Live queue depth",
      description: "Amber badge increments when a disputed settlement has a positive signoff. No need to go hunting.",
    },
  ],
  settlements: [
    {
      element: "[data-tour='queue-header']",
      title: "Signal mismatch queue",
      description: "Every card here is a settlement the system status says Disputed — but the artist team's signoff reads as approval.",
    },
    {
      element: "[data-tour='signoff-text']",
      title: "Verbatim signoff",
      description: "The exact text from the artist team. Not summarized, not interpreted — Mariana reads it and decides.",
    },
    {
      element: "[data-tour='flag-reason']",
      title: "Why it was flagged",
      description: "Rose = clear mismatch (status Disputed, signoff reads as approval). Amber = positive signoff but a later note conflicts.",
    },
    {
      element: "[data-tour='resolve-btn']",
      title: "One click to unblock payment",
      description: "\"Mark Resolved\" advances to finalized and logs a timestamp. No spreadsheet, no manual follow-up.",
    },
  ],
  "settle-rose": [
    {
      element: "[data-tour='integrity-banner']",
      title: "Signal mismatch — Wax Paper",
      description: "Signoff says \"ok wire monday\" — that's approval. Status still shows Disputed. This payment is blocked for no reason.",
    },
    {
      element: "[data-tour='banner-reason']",
      title: "One click unblocks payment",
      description: "\"Mark Resolved\" advances to finalized and logs a timestamp. No spreadsheet, no thread-hunting, no 2am follow-up.",
    },
  ],
  "settle-amber": [
    {
      element: "[data-tour='integrity-banner']",
      title: "Later-note conflict — Dust Off",
      description: "TM signed off: \"Looks good — TM.\" But a note added Monday flags the production-overage line. Amber = verify which is current.",
    },
    {
      element: "[data-tour='banner-reason']",
      title: "System surfaces the conflict",
      description: "Mariana sees both signals at once — the approval and the question. She decides, not the system. No automated action happens without her.",
    },
  ],
  "settlements-resolved": [
    {
      element: "[data-tour='queue-header']",
      title: "Wax Paper removed from queue",
      description: "Status is now finalized. Timestamp logged. Payment can proceed — no thread to re-read, no manual push required.",
    },
    {
      element: "[data-tour='settlements-nav']",
      title: "Badge decrements automatically",
      description: "The count drops on every resolve. When the queue hits zero, the badge disappears — Mariana sees it without navigating.",
    },
  ],
};

declare global {
  interface Window {
    __tourDone?: boolean;
  }
}

// Module-level: persists across re-mounts within the same tab session
const completedPages = new Set<string>();

export function TourOverlay({ page }: { page: TourPage }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParam = searchParams.get("tour");

    // ?tour=off clears everything
    if (urlParam === "off") {
      sessionStorage.removeItem("greenroom-tour");
      completedPages.clear();
      return;
    }
    // Persist mode so nav clicks carry it forward automatically
    if (urlParam) {
      sessionStorage.setItem("greenroom-tour", urlParam);
      // Explicit URL param = user wants to re-run this page
      completedPages.delete(page);
    }
    const tourParam = urlParam ?? sessionStorage.getItem("greenroom-tour");
    if (!tourParam) return;

    // Already toured this page in this tab session — skip
    if (completedPages.has(page)) return;

    const steps = STEPS[page];
    if (!steps?.length) return;

    const isManual = tourParam === "manual" || tourParam === "manual-resolved";

    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      showProgress: isManual,
      showButtons: isManual ? ["next", "previous", "close"] : [],
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      overlayOpacity: 0.55,
      stagePadding: 8,
      stageRadius: 6,
      popoverClass: "greenroom-tour-popover",
      onDestroyStarted: () => {
        driverObj.destroy();
        completedPages.add(page);
        window.__tourDone = true;
      },
      steps: steps.map((s) => ({
        element: s.element,
        popover: {
          title: s.title,
          description: s.description,
          side: "bottom",
          align: "start",
        },
      })),
    });

    const startTimer = setTimeout(() => {
      driverObj.drive();

      if (!isManual) {
        let currentStep = 0;
        function advanceOrFinish() {
          if (currentStep < steps.length - 1) {
            currentStep++;
            driverObj.moveTo(currentStep);
            setTimeout(advanceOrFinish, STEP_DURATION);
          } else {
            driverObj.destroy();
            completedPages.add(page);
            window.__tourDone = true;
          }
        }
        setTimeout(advanceOrFinish, STEP_DURATION);
      }
    }, 800);

    return () => {
      clearTimeout(startTimer);
      driverObj.destroy();
    };
  }, [page, searchParams]);

  return null;
}
