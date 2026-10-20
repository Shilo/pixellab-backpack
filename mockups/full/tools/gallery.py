"""Write mockups/full/gallery.html listing every rendered frame, desktop + phone."""
import html, pathlib, sys
root = pathlib.Path(sys.argv[1])            # mockups/full
shots = root / "base" / "shots"
groups = [("Core screens", lambda i: i[:2].isdigit()), ("Connect, sync, settings and states", lambda i: i.startswith("g1-")),
          ("Browse and find", lambda i: i.startswith("g2-")), ("Viewer and playback", lambda i: i.startswith("g3-")),
          ("Organize and download", lambda i: i.startswith("g4-"))]
ids = sorted({p.name.rsplit("-", 1)[0] for p in shots.glob("*-desktop.png")})
parts = []
for title, match in groups:
    rows = [i for i in ids if match(i)]
    if not rows: continue
    parts.append(f'<h2 id="{html.escape(title)}">{html.escape(title)} <span>{len(rows)}</span></h2>')
    for i in rows:
        e = html.escape(i)
        parts.append(f'<figure id="{e}"><figcaption><a href="base/index.html#{e}">{e}</a></figcaption>'
                     f'<div class="pair"><img loading="lazy" src="base/shots/{e}-desktop.png" alt="{e}, desktop">'
                     f'<img loading="lazy" class="m" src="base/shots/{e}-mobile.png" alt="{e}, phone"></div></figure>')
nav = " · ".join(f'<a href="#{html.escape(t)}">{html.escape(t)}</a>' for t, _ in groups)
(root / "gallery.html").write_text(f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vitrine mockups</title><style>
:root{{color-scheme:dark}}body{{margin:0;padding:24px 16px 80px;background:#0c0e14;color:#e8ecf6;font:15px/1.4 system-ui,sans-serif}}
main{{max-width:1600px;margin:auto}}h1{{font-size:26px;margin:0 0 6px}}p{{color:#aab;margin:0 0 12px}}nav{{position:sticky;top:0;padding:10px 0;background:#0c0e14ee;z-index:1}}
a{{color:#8fc1ff}}h2{{margin:40px 0 12px;font-size:20px}}h2 span{{color:#889;font-weight:400}}figure{{margin:0 0 28px}}figcaption{{margin-bottom:8px;font:13px ui-monospace,monospace}}
.pair{{display:grid;grid-template-columns:minmax(0,3.6fr) minmax(0,1fr);gap:16px;align-items:start}}img{{width:100%;border-radius:12px;display:block;background:#151821}}
@media (max-width:700px){{.pair{{grid-template-columns:1fr}}.m{{max-width:320px}}}}</style>
<main><h1>Vitrine mockups</h1><p>{len(ids)} screens, desktop (1440×900) and phone (390×844). Click a name to open the live mockup. Images are rendered locally and not committed.</p>
<nav>{nav}</nav>{''.join(parts)}</main></html>""", encoding="utf-8")
print(len(ids), "screens")
