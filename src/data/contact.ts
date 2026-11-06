// פרטי הקשר והרשתות החברתיות של נוגה, במקום אחד.
// העמוד "צור קשר" והפוטר קוראים מכאן, כך שמשנים כתובת רק פעם אחת.
// הקישורים נלקחו מהערוץ של נוגה ביוטיוב (2026-11-04).

export const contact = {
  whatsapp: 'https://wa.me/972542472729',
  phoneDisplay: '054-2472729',
  phoneHref: 'tel:+972542472729',
  email: 'nogadaor@gmail.com',
  // קבוצת הוואטסאפ של הקהילה "תודעה עסקית מנצחת" (נוגה, 2026-11-05)
  whatsappGroup: 'https://chat.whatsapp.com/CCIKnR46ukwKcZgjFxB6il',
  // קביעת פגישת היכרות (נוגה, 2026-11-06): "לוח זמנים לפגישות" ביומן גוגל, 30 דקות. נוגה קובעת את הימים והשעות ביומן עצמו.
  // לא לכתוב באתר ימים או שעות (נוגה, 2026-11-06: מיותר, וזה גם משתנה).
  // בחשבון גוגל חינמי אפשר סוג פגישה אחד בלבד, ולכן פגישות ארוכות יותר נקבעות בוואטסאפ.
  booking: 'https://calendar.app.google/ADnVouVbe7Lopnbg9',
  bookingNote: 'רוצים שעה אחרת? כתבו לי בוואטסאפ',
};

// icon: שם האייקון ב-src/components/Icon.astro. handle: מה שמוצג מתחת לשם בעמוד צור קשר.
export const socials = [
  { name: 'פייסבוק', icon: 'facebook', handle: 'nogadaor1', href: 'https://www.facebook.com/nogadaor1' },
  { name: 'אינסטגרם', icon: 'instagram', handle: '@noga_dayan_or', href: 'https://www.instagram.com/noga_dayan_or' },
  { name: 'טיקטוק', icon: 'tiktok', handle: '@nogadayanor', href: 'https://www.tiktok.com/@nogadayanor' },
  {
    name: 'יוטיוב',
    icon: 'youtube',
    handle: 'נוגה דיין אור',
    href: 'https://www.youtube.com/@%D7%A0%D7%95%D7%92%D7%94%D7%93%D7%99%D7%99%D7%9F%D7%90%D7%95%D7%A8',
  },
  {
    name: 'לינקדאין',
    icon: 'linkedin',
    handle: 'Noga Dayan Or',
    href: 'https://www.linkedin.com/in/noga-dayan-or-%D7%A0%D7%95%D7%92%D7%94-%D7%93%D7%99%D7%99%D7%9F-%D7%90%D7%95%D7%A8-06810a136',
  },
] as const;
