// שליחת איש קשר לסמוב (Smoove), משותף לטופס ההרשמה בצור קשר ולשאלון המיקוד.
// הקובץ מחוץ לתיקיית הפונקציות, כדי ש-Netlify לא יהפוך אותו לפונקציה בפני עצמה.
//
// משתני סביבה (Netlify: Site configuration > Environment variables):
//   SMOOVE_API_KEY             חובה. מפתח ה-API של סמוב.
//   SMOOVE_NEWSLETTER_LIST_ID  לא חובה. מספר הרשימה בסמוב לטופס ההרשמה בצור קשר (אפשר כמה, מופרדים בפסיק).
//   SMOOVE_QUIZ_LIST_ID        לא חובה. מספר הרשימה "שאלון אבחון באתר" (נוגה, 2026-11-16). בלעדיו השאלון נכנס לרשימת הדיוור.
//
// לא משנה שום הגדרה בסמוב. רק יוצר איש קשר, או מעדכן איש קשר שכבר קיים (409).
// תיעוד ה-API: https://rest.smoove.io (POST /v1/Contacts, הרשאה: Authorization: Bearer <key>)

const SMOOVE_URL = 'https://rest.smoove.io/v1/Contacts';

export function env(name) {
  // Netlify.env זמין בזמן ריצה ב-Netlify; process.env לבדיקות מקומיות
  const value = globalThis.Netlify?.env?.get(name) ?? process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function listIds(name) {
  return env(name)
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
}

// בונה איש קשר מהפרטים (השם מתפצל לפרטי ומשפחה). טלפון לא חובה
export function smooveContact({ name, email, phone, source, listEnv = 'SMOOVE_NEWSLETTER_LIST_ID' }) {
  const [firstName, ...rest] = (name || '').split(/\s+/).filter(Boolean);
  const contact = {
    firstName: firstName || undefined,
    lastName: rest.join(' ') || undefined,
    email,
    cellPhone: phone || undefined,
    campaignSource: source,
  };
  // רשימה ייעודית אם הוגדרה, אחרת רשימת הדיוור הכללית
  const lists = listIds(listEnv).length ? listIds(listEnv) : listIds('SMOOVE_NEWSLETTER_LIST_ID');
  if (lists.length) contact.lists_ToSubscribe = lists;
  return contact;
}

function post(contact, apiKey, query = '') {
  return fetch(SMOOVE_URL + query, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(contact),
    signal: AbortSignal.timeout(10000),
  });
}

// מחזיר 'ok', 'not_configured', 'smoove_error' או 'smoove_unreachable'
export async function addToSmoove(contact) {
  const apiKey = env('SMOOVE_API_KEY');
  if (!apiKey) {
    console.error('SMOOVE_API_KEY is not set');
    return 'not_configured';
  }
  try {
    const res = await post(contact, apiKey);
    // איש הקשר כבר קיים בסמוב: מעדכנים את הפרטים שמילא (למשל כדי לצרף אותו לרשימה)
    if (res.status === 409) {
      const update = await post(contact, apiKey, '?updateIfExists=true');
      if (!update.ok) {
        console.warn('Smoove update of existing contact failed', update.status, await update.text());
      }
      return 'ok';
    }
    if (!res.ok) {
      console.error('Smoove error', res.status, await res.text());
      return 'smoove_error';
    }
    return 'ok';
  } catch (err) {
    console.error('Smoove request failed', err);
    return 'smoove_unreachable';
  }
}
