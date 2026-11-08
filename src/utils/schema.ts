// נתונים מובנים (Schema.org, JSON-LD): המידע שאומר לגוגל ולכלי AI במפורש מי נוגה, מה העסק ומה יש בכל עמוד.
// בדיקת SEO, 2026-11-08 (drafts/seo-audit-2026-11-08.md, פריט 4).
//
// כתובות מלאות (url, @id, image, שביל ניווט) נכנסות רק כש-site מוגדר ב-astro.config.mjs.
// כל עוד אין דומיין הן פשוט לא נכתבות, וביום שמגדירים site הן מופיעות לבד בכל העמודים.
// כל הנתונים כאן כבר מופיעים באתר: התואר שנוגה אישרה, פרטי הקשר והרשתות מ-contact.ts. לא להוסיף פרטים שלא אושרו.
import { contact, socials } from '../data/contact';

export type Schema = Record<string, unknown>;

export const PERSON_NAME = 'נוגה דיין אור';
const JOB_TITLE = 'יועצת עסקית וארגונית להגדלת הכנסות ושיפור רווחיות';
const BUSINESS_DESCRIPTION =
  'ייעוץ עסקי וארגוני להגדלת הכנסות ושיפור רווחיות באמצעות אסטרטגיה, שיווק ותהליכי עבודה.';

/** כתובת מלאה לנתיב באתר, או undefined כשאין עדיין site (ואז JSON.stringify משמיט את השדה). */
export function abs(site: URL | undefined, path: string): string | undefined {
  return site ? new URL(path, site).href : undefined;
}

const id = (site: URL | undefined, hash: string) => abs(site, `/${hash}`);

export function personSchema(site: URL | undefined): Schema {
  return {
    '@type': 'Person',
    '@id': id(site, '#noga'),
    name: PERSON_NAME,
    jobTitle: JOB_TITLE,
    url: abs(site, '/about/'),
    // TODO: תמונת פנים (image) כשתהיה כתובת קבועה לתמונה. src/assets/hero/headshot.webp מקבל שם משתנה בבנייה.
    sameAs: socials.map((s) => s.href),
    worksFor: id(site, '#business') ? { '@id': id(site, '#business') } : undefined,
  };
}

export function businessSchema(site: URL | undefined): Schema {
  return {
    '@type': 'ProfessionalService',
    '@id': id(site, '#business'),
    name: PERSON_NAME,
    description: BUSINESS_DESCRIPTION,
    slogan: 'הצלחה עסקית בדרך שלך',
    url: abs(site, '/'),
    logo: abs(site, '/images/logo-color-transparent.webp'),
    image: abs(site, '/images/logo-color-transparent.webp'),
    telephone: contact.phoneHref.replace('tel:', ''),
    email: contact.email,
    areaServed: { '@type': 'Country', name: 'ישראל' },
    founder: id(site, '#noga') ? { '@id': id(site, '#noga') } : { '@type': 'Person', name: PERSON_NAME },
    sameAs: socials.map((s) => s.href),
  };
}

export function websiteSchema(site: URL | undefined): Schema {
  return {
    '@type': 'WebSite',
    '@id': id(site, '#website'),
    name: PERSON_NAME,
    url: abs(site, '/'),
    inLanguage: 'he',
  };
}

/** מחבר: הפניה לאדם כשיש site, אחרת שם בלבד. */
function author(site: URL | undefined): Schema {
  return id(site, '#noga') ? { '@id': id(site, '#noga') } : { '@type': 'Person', name: PERSON_NAME };
}

export function articleSchema(
  site: URL | undefined,
  a: { title: string; description: string; path: string; published?: Date; keywords?: string[] },
): Schema {
  return {
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    inLanguage: 'he',
    url: abs(site, a.path),
    mainEntityOfPage: abs(site, a.path),
    datePublished: a.published?.toISOString().slice(0, 10),
    keywords: a.keywords?.length ? a.keywords.join(', ') : undefined,
    author: author(site),
    publisher: id(site, '#business') ? { '@id': id(site, '#business') } : undefined,
  };
}

export function serviceSchema(
  site: URL | undefined,
  s: { name: string; description: string; path: string },
): Schema {
  return {
    '@type': 'Service',
    name: s.name,
    serviceType: s.name,
    description: s.description,
    url: abs(site, s.path),
    areaServed: { '@type': 'Country', name: 'ישראל' },
    provider: id(site, '#business') ? { '@id': id(site, '#business') } : { '@type': 'ProfessionalService', name: PERSON_NAME },
  };
}

/** שביל ניווט. צריך כתובות מלאות, ולכן נוצר רק כשיש site. */
export function breadcrumbSchema(site: URL | undefined, crumbs: { name: string; path: string }[]): Schema | undefined {
  if (!site || crumbs.length < 2) return undefined;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(site, c.path),
    })),
  };
}

/** כל הנתונים של עמוד בבלוק אחד (@graph), עם @context אחד. */
export function graph(items: (Schema | undefined)[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': items.filter(Boolean) });
}
