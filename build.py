"""Assemble the single self-contained index.html from src/ (+ reused art from the approved baseline)."""
import io, pathlib, re

root = pathlib.Path(__file__).parent
src = root / "src"
base = (root / "chesscom-current.html").read_text(encoding="utf-8").splitlines()

def block(start_pat, end_pat):
    s = next(i for i, l in enumerate(base) if re.search(start_pat, l))
    e = next(i for i, l in enumerate(base) if i > s and re.search(end_pat, l))
    return "\n".join(base[s:e])

# reused (approved) artwork: piece drawing + icon/avatar helpers
pieces = block(r"^const PAL_GRASS", r"Chessboard \(HTML/CSS grid")
pieces = pieces.rsplit("/* ====", 1)[0]
# high-contrast piece theme uses thicker outlines (palette key "sw")
assert 'stroke-width="3" stroke-linejoin' in pieces
pieces = pieces.replace('stroke-width="3" stroke-linejoin', 'stroke-width="${P.sw||3}" stroke-linejoin')
icons = block(r"^const sv=\(s,vb", r"Shared sidebar")
icons = icons.rsplit("/* ====", 1)[0]

js = "\n".join([
    (src / "core.js").read_text(encoding="utf-8"),
    "/* ---- reused artwork from the approved Chess.com recreation ---- */",
    pieces, icons,
    (src / "board.js").read_text(encoding="utf-8"),
    (src / "voice.js").read_text(encoding="utf-8"),
    (src / "ui.js").read_text(encoding="utf-8"),
    (src / "screens.js").read_text(encoding="utf-8"),
])
html = (src / "body.html").read_text(encoding="utf-8")
html = html.replace("/*__CSS__*/", (src / "style.css").read_text(encoding="utf-8"))
html = html.replace("/*__JS__*/", js)
(root / "index.html").write_text(html, encoding="utf-8")
print("index.html", len(html) // 1024, "KB")
