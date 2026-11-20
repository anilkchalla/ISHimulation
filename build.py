"""Inline data.json and logic.js into template.html -> index.html (single self-contained page for GitHub Pages)."""
import json, pathlib
here = pathlib.Path(__file__).parent
data = json.dumps(json.loads((here / "data.json").read_text()), separators=(",", ":"))
logic = (here / "logic.js").read_text().replace('if (typeof module !== "undefined")', 'if (typeof module !== "undefined" && module.exports)')
html = (here / "template.html").read_text().replace("/*DATA*/", data).replace("/*LOGIC*/", logic)
(here / "index.html").write_text(html)
print("wrote index.html", len(html), "bytes")
