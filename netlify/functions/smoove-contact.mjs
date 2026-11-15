// פונקציה של Netlify שרצה בשרת (לא בדפדפן): מקבלת את טופס ההרשמה מרצון לרשימת הדיוור
// בעמוד צור קשר, ויוצרת איש קשר חדש בסמוב (Smoove). כך מפתח ה-API לא נחשף לגולשים.
// פניות מתקבלות רק בוואטסאפ (נוגה, 2026-11-08).
//
// משתני סביבה (מגדירים ב-Netlify: Site configuration > Environment variables):
//   SMOOVE_API_KEY             חובה. מפתח ה-API של סמוב.
//   SMOOVE_NEWSLETTER_LIST_ID  לא חובה. מספר הרשימה בסמוב שאליה נכנסים הנרשמים
//                              (אפשר כמה, מופרדים בפסיק).
//
// הפונקציה לא משנה שום הגדרה בסמוב. היא רק שולחת את הפרטים שהגולש מילא.
// גם שאלון המיקוד שולח לסמוב (quiz-save.mjs), רק מי שסימן הסכמה לדיוור. הקוד המשותף: netlify/lib/smoove.mjs
// תיעוד ה-API: https://rest.smoove.io (POST /v1/Contacts, הרשאה: Authorization: Bearer <key>)

import { addToSmoove, smooveContact } from '../lib/smoove.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// בונה את איש הקשר מהטופס. מחזיר { error } אם חסר שדה חובה.
export function buildContact(data) {
  const name = clean(data.name, 100);
  const email = clean(data.email, 200).toLowerCase();
  const phone = clean(data.phone, 30);
  const consent = data.consent === true || data.consent === 'on';

  if (!email) return { error: 'missing_email' };
  if (!EMAIL_RE.test(email)) return { error: 'invalid_email' };
  if (!phone) return { error: 'missing_phone' };
  if (!consent) return { error: 'missing_consent' };

  const contact = smooveContact({ name, email, phone, source: 'אתר: הרשמה לרשימת הדיוור' });
  return { contact };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  let data;
  try {
    data = await req.json();
  } catch {
    return json(400, { ok: false, error: 'bad_request' });
  }
  if (!data || typeof data !== 'object') return json(400, { ok: false, error: 'bad_request' });

  // מלכודת לרובוטים: שדה מוסתר שגולש אמיתי לא ממלא. עונים "הצלחה" בלי לשלוח לסמוב.
  if (clean(data.website, 200)) return json(200, { ok: true });

  const { contact, error } = buildContact(data);
  if (error) return json(400, { ok: false, error });

  const result = await addToSmoove(contact);
  if (result === 'ok') return json(200, { ok: true });
  return json(result === 'not_configured' ? 500 : 502, { ok: false, error: result });
};

export const config = { path: '/api/contact' };
