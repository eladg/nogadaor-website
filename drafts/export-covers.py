# מצלם כל כריכה מעמוד העבודה /cover-export/ ושומר כ-JPG ב-public/images/covers (ראו src/utils/coverImages.ts).
# מריצים עם ה-Python של התוסף claude-seo (יש בו Playwright ו-Chromium):
#   PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\claude-seo\ms-playwright
#   %LOCALAPPDATA%\claude-seo\.venv\Scripts\python.exe drafts/export-covers.py
import os, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4322"
OUT = os.path.join(os.path.dirname(__file__), "..", "public")

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1200, "height": 800}, device_scale_factor=1)
    page.goto(BASE + "/cover-export/", wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(500)
    shots = page.locator(".shot")
    for i in range(shots.count()):
        el = shots.nth(i)
        rel = el.get_attribute("data-file").lstrip("/")
        path = os.path.normpath(os.path.join(OUT, rel))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        el.screenshot(path=path, type="jpeg", quality=88)
        print(rel, os.path.getsize(path) // 1024, "KB")
    b.close()
