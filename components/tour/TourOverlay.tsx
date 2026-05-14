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
      title: "Inline signal banner",
      description: "Appears above the lifecycle bar — before the numbers. Mariana catches it without knowing the audit page exists.",
    },
    {
      element: "[data-tour='banner-reason']",
      title: "Clear mismatch",
      description: "Status says Disputed. Signoff reads as approval. Same \"Mark Resolved\" action — same server action, same revalidation.",
    },
  ],
  "settle-amber": [
    {
      element: "[data-tour='integrity-banner']",
      title: "Later-note conflict",
      description: "Signoff was positive, but a note added afterward flags a dispute. Amber = verify which is current before resolving.",
    },
    {
      element: "[data-tour='banner-reason']",
      title: "Needs manual verification",
      description: "System surfaces the conflict; Mariana makes the call. No automated action happens without her.",
    },
  ],
  "settlements-resolved": [
    {
      element: "[data-tour='queue-header']",
      title: "Settlement removed from queue",
      description: "That settlement is now finalized. Status updated, timestamp logged — payment can proceed.",
    },
    {
      element: "[data-tour='settlements-nav']",
      title: "Badge decrements automatically",
      description: "The count drops on every resolve. When the queue hits zero, the badge disappears entirely — Mariana sees it without navigating.",
    },
  ],
};

declare global {
  interface Window {
    __tourDone?: boolean;
  }
}

export function TourOverlay({ page }: { page: TourPage }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("tour")) return;

    const steps = STEPS[page];
    if (!steps?.length) return;

    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      showProgress: false,
      showButtons: [],
      overlayOpacity: 0.55,
      stagePadding: 8,
      stageRadius: 6,
      popoverClass: "greenroom-tour-popover",
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

    let currentStep = 0;

    function advanceOrFinish() {
      if (currentStep < steps.length - 1) {
        currentStep++;
        driverObj.moveTo(currentStep);
        setTimeout(advanceOrFinish, STEP_DURATION);
      } else {
        driverObj.destroy();
        window.__tourDone = true;
      }
    }

    // Small delay so page elements are painted
    const startTimer = setTimeout(() => {
      driverObj.drive();
      setTimeout(advanceOrFinish, STEP_DURATION);
    }, 800);

    return () => {
      clearTimeout(startTimer);
      driverObj.destroy();
    };
  }, [page, searchParams]);

  return null;
}
