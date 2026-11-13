# מצלם את תמונת השיתוף (1200x630) מתוך share-cover-2026-11-13.html אל public/images/.
# הרצה: "%LOCALAPPDATA%\claude-seo\.venv\Scripts\python.exe" drafts\share-image-options\shoot-share.py <שם-קובץ.jpg>
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

here = Path(__file__).resolve().parent
root = here.parent.parent
name = sys.argv[1] if len(sys.argv) > 1 else 'share-default.jpg'
out = root / 'public' / 'images' / name

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    pg.goto((here / 'share-cover-2026-11-13.html').as_uri())
    pg.wait_for_load_state('networkidle')
    pg.evaluate('document.fonts.ready')
    pg.screenshot(path=str(out), type='jpeg', quality=88)
    b.close()
print(out)
