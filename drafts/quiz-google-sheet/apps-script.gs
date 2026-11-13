// שאלון המיקוד: שמירת התשובות בגיליון גוגל של נוגה.
// מדביקים את כל הקוד הזה ב-Apps Script של הגיליון (ההוראות בקובץ README.md שבאותה תיקייה).
//
// האתר שולח לכאן שני סוגי שורות:
// - "הושלם": מישהו ענה על כל השאלות (בלי שם ובלי מייל). שורה חדשה.
// - "השאיר פרטים": אותו אדם מילא שם ומייל כדי לפתוח את התוצאה. הפרטים נכתבים באותה שורה.
// עמודה חדשה נוספת לבד אם האתר שולח שדה שעוד אין לו עמודה (למשל כשמוסיפים שאלה).

// הסיסמה המשותפת לאתר ולגיליון. מחליפים במחרוזת ארוכה שרק את ואלעד יודעים
// (למשל 30 אותיות ומספרים באנגלית, בלי רווחים). לא שולחים אותה בצ'אט.
const SECRET = 'להחליף-במחרוזת-ארוכה';
const SHEET_NAME = 'תשובות';
const FIRST_COLUMNS = ['תאריך', 'מזהה', 'סטטוס'];

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return out({ ok: false, error: 'bad_json' });
  }
  if (!data || data.secret !== SECRET) return out({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet();
    const row = data.row && typeof data.row === 'object' ? data.row : {};
    row['מזהה'] = String(data.id || '').slice(0, 60);

    if (data.type === 'lead') {
      row['סטטוס'] = 'השאיר פרטים';
      row['תאריך השארת פרטים'] = new Date();
      const existing = findRow(sheet, row['מזהה']);
      if (existing) {
        writeRow(sheet, existing, row);
        return out({ ok: true });
      }
    } else {
      row['סטטוס'] = 'הושלם';
    }
    row['תאריך'] = new Date();
    writeRow(sheet, sheet.getLastRow() + 1, row);
    return out({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, FIRST_COLUMNS.length).setValues([FIRST_COLUMNS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
  }
  return sheet;
}

function headers(sheet) {
  const width = sheet.getLastColumn();
  if (!width) return [];
  return sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
}

// כותב את השדות לשורה r. שדה בלי עמודה מקבל עמודה חדשה בסוף
function writeRow(sheet, r, row) {
  const head = headers(sheet);
  Object.keys(row).forEach((k) => {
    if (head.indexOf(k) === -1) head.push(k);
  });
  sheet.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  const range = sheet.getRange(r, 1, 1, head.length);
  const values = range.getValues()[0];
  head.forEach((h, i) => {
    if (Object.prototype.hasOwnProperty.call(row, h)) values[i] = safe(row[h]);
  });
  range.setValues([values]);
}

// מחפש את השורה של אותו ממלא (מהסוף להתחלה)
function findRow(sheet, id) {
  if (!id) return 0;
  const col = headers(sheet).indexOf('מזהה') + 1;
  const last = sheet.getLastRow();
  if (!col || last < 2) return 0;
  const ids = sheet.getRange(2, col, last - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === id) return i + 2;
  }
  return 0;
}

// טקסט נשמר כטקסט: בלי נוסחאות, ובלי שהגיליון יהפוך "4-5" לתאריך או ימחק את ה-0 בתחילת מספר טלפון
function safe(v) {
  if (v instanceof Date || typeof v === 'number' || typeof v === 'boolean') return v;
  const s = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@\d]/.test(s) ? "'" + s : s;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// בדיקה: מריצים את הפונקציה הזו פעם אחת מתוך העורך (כפתור "הפעלה"). אמורה להופיע שורת בדיקה בלשונית "תשובות".
// אחרי הבדיקה אפשר למחוק את השורה מהגיליון.
function testWrite() {
  const res = doPost({
    postData: {
      contents: JSON.stringify({ secret: SECRET, type: 'complete', id: 'test-' + Date.now(), row: { 'מי עובד בעסק': 'בדיקה' } }),
    },
  });
  Logger.log(res.getContent());
}
