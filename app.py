"""Flask application for Viamed newsletter builder."""

import base64
import json
import os
import re
import uuid
from pathlib import Path

from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from markupsafe import Markup

from config import BLOCK_TYPES, BLOCK_TYPE_ORDER, DEFAULT_FONT, DEFAULT_FOOTER, DEFAULT_HEADER

app = Flask(__name__)

DRAFTS_DIR = Path(__file__).parent / "drafts"
DRAFTS_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def render_newsletter_html(data: dict) -> str:
    """Render the full newsletter HTML from a data dict."""
    header = data.get("header", DEFAULT_HEADER)
    footer = data.get("footer", DEFAULT_FOOTER)
    font = data.get("font", DEFAULT_FONT)
    blocks = data.get("blocks", [])

    rendered_blocks: list[str] = []
    for block in blocks:
        block_type = block.get("type")
        block_data = block.get("data", {})
        cfg = BLOCK_TYPES.get(block_type)
        if cfg is None:
            continue
        html = render_template(cfg["template"], **block_data)
        rendered_blocks.append(html)

    full_html = render_template(
        "email/skeleton.html",
        header=header,
        footer=footer,
        font=font,
        blocks_html=Markup("\n".join(rendered_blocks)),
    )

    # Inject custom font into inline font-family declarations
    font_name = (font.get("font_name") or "").strip()
    if font_name:
        full_html = full_html.replace(
            "Arial, sans-serif",
            f"'{font_name}', Arial, sans-serif",
        )

    return full_html


def _draft_path(draft_id: str) -> Path:
    # Sanitise id to prevent path traversal
    safe_id = "".join(c for c in draft_id if c.isalnum() or c in "-_")
    return DRAFTS_DIR / f"{safe_id}.json"


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return redirect(url_for("builder"))


@app.route("/builder")
@app.route("/builder/<draft_id>")
def builder(draft_id=None):
    return render_template("builder.html", draft_id=draft_id)


# ---------------------------------------------------------------------------
# API: block types
# ---------------------------------------------------------------------------

@app.route("/api/block-types")
def api_block_types():
    types = []
    for key in BLOCK_TYPE_ORDER:
        cfg = BLOCK_TYPES[key]
        types.append({
            "type": key,
            "label": cfg["label"],
            "defaults": cfg["defaults"],
            "fields": cfg["fields"],
        })
    return jsonify(types)


# ---------------------------------------------------------------------------
# API: preview & export
# ---------------------------------------------------------------------------

@app.route("/api/preview", methods=["POST"])
def api_preview():
    data = request.get_json(force=True)
    html = render_newsletter_html(data)
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/api/export", methods=["POST"])
def api_export():
    data = request.get_json(force=True)
    html = render_newsletter_html(data)
    # Embed the state so the file can be re-imported later
    state_b64 = base64.b64encode(
        json.dumps(data, ensure_ascii=False).encode("utf-8")
    ).decode("ascii")
    html += f"\n<!-- VIAMED_STATE:{state_b64} -->"
    title = data.get("title", "newsletter")
    filename = title.replace(" ", "_") + ".html"
    return (
        html,
        200,
        {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@app.route("/api/import", methods=["POST"])
def api_import():
    html_text = request.get_data(as_text=True)
    m = re.search(r"<!-- VIAMED_STATE:([A-Za-z0-9+/=]+) -->", html_text)
    if not m:
        return jsonify({"error": "El archivo no contiene estado exportado desde esta aplicación."}), 400
    try:
        state = json.loads(base64.b64decode(m.group(1)).decode("utf-8"))
    except Exception:
        return jsonify({"error": "El estado embebido en el archivo está corrupto."}), 400
    # Strip the id so it's treated as a new unsaved newsletter
    state.pop("id", None)
    return jsonify(state)


# ---------------------------------------------------------------------------
# API: drafts CRUD
# ---------------------------------------------------------------------------

@app.route("/api/drafts", methods=["GET"])
def api_list_drafts():
    drafts = []
    for p in sorted(DRAFTS_DIR.glob("*.json")):
        try:
            data = json.loads(p.read_text("utf-8"))
            drafts.append({
                "id": data.get("id", p.stem),
                "title": data.get("title", "Sin título"),
            })
        except (json.JSONDecodeError, KeyError):
            continue
    return jsonify(drafts)


@app.route("/api/drafts", methods=["POST"])
def api_create_draft():
    data = request.get_json(force=True)
    draft_id = data.get("id") or str(uuid.uuid4())
    data["id"] = draft_id
    _draft_path(draft_id).write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")
    return jsonify({"id": draft_id}), 201


@app.route("/api/drafts/<draft_id>", methods=["GET"])
def api_get_draft(draft_id):
    path = _draft_path(draft_id)
    if not path.exists():
        return jsonify({"error": "Not found"}), 404
    data = json.loads(path.read_text("utf-8"))
    return jsonify(data)


@app.route("/api/drafts/<draft_id>", methods=["PUT"])
def api_update_draft(draft_id):
    path = _draft_path(draft_id)
    if not path.exists():
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(force=True)
    data["id"] = draft_id
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")
    return jsonify({"id": draft_id})


@app.route("/api/drafts/<draft_id>", methods=["DELETE"])
def api_delete_draft(draft_id):
    path = _draft_path(draft_id)
    if not path.exists():
        return jsonify({"error": "Not found"}), 404
    path.unlink()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Default config endpoint (for builder initialisation)
# ---------------------------------------------------------------------------

@app.route("/api/defaults")
def api_defaults():
    return jsonify({
        "header": DEFAULT_HEADER,
        "footer": DEFAULT_FOOTER,
        "font": DEFAULT_FONT,
    })


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_PORT", "5001"))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(host=host, port=port, debug=debug)
