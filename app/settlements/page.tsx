import Link from "next/link";
import { AlertTriangle, CheckCircle2, ArrowRight, Clock, FileCheck } from "lucide-react";
import { getFlaggedSettlements, type FlaggedSettlement } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney, formatShowDate } from "@/lib/format";
import { resolveSettlement } from "./actions";

export default async function SettlementsPage() {
  const flagged = await getFlaggedSettlements();

  return (
    <div className="px-12 py-10 max-w-4xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="h-5 w-5 text-ink-400" />
          <h1
            className="font-display text-[32px] font-medium text-ink-900 leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            Settlement Integrity
          </h1>
        </div>
        <p className="text-[13px] text-ink-500 leading-relaxed max-w-2xl">
          Settlements where the system status says{" "}
          <span className="font-medium text-rose-700">Disputed</span>{" "}but the
          artist team&apos;s signoff reads as approval. These may be blocking
          payment unnecessarily — each one needs a human decision.
        </p>
      </div>

      {flagged.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200/60 bg-brand-50/40 px-5 py-4">
          <CheckCircle2 className="h-4 w-4 text-brand-700 shrink-0" />
          <div className="text-[13px] text-ink-700">
            No signal mismatches detected. All disputed settlements have
            consistent signoffs.
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-[13px] text-ink-600">
              {flagged.length} settlement{flagged.length === 1 ? "" : "s"}{" "}
              flagged for review
            </span>
          </div>
          <div className="space-y-4">
            {flagged.map((item) => (
              <FlaggedCard key={item.settlement.id} item={item} />
            ))}
          </div>
        </>
      )}

      <div className="mt-12 pt-8 border-t border-ink-200/60">
        <p className="text-[11.5px] text-ink-400 leading-relaxed max-w-lg">
          Signal detection uses keyword matching on signoff text and internal
          notes. &ldquo;Mark Resolved&rdquo; advances status to{" "}
          <span className="font-mono">finalized</span> and logs a timestamp.
          Review the full settlement before resolving if anything looks off.
        </p>
      </div>
    </div>
  );
}

function FlaggedCard({ item }: { item: FlaggedSettlement }) {
  const { settlement, show, artist, mismatch } = item;
  const hasNoteConflict = mismatch.reason.includes("later note");

  return (
    <Card accent={hasNoteConflict ? "amber" : "rose"}>
      <CardHeader>
        <div>
          <CardTitle>{artist?.name ?? "Unknown artist"}</CardTitle>
          <CardDescription>
            {formatShowDate(show.date)} &middot;{" "}
            {formatMoney(settlement.totalToArtist)} to artist
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-700 shrink-0">
          <Clock className="h-3 w-3" />
          Needs review
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* The evidence */}
        <div>
          <div className="eyebrow text-[10px] text-ink-500 mb-1.5">
            Artist team signoff
          </div>
          <div className="text-[13px] text-ink-800 bg-canvas-soft rounded-lg px-4 py-3 ring-1 ring-ink-200/60 italic leading-relaxed">
            &ldquo;{settlement.signoffText}&rdquo;
          </div>
        </div>

        {/* The flag reason */}
        <div
          className={`text-[12px] rounded-md px-3 py-2.5 leading-relaxed ring-1 ${
            hasNoteConflict
              ? "bg-amber-50 text-amber-900 ring-amber-200/60"
              : "bg-rose-50 text-rose-900 ring-rose-200/60"
          }`}
        >
          {mismatch.reason}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <form action={resolveSettlement}>
            <input type="hidden" name="settlementId" value={settlement.id} />
            <input type="hidden" name="showId" value={show.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3.5 py-2 text-[12px] font-medium text-white hover:bg-ink-700 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Resolved
            </button>
          </form>
          <Link
            href={`/shows/${show.id}/settle`}
            className="inline-flex items-center gap-1 text-[12px] text-brand-700 hover:text-brand-800 hover:underline"
          >
            View full settlement <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
