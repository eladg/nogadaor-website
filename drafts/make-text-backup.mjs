// גיבוי טקסט האתר: מחלץ את כל הטקסט מכל העמודים הבנויים (dist) לקובץ Markdown אחד, לפי סדר התפריט.
// הרצה (אחרי npm run build), מתוך שורש הריפוזיטורי:
//   node drafts/make-text-backup.mjs
// נוצר בשורש הקובץ "גיבוי טקסט האתר <תאריך>.md". טקסט שמסומן aria-hidden (כריכות, איורים) נכלל פעם אחת,
// ועותקים כפולים של קרוסלות נעות מושמטים.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const day = new Date().toLocaleDateString('sv-SE');
const root = process.argv[2] || process.cwd();
const outFile = process.argv[3] || path.join(root, `גיבוי טקסט האתר ${day}.md`);
const logFile = process.argv[4] || null;
const { parse } = await import(pathToFileURL(path.join(root, 'node_modules/ultrahtml/dist/index.js')).href);

const ELEMENT = 1, TEXT = 2;
const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'template', 'iframe', 'head', 'link', 'meta']);
const BLOCK = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'dd', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre',
  'section', 'table', 'thead', 'tbody', 'tr', 'ul', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'legend', 'option', 'select', 'textarea']);
const TIGHT = new Set(['strong', 'em', 'b', 'i', 'mark', 'u', 'sup', 'sub', 'br', 'wbr']);
const HEAD = { h1: '### ', h2: '#### ', h3: '##### ', h4: '###### ', h5: '###### ', h6: '###### ' };

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', larr: '←', rarr: '→', copy: '©', middot: '·', shy: '' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => (n in ENT ? ENT[n] : m));
const isWord = (ch) => /[\p{L}\p{N}]/u.test(ch || '');

const log = [];

const norm = (t) => t.replace(/[^\p{L}\p{N}]/gu, '');
function extractFull(node, page) {
  const vis = extract(node, page, null, true);
  return extract(node, page, norm(vis.join(' ')));
}
function extract(node, page, visNorm = null, quiet = false) {
  let seenHidden = '';
  const kept = [];
  const lines = [];
  let buf = '';
  let prefix = '';
  let pendingBoundary = false; // an inline (non-tight) element boundary happened since last text
  const dropped = [];
  const joins = [];

  const flush = () => {
    const t = buf.replace(/[ \t ]+/g, ' ').trim();
    if (t) lines.push(prefix + t);
    buf = '';
    prefix = '';
    pendingBoundary = false;
  };
  const addText = (raw) => {
    let t = decode(raw).replace(/\s+/g, ' ');
    if (!t) return;
    if (pendingBoundary && buf && !/\s$/.test(buf) && !/^\s/.test(t)) {
      const L = buf.at(-1), R = t[0];
      const lastTok = buf.trim().split(' ').at(-1);
      if (/^[,.:;!?)\]"'׳״…]/.test(R) || /[(\["'״]$/.test(L)) {
        // punctuation hugging a tag: keep as is
      } else if (/^[א-ת]$/.test(lastTok) && isWord(R)) {
        joins.push('PREFIX ' + buf.slice(-18) + ' ⟂ ' + t.slice(0, 18));
      } else if (/^[\d.,+%]{1,5}$/.test(buf.trim()) || L === ',') {
        buf += ' ';
      } else {
        joins.push((isWord(L) && isWord(R) ? '' : 'PUNCT ') + buf.slice(-18) + ' ⟂ ' + t.slice(0, 18));
        flush();
      }
    }
    pendingBoundary = false;
    buf += t;
  };
  const plain = (n) => {
    if (n.type === TEXT) return decode(n.value);
    if (n.type !== ELEMENT || SKIP.has(n.name)) return '';
    return (n.children || []).map(plain).join(' ');
  };

  const walk = (n) => {
    if (n.type === TEXT) return addText(n.value);
    if (n.type !== ELEMENT) { (n.children || []).forEach(walk); return; }
    const name = n.name;
    const a = n.attributes || {};
    if (SKIP.has(name)) return;
    if (a['aria-hidden'] === 'true' && visNorm !== '') {
      if (visNorm === null) return;
      flush();
      const sub = extract({ type: ELEMENT, name: 'div', attributes: {}, children: n.children || [] }, page, '', true);
      const whole = sub.join(' ');
      if (sub.length <= 4 && whole.length <= 90 && !sub.some((l) => l.startsWith('- '))) {
        // short decorative unit (usually a cover caption): keep or drop as one piece
        const k = norm(whole);
        if (!/\p{L}/u.test(whole)) return;
        if (visNorm.includes(k) || seenHidden.includes(k)) { dropped.push(whole); return; }
        seenHidden += '|' + k;
        const isCover = /(^|\s)(cc|item__cover)(\s|$)/.test(a.class || '') || /cover/.test(a.class || '');
        const l = isCover ? `[כיתוב על הכריכה: ${whole}]` : whole;
        lines.push(l);
        kept.push(l);
        return;
      }
      for (const l of sub) {
        const k = norm(l);
        if (l === 'Website') continue;
        const isTime = /^\d+:\d\d$/.test(l.trim());
        if (!isTime && !/\p{L}/u.test(l)) continue;
        if (!isTime && (visNorm.includes(k) || seenHidden.includes(k))) { dropped.push(l); continue; }
        seenHidden += '|' + k;
        lines.push(l);
        kept.push(l);
      }
      return;
    }
    if (name === 'br') { flush(); return; }
    if (name === 'img') {
      const alt = decode(a.alt || '').trim();
      if (alt) { flush(); lines.push(`[תמונה: ${alt}]`); }
      return;
    }
    if (name === 'input') {
      const type = a.type || 'text';
      if (type === 'hidden') return;
      const ph = decode(a.placeholder || a.value || '').trim();
      if (ph && type !== 'checkbox' && type !== 'radio') { flush(); lines.push(`[שדה: ${ph}]`); }
      return;
    }
    const block = BLOCK.has(name) || name === 'td' || name === 'th';
    if (block) flush(); else if (!TIGHT.has(name)) pendingBoundary = true;
    if (HEAD[name]) prefix = HEAD[name];
    if (name === 'li') prefix = '- ';
    if (name === 'summary') prefix = '▸ ';
    if (name === 'blockquote') prefix = '> ';
    if (name === 'textarea' && a.placeholder) lines.push(`[שדה: ${decode(a.placeholder)}]`);
    const before = lines.length + buf.length;
    (n.children || []).forEach(walk);
    // icon-only links/buttons: keep their accessible name
    if ((name === 'a' || name === 'button') && a['aria-label'] && lines.length + buf.length === before) {
      addText(` [${decode(a['aria-label'])}] `);
    }
    // WhatsApp links that open with a ready-made message
    if (name === 'a' && /[?&]text=/.test(a.href || '')) {
      try {
        const msg = decodeURIComponent(decode(a.href).split(/[?&]text=/)[1].split('&')[0].replace(/\+/g, ' ')).trim();
        if (msg) addText(` [הודעה מוכנה בוואטסאפ: ${msg}] `);
      } catch {}
    }
    if (block) flush(); else if (!TIGHT.has(name)) pendingBoundary = true;
  };
  walk(node);
  flush();
  if (!quiet && visNorm !== null) {
    if (kept.length) log.push(`\n== ${page} :: KEPT hidden ==\n` + kept.join('\n'));
    if (dropped.length) log.push(`\n== ${page} :: DROPPED hidden duplicates ==\n` + dropped.map((d) => d.slice(0, 70)).join('\n'));
    if (joins.length) log.push(`\n== ${page} :: BREAKS ==\n` + joins.join('\n'));
  }
  return lines;
}

function find(node, pred) {
  if (node.type === ELEMENT && pred(node)) return node;
  for (const c of node.children || []) { const r = find(c, pred); if (r) return r; }
  return null;
}
function findAll(node, pred, acc = []) {
  if (node.type === ELEMENT && pred(node)) acc.push(node);
  for (const c of node.children || []) findAll(c, pred, acc);
  return acc;
}

// Tidy: markdown paragraphs, consecutive list items kept tight
function toMd(lines) {
  const out = [];
  lines.forEach((l, i) => {
    const prev = lines[i - 1] || '';
    const tight = l.startsWith('- ') && prev.startsWith('- ');
    if (i && !tight) out.push('');
    out.push(l);
  });
  return out.join('\n');
}

const dist = path.join(root, 'dist');
const files = [];
(function scan(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) scan(p); else if (e.name.endsWith('.html')) files.push(p);
  }
})(dist);

const urlOf = (f) => {
  let r = path.relative(dist, f).split(path.sep).join('/');
  if (r === 'index.html') return '/';
  if (r === '404.html') return '/404';
  return '/' + r.replace(/index\.html$/, '');
};

const pages = files.map((f) => {
  const html = fs.readFileSync(f, 'utf8');
  const doc = parse(html);
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').trim();
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  return { f, url: urlOf(f), doc, title, desc, noindex };
});

// Page order: follows the site menu
const groups = [
  ['עמוד הבית', (u) => u === '/'],
  ['שירותים', (u) => u.startsWith('/services/')],
  ['אודות', (u) => u === '/about/'],
  ['מרכז הידע (מדריכים, מאמרים, שאלון)', (u) => u.startsWith('/guides/')],
  ['קטלוג הדרכות', (u) => u.startsWith('/trainings/')],
  ['המלצות', (u) => u === '/testimonials/'],
  ['צור קשר', (u) => u === '/contact/'],
  ['עמודי מדיניות ועמוד שגיאה', () => true],
];
const used = new Set();
const ordered = [];
for (const [name, test] of groups) {
  const g = pages.filter((p) => !used.has(p.url) && test(p.url))
    .sort((x, y) => (x.url.split('/').length - y.url.split('/').length) || x.url.localeCompare(y.url));
  g.forEach((p) => used.add(p.url));
  ordered.push([name, g]);
}

const today = day;
let md = `# גיבוי טקסט האתר של נוגה דיין-אור\n\n`;
md += `נוצר ב-${today}, מתוך האתר כפי שהוא נבנה באותו יום (${pages.length} עמודים).\n\n`;
md += `הקובץ מכיל את כל הטקסט שמופיע בעמודים, לפי סדר התפריט. לכל עמוד: הכתובת, הכותרת והתיאור לגוגל, ואחריהם הטקסט מלמעלה למטה.\n\n`;
md += `סימונים: שורה שמתחילה ב-"[תמונה: ...]" היא התיאור של תמונה (alt), "[שדה: ...]" הוא טקסט בתוך שדה בטופס, ו-"▸" היא שאלה שנפתחת בלחיצה.\n\n`;

md += `## תוכן הקובץ\n\n`;
for (const [name, g] of ordered) {
  md += `**${name}**\n\n`;
  for (const p of g) md += `- ${p.title.replace(/\s*\|.*$/, '')} (\`${p.url}\`)\n`;
  md += '\n';
}

// Shared header + footer, once (taken from the home page)
const home = pages.find((p) => p.url === '/');
const body = find(home.doc, (n) => n.name === 'body');
const main = find(body, (n) => n.name === 'main');
const shared = { type: ELEMENT, name: 'div', attributes: {}, children: [] };
const before = [], after = [];
let seenMain = false;
(function split(n) {
  for (const c of n.children || []) {
    if (c === main) { seenMain = true; continue; }
    if (c.type === ELEMENT && find(c, (x) => x === main)) { split(c); continue; }
    (seenMain ? after : before).push(c);
  }
})(body);
md += `---\n\n## חלקים שחוזרים בכל עמוד\n\n### הכותרת העליונה והתפריט\n\n`;
md += toMd(extractFull({ type: ELEMENT, name: 'div', attributes: {}, children: before }, 'header')) + '\n\n';
md += `### הפוטר (תחתית האתר)\n\n`;
md += toMd(extractFull({ type: ELEMENT, name: 'div', attributes: {}, children: after }, 'footer')) + '\n\n';

// Texts that appear only after an action (written by page scripts, so they are not in the built HTML)
const quiz = await import(pathToFileURL(path.join(root, 'src/data/quiz.ts')).href);
const extras = {
  '/guides/business-focus-quiz/': [
    '#### טקסטים שמופיעים רק במסך התוצאה',
    '',
    'רמת העסק לפי הציון הכללי:',
    '',
    ...quiz.quizLevels.map((l) => `- מ-${l.min}% ומעלה: ${l.title}. ${l.text}`),
    '',
    'אפשרויות להגדלת הכנסות (מוצגות לכל תשובה חלשה, לפי תחומים):',
    '',
    ...quiz.quizQuestions.map((q) => `- ${q.text} ← ${q.grow}`),
    '',
    'מה כבר עובד ושווה לשמור (מוצג לכל תשובה חזקה):',
    '',
    ...quiz.quizQuestions.map((q) => `- ${q.text} ← ${q.keep}`),
    '',
    'המשפטים המסכמים: נמצאו [מספר] אפשרויות להגדלת הכנסות, כולן מתוך מה שכבר קיים בעסק ובלי להוציא עוד כסף על לידים. הכי הרבה פוטנציאל נמצא בתחומים [שני התחומים החלשים]. / [מספר] דברים כבר עובדים טוב בעסק, והתחום החזק ביותר הוא [התחום]. כדאי להישען עליהם, כי את מה שכבר עובד חזק אפשר להגביר.',
    '',
    'הודעת הוואטסאפ המוכנה: היי נוגה, מילאתי את שאלון המיקוד העסקי. הכי הרבה פוטנציאל יצא לי ב[שלושת התחומים]. אשמח לשיחה',
    '',
    'כפתורי המעבר בין השאלות: הבאה ← / לתוצאה ←',
  ].join('\n'),
  '/contact/': [
    '#### הודעות של טופס ההרשמה (מופיעות אחרי שליחה)',
    '',
    '- בזמן השליחה: שולחים…',
    '- הצלחה: תודה, ההרשמה התקבלה.',
    '- תקלה: משהו השתבש בשליחה. אפשר לנסות שוב, או לכתוב ישירות בוואטסאפ',
  ].join('\n'),
};

const stats = [];
for (const [name, g] of ordered) {
  md += `---\n\n# ${name}\n\n`;
  for (const p of g) {
    const m = find(p.doc, (n) => n.name === 'main');
    const lines = extractFull(m, p.url);
    // anything in <body> outside <main> that differs from the home page (page-specific bands)
    md += `## ${p.title.replace(/\s*\|.*$/, '')}\n\n`;
    md += `כתובת: \`${p.url}\`\n\n`;
    md += `כותרת בלשונית ובגוגל: ${p.title}\n\n`;
    if (p.desc) md += `תיאור לגוגל: ${p.desc}\n\n`;
    if (p.noindex) md += `(העמוד מוסתר ממנועי חיפוש)\n\n`;
    md += toMd(lines) + '\n\n';
    if (extras[p.url]) md += extras[p.url] + '\n\n';
    const words = lines.join(' ').split(/\s+/).filter(Boolean).length;
    stats.push(`${p.url}\t${lines.length} שורות\t${words} מילים`);
  }
}

fs.writeFileSync(outFile, md, 'utf8');
if (logFile) fs.writeFileSync(logFile, stats.join('\n') + '\n' + log.join('\n'), 'utf8');
console.log(stats.join('\n'));
console.log('נשמר:', outFile);
