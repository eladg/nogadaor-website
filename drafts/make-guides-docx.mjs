// סקריפט עזר (לא חלק מהאתר): יוצר קובץ Word לכל מדריך שעוד "בקרוב" (comingSoon), כדי שנוגה תעבוד על הטקסט (2026-11-13).
// הרצה: בתיקייה זמנית מחוץ לפרויקט: npm i docx@9, להעתיק את הקובץ לשם, ואז:
//   node make-guides-docx.mjs <תיקיית הפרויקט> <תיקיית יעד>
// הרכיבים המעוצבים (כרטיסים, שלבים, תיבות להעתקה) מומרים לטקסט עם כותרות, כדי שיהיה נוח לקרוא ולערוך.
import fs from 'node:fs';
import path from 'node:path';
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType } from 'docx';

const [root, outDir] = process.argv.slice(2);
const dir = path.join(root, 'src/content/guides');
fs.mkdirSync(outDir, { recursive: true });

const NAVY = '0B1A33', TEAL = '08677F', GOLD = 'A8701F', GREY = '5A6A80', FONT = 'Arial';

const attrs = (tag) => {
  const o = {};
  for (const m of tag.matchAll(/(\w+)=(?:"([^"]*)"|\{'([^']*)'\}|\{([^}]*)\})/g)) o[m[1]] = m[2] ?? m[3] ?? m[4];
  return o;
};
// טקסט עם **הדגשה** וקישורים [טקסט](כתובת) ← רצפי טקסט
const runs = (text, o = {}) => {
  const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<[^>]+>/g, '').replace(/\\([*_])/g, '$1');
  return clean.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) => {
    const b = part.startsWith('**') && part.endsWith('**');
    return new TextRun({ text: b ? part.slice(2, -2) : part, bold: o.bold || b, italics: o.italics, rightToLeft: true, font: FONT, size: o.size ?? 24, color: o.color ?? NAVY });
  });
};
const para = (text, o = {}) =>
  new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: 300 },
    indent: o.indent ? { right: o.indent } : undefined,
    border: o.box ? Object.fromEntries(['top', 'bottom', 'left', 'right'].map((k) => [k, { style: BorderStyle.SINGLE, size: 6, color: 'B8CDD3', space: 6 }])) : undefined,
    shading: o.box ? { type: ShadingType.CLEAR, fill: 'F2F8FA', color: 'auto' } : undefined,
    keepNext: o.keepNext,
    children: runs(text, o),
  });

function convert(file) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n');
  const [, fm, bodyRaw] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1] ?? '').replace(/\s+#.*$/, '').replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
  const list = (k) => (fm.match(new RegExp(`^${k}:\\n((?:\\s+- .*\\n?)+)`, 'm'))?.[1] ?? '').split('\n').map((l) => l.replace(/^\s+- /, '').trim()).filter(Boolean);
  const data = { title: field('title'), tagline: field('tagline'), description: field('description'), gains: list('gains'), type: field('type'), comingSoon: /^comingSoon:\s*true/m.test(fm), order: Number(field('order')) };
  if (!data.comingSoon) return null;

  let body = bodyRaw.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  // קרחון: רכיב בשורה אחת מרובת שורות, לטקסט
  body = body.replace(/<Iceberg([\s\S]*?)\/>/g, (_, a) => {
    const at = attrs(a);
    const items = (a.match(/items=\{\[([^\]]*)\]\}/)?.[1] ?? '').match(/'([^']*)'/g)?.map((s) => s.slice(1, -1)) ?? [];
    return `\n@@BOLD מעל המים: ${at.top ?? ''} (${at.topNote ?? ''})\n@@BOLD מתחת למים: ${at.bottomTitle ?? ''}\n${items.map((i) => `- ${i}`).join('\n')}\n`;
  });

  const out = [
    para(data.title, { size: 40, bold: true, color: TEAL, after: 120 }),
    data.tagline && para(data.tagline, { size: 26, bold: true, color: GOLD, after: 160 }),
    para(`${data.type === 'article' ? 'מאמר' : 'מדריך'} · טיוטה לעבודה, הטקסט כפי שהוא באתר נכון ל-13.11.2026`, { size: 20, color: GREY, after: 200 }),
    para('תיאור (מופיע בגוגל ובשיתוף)', { size: 22, bold: true, color: TEAL, after: 60 }),
    para(data.description, { after: 200 }),
  ].filter(Boolean);
  if (data.gains.length) {
    out.push(para('מה תקבלו', { size: 22, bold: true, color: TEAL, after: 60 }));
    data.gains.forEach((g) => out.push(para(`•  ${g}`, { indent: 300, after: 60 })));
  }

  let stepNo = 0, inChecklist = false, inBox = false, inQuote = false;
  for (let line of body.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let m;
    if ((m = t.match(/^##\s+(.*)/)) && !t.startsWith('###')) { out.push(para(m[1], { size: 32, bold: true, color: TEAL, before: 360, after: 120, keepNext: true })); continue; }
    if ((m = t.match(/^###\s+(.*)/))) { out.push(para(m[1], { size: 27, bold: true, color: NAVY, before: 240, after: 100, keepNext: true })); continue; }
    if ((m = t.match(/^@@BOLD (.*)/))) { out.push(para(m[1], { bold: true, after: 60 })); continue; }
    if ((m = t.match(/^<(\w+)([^>]*?)(\/?)>(.*)$/))) {
      const [, name, a, selfClose, rest] = m;
      const at = attrs(a);
      const label = (s) => out.push(para(s, { bold: true, color: GOLD, size: 22, before: 160, after: 60, keepNext: true }));
      if (name === 'Steps') stepNo = 0;
      if (name === 'Part') out.push(para(`חלק חדש: ${at.title}`, { size: 34, bold: true, color: GOLD, before: 480, after: 160 }));
      if (name === 'Band') label(`[פס מודגש${at.kicker ? `: ${at.kicker}` : ''}]`);
      if (name === 'Callout') label(`[תיבה מודגשת${at.title ? `: ${at.title}` : ''}]`);
      if (name === 'Card') out.push(para(`${at.num ? `${at.num}. ` : ''}${at.title ?? ''}`, { bold: true, color: TEAL, before: 120, after: 40, keepNext: true }));
      if (name === 'Step') out.push(para(`שלב ${++stepNo}: ${at.title ?? ''}`, { bold: true, color: TEAL, before: 120, after: 40, keepNext: true }));
      if (name === 'Panel') out.push(para(at.title ?? '', { bold: true, color: TEAL, before: 160, after: 60, keepNext: true }));
      if (name === 'Checklist') { inChecklist = true; label(`[רשימת סימון${at.title ? `: ${at.title}` : ''}]`); }
      if (name === 'CopyBox') { inBox = true; label(`[${at.label ?? 'להעתקה'}${at.title ? `: ${at.title}` : ''}]`); }
      if (name === 'Takeaways') label('[בקיצור]');
      if (name === 'Says') { inQuote = true; label('[משפטים לצ\'אט]'); }
      if (rest && !selfClose) { const txt = rest.replace(/<\/\w+>\s*$/, '').trim(); if (txt) out.push(para(txt, { box: inBox })); }
      continue;
    }
    if ((m = t.match(/^<\/(\w+)>$/))) {
      if (m[1] === 'Checklist') inChecklist = false;
      if (m[1] === 'CopyBox') inBox = false;
      if (m[1] === 'Says') inQuote = false;
      continue;
    }
    if (/^\|/.test(t)) { if (!/^\|[\s:|-]+\|$/.test(t)) out.push(para(t.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).join('  |  '), { after: 60 })); continue; }
    if ((m = t.match(/^[-*]\s+(.*)/))) { out.push(para(`${inChecklist ? '☐' : '•'}  ${m[1]}`, { indent: 300, after: 60, box: inBox })); continue; }
    if ((m = t.match(/^>\s*(.*)/))) { out.push(para(m[1], { italics: true, color: TEAL })); continue; }
    out.push(para(t, { box: inBox, italics: inQuote }));
  }
  return { data, doc: new Document({ styles: { default: { document: { run: { font: FONT } } } }, sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children: out }] }) };
}

const results = fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).map(convert).filter(Boolean).sort((a, b) => a.data.order - b.data.order);
let n = 0;
for (const { data, doc } of results) {
  const name = `${String(++n).padStart(2, '0')} ${data.title.replace(/[\\/:*?"<>|]/g, '').trim()}.docx`;
  fs.writeFileSync(path.join(outDir, name), await Packer.toBuffer(doc));
  console.log(name);
}
