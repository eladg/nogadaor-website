// שאלון המיקוד: שמירת התשובות בגיליון גוגל של נוגה (כתובת /api/quiz).
// הדפדפן שולח לכאן, והפונקציה מעבירה לגיליון. הכתובת והסיסמה של הגיליון נשמרות רק כאן, בשרת.
//
// משתני סביבה (מגדירים ב-Netlify: Site configuration > Environment variables):
// - QUIZ_SHEET_URL: כתובת ה-Web app של ה-Apps Script בגיליון (נגמרת ב-/exec)
// - QUIZ_SHEET_SECRET: אותה סיסמה משותפת שכתובה בקוד ה-Apps Script (SECRET)
// הקוד של הגיליון וההוראות: drafts/quiz-google-sheet/
//
// שני סוגים:
// - complete: מישהו סיים את כל השאלות. נשלחות התשובות והציונים, בלי פרטים אישיים.
// - lead: אותו אדם השאיר שם ומייל כדי לפתוח את התוצאה. הפרטים נכתבים באותה שורה (לפי המזהה).
//   שם, מייל, טלפון וסימון ההסכמה חובה (נוגה, 2026-11-15). הפרטים נכתבים לגיליון יחד עם התשובות,
//   ונכנסים גם לסמוב. התשובות נשמרות בגיליון גם בשורת "הושלם", כך שהסטטיסטיקה כוללת גם מי שלא השאיר פרטים.

import { addToSmoove, env, smooveContact } from '../lib/smoove.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELDS = 80;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// התשובות והציונים: שם עמודה ← ערך (טקסט או מספר). רק שדות קצרים, ולא יותר מ-MAX_FIELDS
function cleanAnswers(row) {
  const out = {};
  if (!row || typeof row !== 'object') return out;
  Object.keys(row)
    .slice(0, MAX_FIELDS)
    .forEach((k) => {
      const key = clean(k, 80);
      const v = row[k];
      if (!key) return;
      if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
      else if (typeof v === 'string') out[key] = clean(v, 300);
    });
  return out;
}

export function buildPayload(data) {
  const type = data.type === 'lead' ? 'lead' : 'complete';
  const id = clean(data.id, 60);
  if (!/^[\w-]{6,60}$/.test(id)) return { error: 'bad_id' };

  if (type === 'complete') return { payload: { type, id, row: cleanAnswers(data.answers) } };

  const name = clean(data.name, 100);
  const email = clean(data.email, 200).toLowerCase();
  const phone = clean(data.phone, 30);
  if (!name) return { error: 'missing_name' };
  if (!email) return { error: 'missing_email' };
  if (!EMAIL_RE.test(email)) return { error: 'invalid_email' };
  if (phone.replace(/\D/g, '').length < 9) return { error: 'missing_phone' };
  // האישור חובה בטופס (נוגה, 2026-11-15), ולכן גם כאן
  const marketing = data.marketing === true;
  if (!marketing) return { error: 'missing_consent' };

  return {
    payload: {
      type,
      id,
      row: {
        ...cleanAnswers(data.answers), // אם שורת "הושלם" לא נשמרה, התשובות נשמרות עם הפרטים
        'שם': name,
        'מייל': email,
        'טלפון': phone,
        'מאשר דיוור': marketing ? 'כן' : 'לא',
      },
    },
  };
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

  // מלכודת לרובוטים: שדה מוסתר שאנשים לא ממלאים
  if (clean(data.website, 200)) return json(200, { ok: true });

  const { payload, error } = buildPayload(data);
  if (error) return json(400, { ok: false, error });

  // הגיליון והדיוור בסמוב נשלחים במקביל. כישלון באחד לא עוצר את השני
  const wantsMail = payload.type === 'lead' && data.marketing === true;
  const [sheet, smoove] = await Promise.all([
    saveToSheet(payload),
    wantsMail
      ? addToSmoove(
          smooveContact({
            name: payload.row['שם'],
            email: payload.row['מייל'],
            phone: payload.row['טלפון'],
            source: 'אתר: שאלון המיקוד',
          }),
        )
      : null,
  ]);

  if (sheet === 'ok') return json(200, { ok: true, smoove });
  return json(sheet === 'not_configured' ? 500 : 502, { ok: false, error: sheet, smoove });
};

// מחזיר 'ok', 'not_configured', 'sheet_error' או 'sheet_unreachable'
async function saveToSheet(payload) {
  const url = env('QUIZ_SHEET_URL');
  const secret = env('QUIZ_SHEET_SECRET');
  if (!url || !secret) {
    console.error('QUIZ_SHEET_URL or QUIZ_SHEET_SECRET is not set');
    return 'not_configured';
  }
  try {
    // Apps Script עונה בהפניה (302) לכתובת של גוגל. fetch עוקב אחריה, והכתיבה לגיליון כבר בוצעה
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, ...payload }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {}
    if (!res.ok || !body?.ok) {
      console.error('Sheet error', res.status, text.slice(0, 300));
      return 'sheet_error';
    }
    return 'ok';
  } catch (err) {
    console.error('Sheet request failed', err);
    return 'sheet_unreachable';
  }
}

export const config = { path: '/api/quiz' };
