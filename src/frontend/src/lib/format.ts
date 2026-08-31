/**
 * Shared formatting helpers for the MarketEarth economy.
 * Backend timestamps are nanosecond bigints — always convert through
 * timestampToDate before any JavaScript Date operation.
 */

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a coin amount with thousands separators and up to 2 decimals. */
export function formatCoins(value: bigint): string {
  const whole = value / 100n;
  const fraction = value % 100n;
  const wholeStr = whole.toLocaleString("en-US");
  return fraction === 0n
    ? `${wholeStr}.00`
    : `${wholeStr}.${fraction.toString().padStart(2, "0")}`;
}

/** Format a backend timestamp as a short relative-ish date label. */
export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
