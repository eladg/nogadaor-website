// סרטוני ההמלצות מערוץ היוטיוב של נוגה.
// הכותרות נבדקו מול יוטיוב ב-2026-11-04.
// כדי להוסיף או להסיר סרטון, עורכים את הרשימה כאן.

export interface TestimonialVideo {
  id: string; // מזהה הסרטון ביוטיוב
  title: string; // לקוראי מסך ולכיתוב
  vertical: boolean; // true = Short אנכי
}

// הסרטון המרכזי: לקט ההמלצות (תקציר של כל הסרטונים)
export const featuredVideo: TestimonialVideo = {
  id: 'JIlHZ1k5r5U',
  title: 'לקט המלצות של לקוחות על נוגה דיין אור',
  vertical: true,
};

// TODO: נוגה צריכה לאשר איזה סרטונים מוצגים. נמצאו שמונה סרטוני המלצה בנוסף ללקט,
// והיא ציינה "9 סרטונים", כלומר ייתכן שחסר אחד.
export const videos: TestimonialVideo[] = [
  { id: 'avd_r285-5s', title: 'מירי סגל ממליצה על נוגה דיין אור', vertical: true },
  { id: 'TiDKdGrQQVg', title: 'רותי קרמיסי ממליצה על נוגה דיין אור', vertical: true },
  { id: 'GN2N6BZVjOo', title: 'יניב טסיני ממליץ על נוגה דיין אור', vertical: true },
  { id: 'NT6Cku0DGAY', title: 'נעמה רז ממליצה על הליווי העסקי של נוגה דיין אור', vertical: true },
  {
    id: 'X8hZsagieKQ',
    title: 'מלי מלכה גלברט, מטפלת רגשית, ממליצה על נוגה דיין אור',
    vertical: true,
  },
  {
    id: 'QKhYlbK474s',
    title: 'תמי ערמון, גרפיקאית ומומחית בקנבה, ממליצה על נוגה דיין אור',
    vertical: true,
  },
  { id: 'jap36KJWt2g', title: 'המלצה חמה לתהליך ליווי עסקי, 2024', vertical: false },
  { id: 'EdEiSdkn3SI', title: 'המלצה חמה לתהליך ליווי עסקי, ינואר 2024', vertical: false },
];
