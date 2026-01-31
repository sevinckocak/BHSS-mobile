const pad2 = (n) => String(n).padStart(2, "0");

export function formatTR(dateObj) {
  if (!dateObj) return "";
  const d = pad2(dateObj.getDate());
  const m = pad2(dateObj.getMonth() + 1);
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

export function parseTRDate(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((x) => parseInt(x, 10));
  if (!dd || !mm || !yyyy) return null;
  const dt = new Date(yyyy, mm - 1, dd);
  if (
    dt.getFullYear() !== yyyy ||
    dt.getMonth() !== mm - 1 ||
    dt.getDate() !== dd
  )
    return null;
  return dt;
}
