// robots.txt (2026-11-15): מאפשר לכל מנועי החיפוש וכלי ה-AI לסרוק, ומצביע על מפת האתר.
// הכתובת נלקחת מ-site (ב-Netlify מגיעה מהמשתנה URL), כך שהיא נכונה גם אם הדומיין ישתנה.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site) lines.push('', `Sitemap: ${new URL('sitemap-index.xml', site).href}`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
