// פונקציה של Netlify שרצה בשרת (לא בדפדפן): מקבלת את הטפסים מעמוד צור קשר
// ויוצרת איש קשר חדש בסמוב (Smoove). כך מפתח ה-API לא נחשף לגולשים.
//
// משתני סביבה (מגדירים ב-Netlify: Site configuration > Environment variables):
//   SMOOVE_API_KEY             חובה. מפתח ה-API של סמוב.
//   SMOOVE_NEWSLETTER_LIST_ID  לא חובה. מספר הרשימה בסמוב שאליה נכנסים הנרשמים לתכנים במייל
//                              (אפשר כמה, מופרדים בפסיק).
//   SMOOVE_CONTACT_LIST_ID     לא חובה. מספר הרשימה בסמוב למי שהשאיר פרטים בטופס הפנייה.
//   SMOOVE_MESSAGE_FIELD       לא חובה. המפתח של שדה מותאם אישית בסמוב (למשל i5) שבו תישמר
//                              ההודעה מטופס הפנייה. בלי השדה הזה ההודעה לא נשמרת בסמוב.
//
// תיעוד ה-API: https://rest.smoove.io (POST /v1/Contacts, הרשאה: Authorization: Bearer <key>)

const SMOOVE_URL = 'https://rest.smoove.io/v1/Contacts';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function env(name) {
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

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// בונה את איש הקשר לפי סוג הטופס. מחזיר { error } אם חסר שדה חובה.
export function buildContact(data) {
  const form = data.form === 'newsletter' ? 'newsletter' : 'contact';
  const name = clean(data.name, 100);
  const email = clean(data.email, 200).toLowerCase();
  const phone = clean(data.phone, 30);
  const message = clean(data.message, 2000);
  const consent = data.consent === true || data.consent === 'on';

  if (email && !EMAIL_RE.test(email)) return { error: 'invalid_email' };

  if (form === 'newsletter') {
    if (!email) return { error: 'missing_email' };
    if (!consent) return { error: 'missing_consent' };
  } else {
    if (!name) return { error: 'missing_name' };
    if (!phone) return { error: 'missing_phone' };
  }

  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
  const contact = {
    firstName: firstName || undefined,
    lastName: rest.join(' ') || undefined,
    email: email || undefined,
    cellPhone: phone || undefined,
    // דיוור רק למי שסימן הסכמה בטופס ההרשמה. בטופס הפנייה אין תיבת הסכמה.
    canReceiveEmails: form === 'newsletter' ? consent : false,
    // אף טופס לא מבקש הסכמה ל-SMS או לוואטסאפ, ובסמוב ברירת המחדל היא "כן"
    canReceiveSmsMessages: false,
    canReceiveWhatsappMessages: false,
    campaignSource: form === 'newsletter' ? 'אתר: הרשמה לתכנים במייל' : 'אתר: טופס פנייה',
  };

  const lists = listIds(form === 'newsletter' ? 'SMOOVE_NEWSLETTER_LIST_ID' : 'SMOOVE_CONTACT_LIST_ID');
  if (lists.length) contact.lists_ToSubscribe = lists;

  const messageField = env('SMOOVE_MESSAGE_FIELD');
  if (form === 'contact' && message && messageField) {
    contact.customFields = { [messageField]: message };
  }

  return { contact };
}

async function sendToSmoove(contact, apiKey, query = '') {
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

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const apiKey = env('SMOOVE_API_KEY');
  if (!apiKey) {
    console.error('SMOOVE_API_KEY is not set');
    return json(500, { ok: false, error: 'not_configured' });
  }

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

  try {
    let res = await sendToSmoove(contact, apiKey);

    // איש הקשר כבר קיים בסמוב: מנסים לעדכן (למשל כדי לצרף אותו לרשימה).
    // אם למפתח אין הרשאת עדכון, הפנייה עדיין נחשבת הצלחה מבחינת הגולש.
    if (res.status === 409) {
      // בעדכון לא משנים הסכמה לדיוור שכבר ניתנה, אלא אם הגולש סימן עכשיו הסכמה
      const updateContact = { ...contact };
      if (!updateContact.canReceiveEmails) delete updateContact.canReceiveEmails;
      delete updateContact.canReceiveSmsMessages;
      delete updateContact.canReceiveWhatsappMessages;
      const update = await sendToSmoove(updateContact, apiKey, '?updateIfExists=true');
      if (!update.ok) {
        console.warn('Smoove update of existing contact failed', update.status, await update.text());
      }
      return json(200, { ok: true });
    }

    if (!res.ok) {
      console.error('Smoove error', res.status, await res.text());
      return json(502, { ok: false, error: 'smoove_error' });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('Smoove request failed', err);
    return json(502, { ok: false, error: 'smoove_unreachable' });
  }
};

export const config = { path: '/api/contact' };
