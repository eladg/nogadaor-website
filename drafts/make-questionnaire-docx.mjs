// סקריפט עזר (לא חלק מהאתר): יוצר את קובץ ה-Word של שאלון אפיון קהל היעד מתוך המדריך.
// הרצה: בתיקייה זמנית מחוץ לפרויקט: npm i docx@9 sharp, ואז:
//   node make-questionnaire-docx.mjs src/content/guides/target-audience.mdx public/images/logo-color-trim.webp public/guides/target-audience-questionnaire.docx
// להריץ מחדש בכל פעם שהשאלות במדריך משתנות.
import fs from 'node:fs';
import sharp from 'sharp';
import { Document, Packer, Paragraph, TextRun, Header, Footer, ImageRun, AlignmentType, BorderStyle } from 'docx';

const [mdxPath, logoPath, outPath] = process.argv.slice(2);
const mdx = fs.readFileSync(mdxPath, 'utf8');
const block = mdx.split(/<CopyBox[^>]*>/)[1].split('</CopyBox>')[0];
const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const NAVY = '0B1A33', TEAL = '13778C', GOLD = 'B07A30', FONT = 'Arial';
const run = (text, o = {}) => new TextRun({ text, rightToLeft: true, font: FONT, size: o.size ?? 24, bold: o.bold, color: o.color ?? NAVY });
const para = (children, o = {}) =>
  new Paragraph({ bidirectional: true, alignment: o.align ?? AlignmentType.RIGHT, spacing: { before: o.before ?? 0, after: o.after ?? 120 }, children, border: o.border, keepNext: o.keepNext });

const logo = await sharp(logoPath).resize({ width: 600 }).png().toBuffer();
const meta = await sharp(logo).metadata();
const w = 170, h = Math.round((w * meta.height) / meta.width);

const body = [
  para([run('שאלון אפיון קהל היעד שלי', { size: 40, bold: true, color: TEAL })], { after: 160 }),
  para([run('בלי קהל יעד ברור, השיווק מדבר לאף אחד.', { size: 26, bold: true, color: GOLD })], { after: 200 }),
  para([run('תנו לבינה המלאכותית שלכם לעזור לכם להבין מי קהל היעד שלכם: העלו את הקובץ הזה לצ\'אט שאתם עובדים איתו קבוע, ובקשו ממנו לענות על השאלות יחד איתכם.', { size: 24 })], { after: 280 }),
];
for (const l of lines) {
  const sec = l.match(/^\*\*(.+)\*\*$/);
  if (sec) {
    body.push(para([run(sec[1], { size: 28, bold: true, color: TEAL })], {
      before: 280, after: 120,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D19A4A', space: 4 } },
    }));
  } else if (l.startsWith('- ')) {
    body.push(para([run(l.slice(2), { bold: true })], { before: 120, after: 60, keepNext: true }));
    body.push(para([run('', {})], { after: 60, keepNext: true, border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: 'A9B8CC', space: 1 } } }));
    body.push(para([run('', {})], { after: 120, border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: 'A9B8CC', space: 1 } } }));
  }
}

const doc = new Document({
  creator: 'נוגה דיין אור',
  title: 'שאלון אפיון קהל היעד',
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1100, left: 1100, right: 1100 } } },
    headers: { default: new Header({ children: [para([new ImageRun({ type: 'png', data: logo, transformation: { width: w, height: h } })], { align: AlignmentType.LEFT })] }) },
    footers: { default: new Footer({ children: [para([run('© נוגה דיין אור · כל הזכויות שמורות · הצלחה עסקית בדרך שלך', { size: 18, color: TEAL })], { align: AlignmentType.CENTER })] }) },
    children: body,
  }],
});
fs.writeFileSync(outPath, await Packer.toBuffer(doc));
console.log('ok', outPath, lines.length, 'lines');
