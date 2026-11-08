// הכריכות כקובצי תמונה (נוגה, 2026-11-08: "תייצא אותן כתמונות ותן להם תיאור").
// הכריכות באתר מצוירות בקוד (src/components/ContentCover.astro) ונשארות כמו שהן. במקביל יש לכל כריכה
// קובץ JPG ב-public/images/covers/, לתמונת שיתוף (וואטסאפ, פייסבוק, לינקדאין) ולנתונים המובנים בגוגל.
//
// יצירת הקבצים מחדש (אחרי שינוי בכריכה, או כשנוסף מדריך / הדרכה / הרצאה):
//   1. להעתיק את drafts/cover-export.astro אל src/pages/cover-export.astro
//   2. npm run build, ואז להריץ את astro-preview (.claude/launch.json)
//   3. להריץ את drafts/export-covers.py (מצלם כל כריכה ושומר ב-public/images/covers)
//   4. למחוק את src/pages/cover-export.astro (עמוד עבודה, לא עולה לאתר)
import type { CoverMotif } from '../components/ContentCover.astro';

export type CoverGroup = 'guide' | 'article' | 'training' | 'lecture';

export interface CoverInput {
  group: CoverGroup;
  slug: string; // שם הקובץ: מזהה המדריך / ההדרכה, או מזהה הסרטון ביוטיוב
  pageTitle: string; // השם המלא של התוכן
  coverTitle: string; // הכותרת שעל הכריכה (*מילה* = זהב, | = ירידת שורה)
  motif: CoverMotif;
  star?: 'start' | 'end' | false;
}

export interface CoverImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// מה רואים בכריכה, לפי החפץ. התיאור נכתב לפי הציור עצמו ב-ContentCover.
const motifText: Record<CoverMotif, string> = {
  ai: 'בועת שיחה מזכוכית זוהרת ובתוכה האותיות AI',
  growth: 'עמודות גרף עולות מזכוכית זוהרת וחץ זהב שמטפס למעלה',
  screen: 'מסך מזכוכית זוהרת עם כפתור הפעלה בזהב',
  target: 'מטרה מזכוכית זוהרת וחץ זהב שפוגע במרכזה',
  gift: 'קופסת מתנה מזכוכית זוהרת עם סרט זהב',
  iceberg: 'קרחון מזכוכית זוהרת, עם קצה זהב קטן מעל קו המים ומסה גדולה מתחתיו',
  chat: "חלון צ'אט מזכוכית זוהרת עם בועת הודעה ומתגים בזהב",
  megaphone: 'מגפון מזכוכית זוהרת עם גלי קול בזהב',
  compass: 'מצפן מזכוכית זוהרת עם מחט זהב',
};

const groupText: Record<CoverGroup, string> = {
  guide: 'כריכת המדריך',
  article: 'כריכת המאמר',
  training: 'כריכת ההדרכה',
  lecture: 'כריכת ההרצאה',
};

/** הטקסט שעל הכריכה, בלי סימני העיצוב */
export const plainCoverTitle = (t: string) => t.replace(/\*/g, '').replace(/\s*\|\s*/g, ' ').trim();

/** מאמרים בגוון חם (זהב), כל השאר בכחול – כמו ב-ContentCover */
const background = (g: CoverGroup) => (g === 'article' ? 'רקע כחול כהה עם זוהר זהוב' : 'רקע כחול כהה עם זוהר טורקיז');

export function coverImage(c: CoverInput): CoverImage {
  const ratio169 = c.group === 'lecture'; // כריכות ההרצאות ביחס 16:9, השאר 16:10
  const star = c.star ? ', וכוכב זהב קטן מהלוגו' : '';
  const alt = `${groupText[c.group]} "${c.pageTitle}". ${motifText[c.motif]}${star}, על ${background(c.group)}, והכיתוב "${plainCoverTitle(c.coverTitle)}".`;
  return {
    src: `/images/covers/${c.group}-${c.slug}.jpg`,
    alt,
    width: 1200,
    height: ratio169 ? 675 : 750,
  };
}
