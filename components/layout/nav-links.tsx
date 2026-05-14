"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Calendar, Users, BarChart3, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/shows", label: "Shows", icon: Calendar },
  { href: "/artists", label: "Artists", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settlements", label: "Settlements", icon: FileCheck },
];

export function NavLinks({ flaggedSettlements = 0 }: { flaggedSettlements?: number }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const showBadge = item.href === "/settlements" && flaggedSettlements > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.href === "/settlements" ? "settlements-nav" : undefined}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150",
              active
                ? "bg-white text-ink-900 font-medium shadow-[0_1px_3px_rgba(26,24,20,0.06)] ring-1 ring-ink-200/40"
                : "text-ink-500 hover:bg-white/70 hover:text-ink-900",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                active ? "text-brand-700" : "text-ink-400",
              )}
            />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span
                data-tour="nav-badge"
                className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold leading-none"
              >
                {flaggedSettlements}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
