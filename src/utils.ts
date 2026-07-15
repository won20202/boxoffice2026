/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number into Korean locale string (e.g., 1234567 -> "1,234,567")
 */
export function formatNumber(val: string | number): string {
  const num = typeof val === "string" ? parseInt(val, 10) : val;
  if (isNaN(num)) return "0";
  return num.toLocaleString("ko-KR");
}

/**
 * Formats YYYYMMDD string to "YYYY년 MM월 DD일"
 */
export function formatKoreanDate(yyyyMMdd: string): string {
  if (!yyyyMMdd || yyyyMMdd.length !== 8) return yyyyMMdd || "";
  const y = yyyyMMdd.substring(0, 4);
  const m = yyyyMMdd.substring(4, 6);
  const d = yyyyMMdd.substring(6, 8);
  return `${y}년 ${m}월 ${d}일`;
}

/**
 * Formats a release date of YYYY-MM-DD or YYYYMMDD to human readable format
 */
export function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return "-";
  const cleaned = dateStr.replace(/-/g, "");
  return formatKoreanDate(cleaned);
}

/**
 * Gets yesterday's date in YYYY-MM-DD format (local time)
 */
export function getYesterdayDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converts YYYY-MM-DD to YYYYMMDD
 */
export function apiDateParam(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/**
 * Formats movie codes or amounts into standard Korean monetary format
 */
export function formatCurrency(val: string | number): string {
  const num = typeof val === "string" ? parseInt(val, 10) : val;
  if (isNaN(num)) return "0원";
  if (num >= 100000000) {
    const eok = Math.floor(num / 100000000);
    const remainder = Math.floor((num % 100000000) / 10000);
    if (remainder > 0) {
      return `${eok}억 ${formatNumber(remainder)}만원`;
    }
    return `${eok}억원`;
  }
  if (num >= 10000) {
    return `${formatNumber(Math.floor(num / 10000))}만원`;
  }
  return `${formatNumber(num)}원`;
}
