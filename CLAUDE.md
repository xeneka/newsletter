# Viamed Newsletter Builder

## What is this?
A web-based tool for building HTML newsletters compatible with email clients. The output replicates the layout of `example.html` (Viamed al Día) using table-based, inline-style HTML.

## Tech stack
- **Backend**: Flask (Python 3) with Jinja2 templates
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Persistence**: JSON files in `drafts/`
- **Images**: External URLs only (no uploads)

## Running
```bash
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```

## Project structure
- `app.py` – Flask app: all routes + `render_newsletter_html()`
- `config.py` – Block registry (BLOCK_TYPES), colours, default header/footer
- `templates/email/` – Email templates (table-based, inline styles)
  - `skeleton.html` – Full email wrapper
  - `header.html` – Preheader + banner
  - `footer.html` – Logo + social + unsubscribe
  - `blocks/` – One template per block type (7 total)
- `templates/builder.html` – Builder UI
- `static/js/builder.js` – All frontend logic (state, CRUD, preview, drafts, D&D)
- `static/css/builder.css` – Builder styles

## Architecture rules
- **Server is stateless**: JS sends full JSON to server for preview/export/save
- **Single rendering function** (`render_newsletter_html`) for both preview and export
- **Email templates** use tables + inline styles; **builder templates** use modern HTML/CSS
- Preview uses `iframe.srcdoc` to isolate email CSS from builder CSS
- Container width: 600px fixed. Font: Arial.

## Key colours
- `#00b2e3` cyan (accents, títulos sección)
- `#003a5d` dark blue (títulos noticias)
- `#37474a` dark grey (buttons, footer bg)
- `#3f4a4f` darker grey (bloque grande oscuro bg)
- `#d6eff9` light blue (contenedor celeste)
- `#efefef` grey (block backgrounds)

## Block types
1. `titulo_seccion` – Section title with decorative line
2. `imagen_izq_texto_dcha` – Image left + text/button right (grey bg)
3. `texto_izq_imagen_dcha` – Text/button left + image right (grey bg)
4. `grid_2_columnas` – Two side-by-side cards with image + text + button
5. `separador_imagen` – Full-width image separator
6. `bloque_grande_oscuro` – Image left + text on dark bg right
7. `contenedor_celeste` – Light blue container with N mini-news items

## When modifying email templates
- Keep inline styles identical to `example.html`
- Use `<table>` layout, never `<div>` for structure
- Never add external CSS or `<style>` tags
- Test that exported HTML opens correctly in a browser
