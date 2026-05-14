export type SignalSentiment = "positive" | "negative" | "neutral";

export type SignalScore = {
  sentiment: SignalSentiment;
  confidence: "high" | "medium" | "low";
  label: string;
};

const POSITIVE_PATTERNS = [
  /\blooks?\s+good\b/i,
  /\bok\b/i,
  /\bokay\b/i,
  /👍/,
  /\bwire\b/i,
  /\bsign[- ]?off\b/i,
  /\bgood\s+night\b/i,
  /\ball\s+good\b/i,
  /\bthanks?\b/i,
  /\bperfect\b/i,
  /\bconfirmed\b/i,
  /\bapproved\b/i,
  /\bsend\s+it\b/i,
  /\bsounds?\s+right\b/i,
  /\bwire\s+when\b/i,
  /\bwire\s+to\b/i,
];

const NEGATIVE_PATTERNS = [
  /\bdisput/i,
  /\bwrong\b/i,
  /\bincorrect\b/i,
  /\bnot\s+right\b/i,
  /\bquestion(ing)?\b/i,
  /\bhold\s+on\b/i,
  /\bissue\b/i,
  /\bdoesn'?t\s+add\s+up\b/i,
  /\bovercharg/i,
  /\bwait(ing)?\b/i,
  /\bcheck\s+this\b/i,
  /\bproblem\b/i,
];

export function scoreSignoff(text: string | null | undefined): SignalScore {
  if (!text?.trim()) {
    return { sentiment: "neutral", confidence: "low", label: "No signoff recorded" };
  }

  const posHits = POSITIVE_PATTERNS.filter((p) => p.test(text)).length;
  const negHits = NEGATIVE_PATTERNS.filter((p) => p.test(text)).length;

  if (posHits > 0 && negHits === 0) {
    return {
      sentiment: "positive",
      confidence: posHits >= 2 ? "high" : "medium",
      label: "Signoff reads as approval",
    };
  }
  if (negHits > 0 && posHits === 0) {
    return {
      sentiment: "negative",
      confidence: negHits >= 2 ? "high" : "medium",
      label: "Signoff signals an open dispute",
    };
  }
  if (posHits > 0 && negHits > 0) {
    return {
      sentiment: "neutral",
      confidence: "low",
      label: "Mixed signals — needs human review",
    };
  }
  return { sentiment: "neutral", confidence: "low", label: "Signoff language unclear" };
}

export type MismatchResult = {
  flagged: boolean;
  reason: string;
  signoffSentiment: SignalSentiment;
};

export function detectMismatch(
  status: string,
  signoffText: string | null | undefined,
  notes: string | null | undefined,
): MismatchResult {
  const score = scoreSignoff(signoffText);

  if (status === "disputed" && score.sentiment === "positive") {
    const notesScore = scoreSignoff(notes);
    const reason =
      notesScore.sentiment === "negative"
        ? "Artist team signed off, but a later note suggests a dispute. Verify which is current."
        : "Status says Disputed — signoff reads as approval. This settlement may already be resolved.";
    return { flagged: true, reason, signoffSentiment: score.sentiment };
  }

  return { flagged: false, reason: "", signoffSentiment: score.sentiment };
}
