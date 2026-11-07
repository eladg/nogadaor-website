// תמונת אווירה כרקע לאזור (נוגה, 2026-11-07: "קו רציף בכל האתר").
// שימוש: <section class="... atmo" style={await atmoStyle(darkLines)}>
// המחלקה .atmo ב-global.css מציירת את התמונה בצד שמאל, עם מעבר שקוף לצד ימין (שם הטקסט).
import { getImage } from 'astro:assets';

export async function atmoStyle(src: ImageMetadata, opacity?: number) {
  const img = await getImage({ src, width: 1800, format: 'webp' });
  return `--bg: url(${img.src})${opacity !== undefined ? `; --atmo-o: ${opacity}` : ''}`;
}
