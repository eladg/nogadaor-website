// זמן קריאה משוער: כ-180 מילים בדקה, בלי תגיות הקוד. משמש בעמוד המדריך ובעמוד המרכז.
export function readingMinutes(body: string | undefined) {
  const words = (body ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^import .*$/gm, '')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(2, Math.round(words / 180));
}
