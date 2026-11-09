// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // כתובת האתר (2026-11-09): בלעדיה לא נכתבת תמונת השיתוף, ולינק בוואטסאפ עובר בלי תמונה.
  // Netlify מעביר בזמן הבנייה את הכתובת הראשית של האתר במשתנה URL (הדומיין הפרטי כשיוגדר, אחרת כתובת netlify.app),
  // ולכן כשיחובר דומיין הכול יתעדכן לבד. בבנייה מקומית אין URL, והתגיות לא נכתבות (כמו קודם).
  site: process.env.URL || undefined,
  integrations: [mdx()]
});