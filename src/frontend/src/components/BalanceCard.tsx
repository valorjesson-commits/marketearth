import { cn } from "@/lib/utils";
import type * as React from "react";

type TokenKind = "me" | "we" | "staked";

const tokenStyles: Record<TokenKind, string> = {
  me: "bg-me-coin-soft text-me-coin",
  we: "bg-we-coin-soft text-we-coin",
  staked: "bg-muted text-muted-foreground",
};

const iconStyles: Record<TokenKind, string> = {
  me: "bg-gradient-gold",
  we: "bg-gradient-primary",
  staked: "bg-muted",
};

interface BalanceCardProps extends React.ComponentProps<"div"> {
  label: string;
  value: string;
  unit: string;
  kind: TokenKind;
  icon: React.ReactNode;
  hint?: string;
}

/**
 * Shared balance card used across the dashboard and staking views.
 * Uses the dual-token color language: gold for Me-Coins, indigo for We-Coins.
 */
export function BalanceCard({
  label,
  value,
  unit,
  kind,
  icon,
  hint,
  className,
  ...props
}: BalanceCardProps) {
  return (
    <div
      data-ocid="balance_card"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-subtle transition-smooth hover:shadow-elevated",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
            tokenStyles[kind],
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg text-primary-foreground",
            iconStyles[kind],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        <span className="font-mono text-sm font-medium text-muted-foreground">
          {unit}
        </span>
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
