// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // כתובת האתר (2026-11-09): בלעדיה לא נכתבת תמונת השיתוף, ולינק בוואטסאפ עובר בלי תמונה.
  // Netlify מעביר בזמן הבנייה את הכתובת הראשית של האתר במשתנה URL (הדומיין הפרטי כשיוגדר, אחרת כתובת netlify.app),
  // ולכן כשיחובר דומיין הכול יתעדכן לבד. בבנייה מקומית אין URL, והתגיות לא נכתבות (כמו קודם).
  site: process.env.URL || undefined,
  // מפת אתר לגוגל (2026-11-15, האתר באוויר בדומיין). בלי עמודים מוסתרים מגוגל (noindex)
  integrations: [mdx(), sitemap({ filter: (page) => !/\/(404)\/?$/.test(page) })]
});