export function fmtInt(value: number): string {
  return value.toLocaleString("en-US");
}

export function fmtNum(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2021-07-15" -> "15 Jul 2021" */
export function fmtDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const mi = Number(m) - 1;
  if (Number.isNaN(mi) || !MONTHS[mi]) return iso;
  return `${d} ${MONTHS[mi]} ${y}`;
}

/** "2021-07" -> "Jul 2021" */
export function fmtMonth(key: string): string {
  const parts = key.split("-");
  if (parts.length !== 2) return key;
  const [y, m] = parts;
  const mi = Number(m) - 1;
  if (Number.isNaN(mi) || !MONTHS[mi]) return key;
  return `${MONTHS[mi]} ${y}`;
}
