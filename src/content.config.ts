// אוספי התוכן של האתר (Content Collections).
// כל מדריך הוא קובץ Markdown בתיקייה src/content/guides.
// שם הקובץ הוא הכתובת של העמוד: market-your-way.md → /guides/market-your-way/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(), // שורת משנה מתחת לכותרת
    description: z.string(), // משפט תיאור: מופיע בכרטיס בעמוד המרכז ובגוגל
    order: z.number(), // סדר ההצגה בעמוד המרכז
  }),
});

export const collections = { guides };
