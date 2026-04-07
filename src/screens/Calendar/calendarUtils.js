/** Shared pure utilities for Calendar screens */

export const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  card: "rgba(255,255,255,0.06)",
  cardStrong: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.58)",
  faint: "rgba(234,244,255,0.38)",
  warm: "#FFCC72",
  warm2: "#FFB04E",
  blue: "#2F78C8",
  blue2: "#1E4F8F",
  success: "#32D583",
  danger: "#FF5D73",
};

export const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);

export const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const dayToDateStr = (cursor, day) =>
  day != null
    ? ymd(new Date(cursor.getFullYear(), cursor.getMonth(), day))
    : null;

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const daysInMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const mondayIndex = (jsDay) => (jsDay + 6) % 7;

export function buildMonthGrid(date) {
  const first = startOfMonth(date);
  const total = daysInMonth(date);
  const offset = mondayIndex(first.getDay());

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function trMonthLabel(date) {
  const m = date.toLocaleString("tr-TR", { month: "long" });
  return m.charAt(0).toUpperCase() + m.slice(1) + " " + date.getFullYear();
}
