export function timeAgoTR(ts) {
  if (!ts) return "";
  const now = Date.now();
  const diffMs = Math.max(0, now - ts);

  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return "Az önce";
  if (sec < 60) return `${sec} sn önce`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;

  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} gün önce`;

  const week = Math.floor(day / 7);
  if (week < 5) return `${week} hafta önce`;

  // daha eskiyse tarih bas
  const d = new Date(ts);
  return d.toLocaleDateString("tr-TR");
}
