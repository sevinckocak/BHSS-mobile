import { parseTRDate } from "./date";

/**
 * birthDate değerinden bugüne kadar geçen TAM ay sayısını döndürür.
 *
 * Kabul edilen formatlar:
 *   - "dd/mm/yyyy"  ← uygulamada kullanılan Türkçe format (formatTR çıktısı)
 *   - Firestore Timestamp  { toDate: () => Date }
 *   - Date nesnesi
 *   - ISO string ("2024-03-15" vb.)
 *
 * @param {string|Date|Object|null|undefined} birthDate
 * @returns {number|null}  tam ay (floor), geçersiz/eksik değerde null
 */
export function getAnimalAgeMonths(birthDate) {
  if (!birthDate) return null;

  let birth;

  if (typeof birthDate === "object" && typeof birthDate.toDate === "function") {
    // Firestore Timestamp
    birth = birthDate.toDate();
  } else if (birthDate instanceof Date) {
    birth = birthDate;
  } else if (typeof birthDate === "string") {
    // Önce Türkçe format dene ("dd/mm/yyyy")
    birth = parseTRDate(birthDate);

    if (!birth) {
      // ISO veya başka string formatları
      const parsed = new Date(birthDate);
      birth = isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  if (!birth || isNaN(birth.getTime())) return null;

  const now = new Date();

  // Takvim tabanlı hesap: yıl farkı × 12 + ay farkı
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  // Henüz o günü geçmemişse 1 ay geri al
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

/**
 * Ay sayısını okunabilir formatta gösterir.
 *   0–11  → "X ay"
 *   12+   → "X yıl Y ay"  /  "X yıl" (kalan sıfırsa)
 *
 * @param {number|null} months
 * @returns {string}
 */
export function formatAgeMonths(months) {
  if (months == null) return "—";
  if (months < 12) return `${months} ay`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yıl` : `${years} yıl ${rem} ay`;
}
