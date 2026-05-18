// All prices live in the DB as integer cents (CAD). Format here for display.

export function formatCAD(cents: number): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars} CAD`;
}

export function dollarsToCents(input: string | number): number {
  const num = typeof input === "string" ? parseFloat(input) : input;
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}
