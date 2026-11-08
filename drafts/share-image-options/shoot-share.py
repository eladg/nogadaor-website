# מצלם את share-walkway.html לתמונת השיתוף של האתר.
# מריצים עם ה-Python של התוסף claude-seo (יש בו Playwright ו-Chromium):
#   PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\claude-seo\ms-playwright
#   %LOCALAPPDATA%\claude-seo\.venv\Scripts\python.exe drafts/share-image-options/shoot-share.py public/images/share-default-N.jpg
# שינוי תמונה = שם קובץ חדש, ולעדכן את defaultImage ב-src/layouts/BaseLayout.astro.
import sys, pathlib
from playwright.sync_api import sync_playwright

html = pathlib.Path(__file__).with_name("share-walkway.html").resolve()
out = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1300, "height": 720})
    pg.goto(html.as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(500)
    pg.locator(".shot").screenshot(path=out, type="jpeg", quality=88)
    b.close()
print("saved", out)
