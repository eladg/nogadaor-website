// אוספי התוכן של האתר (Content Collections).
// כל מדריך או מאמר הוא קובץ בתיקייה src/content/guides:
//   .mdx – מדריך בעיצוב המלא (אפשר לשלב בו ריבועים, שלבים, תבניות להעתקה וכו'; ראו src/components/guide)
//   .md  – טקסט רגיל
// שם הקובץ הוא הכתובת של העמוד: market-your-way.mdx → /guides/market-your-way/
// type: guide (מדריך, ברירת המחדל) או article (מאמר).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(), // שורת משנה מתחת לכותרת
    description: z.string(), // משפט תיאור: מופיע בכרטיס בעמוד המרכז ובגוגל
    order: z.number(), // סדר ההצגה בעמוד המרכז
    type: z.enum(['guide', 'article']).default('guide'),
    published: z.coerce.date().optional(), // תאריך פרסום (למאמרים)
    sourceName: z.string().optional(), // איפה פורסם במקור, אם פורסם קודם במקום אחר
    sourceUrl: z.string().url().optional(),
    // מילות מפתח מתוך KEYWORDS.md (5 עד 8 לכל מדריך). מוצגות כתגיות ונכנסות לתיאור לגוגל.
    keywords: z.array(z.string()).default([]),
    // "מה תקבלו במדריך": 3 או 4 שורות קצרות, מוצגות בראש העמוד
    gains: z.array(z.string()).default([]),
    // מספר שמשנה מעט את עיצוב הכריכה (סידור הרשת), כדי שכל כריכה תהיה שונה
    coverVariant: z.number().default(0),
    // קובץ להורדה (למשל שאלון ב-Word), מתוך התיקייה public. מופיע ככפתור ליד "הדפסה" ו"שיתוף".
    download: z.object({ href: z.string(), label: z.string() }).optional(),
  }),
});

export const collections = { guides };
