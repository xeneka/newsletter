/* Viamed Newsletter Builder – frontend logic */

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────
  let blockTypes = []; // fetched from /api/block-types
  let state = {
    id: null,
    title: "Newsletter",
    header: {},
    font: {},
    blocks: [],
    footer: {},
  };
  let previewTimer = null;

  // ── DOM refs ───────────────────────────────────────────────────────────
  const $blockTypeSelect = document.getElementById("block-type-select");
  const $btnAddBlock = document.getElementById("btn-add-block");
  const $blocksList = document.getElementById("blocks-list");
  const $previewIframe = document.getElementById("preview-iframe");
  const $btnRefresh = document.getElementById("btn-refresh-preview");
  const $btnExport = document.getElementById("btn-export");
  const $btnNew = document.getElementById("btn-new-draft");
  const $btnSave = document.getElementById("btn-save-draft");
  const $btnLoad = document.getElementById("btn-load-draft");
  const $btnDelete = document.getElementById("btn-delete-draft");
  const $btnImport = document.getElementById("btn-import");
  const $importFileInput = document.getElementById("import-file-input");
  const $draftSelect = document.getElementById("draft-select");
  const $draftTitle = document.getElementById("draft-title");

  // ── Init ───────────────────────────────────────────────────────────────
  async function init() {
    const [typesRes, defaultsRes] = await Promise.all([
      fetch("/api/block-types").then((r) => r.json()),
      fetch("/api/defaults").then((r) => r.json()),
    ]);
    blockTypes = typesRes;
    state.header = structuredClone(defaultsRes.header);
    state.font = structuredClone(defaultsRes.font || {});
    state.footer = structuredClone(defaultsRes.footer);

    // Populate block type dropdown
    blockTypes.forEach((bt) => {
      const opt = document.createElement("option");
      opt.value = bt.type;
      opt.textContent = bt.label;
      $blockTypeSelect.appendChild(opt);
    });

    // Bind header inputs
    document.querySelectorAll("[data-header]").forEach((input) => {
      const key = input.dataset.header;
      input.value = state.header[key] || "";
      input.addEventListener("input", () => {
        state.header[key] = input.value;
        schedulePreview();
      });
    });

    // Bind font inputs
    document.querySelectorAll("[data-font]").forEach((input) => {
      const key = input.dataset.font;
      input.value = state.font[key] || "";
      input.addEventListener("input", () => {
        state.font[key] = input.value;
        schedulePreview();
      });
    });

    // Bind footer inputs
    document.querySelectorAll("[data-footer]").forEach((input) => {
      const key = input.dataset.footer;
      input.value = state.footer[key] || "";
      input.addEventListener("input", () => {
        state.footer[key] = input.value;
        schedulePreview();
      });
    });

    renderSocialLinks();

    // Buttons
    $btnAddBlock.addEventListener("click", addBlock);
    $btnRefresh.addEventListener("click", doPreview);
    $btnExport.addEventListener("click", doExport);
    $btnNew.addEventListener("click", newDraft);
    $btnSave.addEventListener("click", saveDraft);
    $btnLoad.addEventListener("click", loadDraft);
    $btnDelete.addEventListener("click", deleteDraft);
    $btnImport.addEventListener("click", () => $importFileInput.click());
    $importFileInput.addEventListener("change", doImport);

    // Load drafts list
    await refreshDraftsList();

    // Auto-load draft if URL has one
    if (window.DRAFT_ID) {
      $draftSelect.value = window.DRAFT_ID;
      await loadDraftById(window.DRAFT_ID);
    }

    doPreview();
  }

  // ── Blocks CRUD ────────────────────────────────────────────────────────
  function addBlock() {
    const type = $blockTypeSelect.value;
    const cfg = blockTypes.find((bt) => bt.type === type);
    if (!cfg) return;
    const block = {
      id: "blk-" + crypto.randomUUID(),
      type: type,
      data: structuredClone(cfg.defaults),
    };
    state.blocks.push(block);
    renderBlocks();
    schedulePreview();
  }

  function removeBlock(blockId) {
    state.blocks = state.blocks.filter((b) => b.id !== blockId);
    renderBlocks();
    schedulePreview();
  }

  function moveBlock(blockId, direction) {
    const idx = state.blocks.findIndex((b) => b.id === blockId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= state.blocks.length) return;
    const tmp = state.blocks[idx];
    state.blocks[idx] = state.blocks[newIdx];
    state.blocks[newIdx] = tmp;
    renderBlocks();
    schedulePreview();
  }

  // ── Render blocks list ─────────────────────────────────────────────────
  function renderBlocks() {
    $blocksList.innerHTML = "";
    state.blocks.forEach((block, idx) => {
      const cfg = blockTypes.find((bt) => bt.type === block.type);
      if (!cfg) return;
      const card = document.createElement("div");
      card.className = "block-card";
      card.dataset.blockId = block.id;
      card.draggable = true;

      // Drag events
      card.addEventListener("dragstart", onDragStart);
      card.addEventListener("dragover", onDragOver);
      card.addEventListener("dragleave", onDragLeave);
      card.addEventListener("drop", onDrop);
      card.addEventListener("dragend", onDragEnd);

      // Header
      const header = document.createElement("div");
      header.className = "block-card-header";
      header.innerHTML = `
        <span class="block-label">${cfg.label}</span>
        <div class="block-actions">
          <button class="btn-move" data-dir="-1" title="Subir">&#9650;</button>
          <button class="btn-move" data-dir="1" title="Bajar">&#9660;</button>
          <button class="btn-remove" title="Eliminar">&#10005;</button>
        </div>
      `;
      header.querySelector(".btn-remove").addEventListener("click", () => removeBlock(block.id));
      header.querySelectorAll(".btn-move").forEach((btn) => {
        btn.addEventListener("click", () => moveBlock(block.id, parseInt(btn.dataset.dir)));
      });
      card.appendChild(header);

      // Body with form fields
      const body = document.createElement("div");
      body.className = "block-card-body";
      renderBlockFields(body, cfg.fields, block.data, block.id);
      card.appendChild(body);

      $blocksList.appendChild(card);
    });
  }

  function renderBlockFields(container, fields, data, blockId) {
    fields.forEach((field) => {
      if (field.type === "sub_items") {
        renderSubItems(container, field, data, blockId);
        return;
      }
      const group = document.createElement("div");
      group.className = "form-group";
      const label = document.createElement("label");
      label.textContent = field.label;
      group.appendChild(label);

      if (field.type === "richtext") {
        createRichtextEditor(group, data, field.name);
        container.appendChild(group);
        return;
      }

      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 2;
      } else if (field.type === "color") {
        input = document.createElement("input");
        input.type = "color";
      } else if (field.type === "checkbox") {
        // Reuse the label already created, but reorder so checkbox comes first
        group.removeChild(label);
        input = document.createElement("input");
        input.type = "checkbox";
        input.id = `chk-${field.name}-${Math.random().toString(36).slice(2)}`;
        input.checked = data[field.name] === true || data[field.name] === "true";
        input.addEventListener("change", () => {
          data[field.name] = input.checked;
          schedulePreview();
        });
        label.htmlFor = input.id;
        label.className = "checkbox-label";
        group.appendChild(input);
        group.appendChild(label);
        container.appendChild(group);
        return;
      } else {
        input = document.createElement("input");
        input.type = "text";
      }
      input.value = data[field.name] || "";
      input.addEventListener("input", () => {
        data[field.name] = input.value;
        schedulePreview();
      });
      group.appendChild(input);
      container.appendChild(group);
    });
  }

  // ── Sub-items (contenedor celeste) ─────────────────────────────────────
  function renderSubItems(container, field, data, blockId) {
    const items = data[field.name] || [];
    const wrapper = document.createElement("div");

    const headerLabel = document.createElement("label");
    headerLabel.textContent = field.label;
    headerLabel.style.fontWeight = "700";
    headerLabel.style.fontSize = "13px";
    headerLabel.style.display = "block";
    headerLabel.style.marginBottom = "4px";
    wrapper.appendChild(headerLabel);

    items.forEach((item, i) => {
      const subEl = document.createElement("div");
      subEl.className = "sub-item";

      const subHeader = document.createElement("div");
      subHeader.className = "sub-item-header";
      subHeader.innerHTML = `<span>Noticia ${i + 1}</span>`;
      const btnRemoveItem = document.createElement("button");
      btnRemoveItem.textContent = "\u2715";
      btnRemoveItem.title = "Eliminar noticia";
      btnRemoveItem.addEventListener("click", () => {
        items.splice(i, 1);
        renderBlocks();
        schedulePreview();
      });
      subHeader.appendChild(btnRemoveItem);
      subEl.appendChild(subHeader);

      field.item_fields.forEach((sf) => {
        const g = document.createElement("div");
        g.className = "form-group";
        const lbl = document.createElement("label");
        lbl.textContent = sf.label;
        g.appendChild(lbl);
        if (sf.type === "richtext") {
          createRichtextEditor(g, item, sf.name);
        } else {
          let inp;
          if (sf.type === "textarea") {
            inp = document.createElement("textarea");
            inp.rows = 2;
          } else {
            inp = document.createElement("input");
            inp.type = "text";
          }
          inp.value = item[sf.name] || "";
          inp.addEventListener("input", () => {
            item[sf.name] = inp.value;
            schedulePreview();
          });
          g.appendChild(inp);
        }
        subEl.appendChild(g);
      });

      wrapper.appendChild(subEl);
    });

    const btnAdd = document.createElement("button");
    btnAdd.className = "btn-add-sub-item";
    btnAdd.textContent = "+ Añadir noticia";
    btnAdd.addEventListener("click", () => {
      const newItem = {};
      field.item_fields.forEach((sf) => (newItem[sf.name] = ""));
      newItem.button_text = "Leer más";
      items.push(newItem);
      renderBlocks();
      schedulePreview();
    });
    wrapper.appendChild(btnAdd);

    container.appendChild(wrapper);
  }

  // ── Richtext editor helper ─────────────────────────────────────────────
  function createRichtextEditor(container, data, fieldName) {
    // Editor creado primero para que los callbacks del stepper lo usen
    const editor = document.createElement("div");
    editor.className = "richtext-editor";
    editor.contentEditable = "true";
    editor.innerHTML = data[fieldName] || "";

    // Helper stepper: [label − valor +], nunca roba el foco
    // onStep(next) define qué hace cada botón al cambiar
    function makeStepper(labelText, initialVal, min, max, onStep) {
      const group = document.createElement("div");
      group.className = "richtext-size-group";

      const lbl = document.createElement("label");
      lbl.textContent = labelText;

      const btnMinus = document.createElement("button");
      btnMinus.type = "button";
      btnMinus.textContent = "−";

      const display = document.createElement("span");
      display.className = "richtext-size-display";
      display.textContent = String(initialVal);

      const btnPlus = document.createElement("button");
      btnPlus.type = "button";
      btnPlus.textContent = "+";

      function step(delta) {
        const current = parseInt(display.textContent, 10) || initialVal;
        const next = Math.min(max, Math.max(min, current + delta));
        display.textContent = String(next);
        onStep(next);
      }

      btnMinus.addEventListener("mousedown", (e) => { e.preventDefault(); step(-1); });
      btnPlus.addEventListener("mousedown", (e) => { e.preventDefault(); step(1); });

      group.appendChild(lbl);
      group.appendChild(btnMinus);
      group.appendChild(display);
      group.appendChild(btnPlus);
      return group;
    }

    // fs: aplica font-size inline al texto seleccionado (como B/I/A)
    const fsStepper = makeStepper("fs", 13, 8, 72, function(next) {
      editor.focus();
      // execCommand con font tags como puente para poder usar px
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("fontSize", false, "7");
      Array.from(editor.querySelectorAll("font[size='7']")).forEach(function(el) {
        const span = document.createElement("span");
        span.style.fontSize = next + "px";
        while (el.firstChild) span.appendChild(el.firstChild);
        el.parentNode.replaceChild(span, el);
      });
      data[fieldName] = editor.innerHTML;
      schedulePreview();
    });

    // lh: cambia line-height del div wrapper (propiedad de bloque)
    const lhKey = fieldName + "_line_height";
    const lhStepper = makeStepper("lh", parseInt(data[lhKey] || "20", 10), 8, 100, function(next) {
      data[lhKey] = String(next);
      schedulePreview();
    });

    const toolbar = document.createElement("div");
    toolbar.className = "richtext-toolbar";

    const btnBold = document.createElement("button");
    btnBold.type = "button";
    btnBold.innerHTML = "<b>B</b>";
    btnBold.title = "Negrita";

    const btnItalic = document.createElement("button");
    btnItalic.type = "button";
    btnItalic.innerHTML = "<i>I</i>";
    btnItalic.title = "Cursiva";

    const colorLabel = document.createElement("label");
    colorLabel.className = "richtext-color-label";
    colorLabel.textContent = "A";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#555555";
    colorInput.title = "Color de texto";
    colorLabel.appendChild(colorInput);

    const btnCyan = document.createElement("button");
    btnCyan.type = "button";
    btnCyan.textContent = "A";
    btnCyan.title = "Color cian (#00b2e3)";
    btnCyan.style.cssText = "color:#00b2e3; font-weight:700;";

    toolbar.appendChild(btnBold);
    toolbar.appendChild(btnItalic);
    toolbar.appendChild(colorLabel);
    toolbar.appendChild(btnCyan);
    toolbar.appendChild(fsStepper);
    toolbar.appendChild(lhStepper);
    container.appendChild(toolbar);

    btnBold.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("bold");
    });
    btnItalic.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("italic");
    });
    colorInput.addEventListener("input", () => {
      editor.focus();
      document.execCommand("foreColor", false, colorInput.value);
      data[fieldName] = editor.innerHTML;
      schedulePreview();
    });
    btnCyan.addEventListener("mousedown", (e) => {
      e.preventDefault();
      editor.focus();
      document.execCommand("foreColor", false, "#00b2e3");
      data[fieldName] = editor.innerHTML;
      schedulePreview();
    });

    editor.addEventListener("input", () => {
      data[fieldName] = editor.innerHTML;
      schedulePreview();
    });

    container.appendChild(editor);
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────
  let dragSrcId = null;

  function onDragStart(e) {
    dragSrcId = this.dataset.blockId;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    this.classList.add("drag-over");
  }

  function onDragLeave() {
    this.classList.remove("drag-over");
  }

  function onDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    const targetId = this.dataset.blockId;
    if (dragSrcId === targetId) return;
    const srcIdx = state.blocks.findIndex((b) => b.id === dragSrcId);
    const tgtIdx = state.blocks.findIndex((b) => b.id === targetId);
    const [moved] = state.blocks.splice(srcIdx, 1);
    state.blocks.splice(tgtIdx, 0, moved);
    renderBlocks();
    schedulePreview();
  }

  function onDragEnd() {
    this.classList.remove("dragging");
    document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  }

  // ── Preview ────────────────────────────────────────────────────────────
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(doPreview, 500);
  }

  async function doPreview() {
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const html = await res.text();
      $previewIframe.srcdoc = html;
    } catch (err) {
      console.error("Preview error:", err);
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────
  async function doExport() {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (state.title || "newsletter").replace(/\s+/g, "_") + ".html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    }
  }

  // ── Import ─────────────────────────────────────────────────────────────
  async function doImport(e) {
    const file = e.target.files[0];
    // Reset input so the same file can be re-imported if needed
    $importFileInput.value = "";
    if (!file) return;

    if (state.blocks.length > 0 || state.id) {
      if (!confirm("¿Descartar el contenido actual e importar el HTML seleccionado?")) return;
    }

    const htmlText = await file.text();
    let res;
    try {
      res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: htmlText,
      });
    } catch (err) {
      alert("Error de red al importar.");
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "No se pudo importar el archivo.");
      return;
    }

    state = data;
    if (!state.font) state.font = {};
    $draftTitle.value = state.title || "";
    $draftSelect.value = "";
    document.querySelectorAll("[data-header]").forEach((input) => {
      input.value = state.header[input.dataset.header] || "";
    });
    document.querySelectorAll("[data-font]").forEach((input) => {
      input.value = state.font[input.dataset.font] || "";
    });
    document.querySelectorAll("[data-footer]").forEach((input) => {
      input.value = state.footer[input.dataset.footer] || "";
    });
    renderSocialLinks();
    renderBlocks();
    doPreview();
  }

  // ── Drafts ─────────────────────────────────────────────────────────────
  async function refreshDraftsList() {
    const drafts = await fetch("/api/drafts").then((r) => r.json());
    $draftSelect.innerHTML = '<option value="">-- Borradores --</option>';
    drafts.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.title;
      $draftSelect.appendChild(opt);
    });
  }

  async function newDraft() {
    if (state.blocks.length > 0 || state.id) {
      if (!confirm("¿Descartar el contenido actual y empezar un borrador nuevo?")) return;
    }
    const [defaultsRes] = await Promise.all([fetch("/api/defaults").then((r) => r.json())]);
    state = {
      id: null,
      title: "Newsletter",
      header: structuredClone(defaultsRes.header),
      font: structuredClone(defaultsRes.font || {}),
      blocks: [],
      footer: structuredClone(defaultsRes.footer),
    };
    $draftTitle.value = "";
    $draftSelect.value = "";
    document.querySelectorAll("[data-header]").forEach((input) => {
      input.value = state.header[input.dataset.header] || "";
    });
    document.querySelectorAll("[data-font]").forEach((input) => {
      input.value = state.font[input.dataset.font] || "";
    });
    document.querySelectorAll("[data-footer]").forEach((input) => {
      input.value = state.footer[input.dataset.footer] || "";
    });
    renderSocialLinks();
    renderBlocks();
    doPreview();
  }

  async function saveDraft() {
    const title = $draftTitle.value.trim() || state.title || "Sin título";
    state.title = title;
    let res;
    if (state.id) {
      res = await fetch(`/api/drafts/${state.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
    } else {
      res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
    }
    const data = await res.json();
    state.id = data.id;
    await refreshDraftsList();
    $draftSelect.value = state.id;
    alert("Borrador guardado.");
  }

  async function loadDraft() {
    const id = $draftSelect.value;
    if (!id) return;
    await loadDraftById(id);
  }

  async function loadDraftById(id) {
    const data = await fetch(`/api/drafts/${id}`).then((r) => r.json());
    if (data.error) {
      alert("Borrador no encontrado.");
      return;
    }
    state = data;
    $draftTitle.value = state.title || "";
    // Rebind header inputs
    document.querySelectorAll("[data-header]").forEach((input) => {
      const key = input.dataset.header;
      input.value = state.header[key] || "";
    });
    // Rebind font inputs
    if (!state.font) state.font = {};
    document.querySelectorAll("[data-font]").forEach((input) => {
      const key = input.dataset.font;
      input.value = state.font[key] || "";
    });
    // Rebind footer inputs
    document.querySelectorAll("[data-footer]").forEach((input) => {
      const key = input.dataset.footer;
      input.value = state.footer[key] || "";
    });
    renderSocialLinks();
    renderBlocks();
    doPreview();
  }

  async function deleteDraft() {
    const id = $draftSelect.value;
    if (!id) return;
    if (!confirm("¿Eliminar este borrador?")) return;
    await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    if (state.id === id) state.id = null;
    await refreshDraftsList();
    alert("Borrador eliminado.");
  }

  // ── Social links editor ────────────────────────────────────────────────
  function renderSocialLinks() {
    const container = document.getElementById("social-links-editor");
    if (!container) return;
    container.innerHTML = "";
    const lbl = document.createElement("label");
    lbl.textContent = "Redes sociales";
    lbl.style.fontWeight = "700";
    lbl.style.fontSize = "12px";
    lbl.style.display = "block";
    lbl.style.marginBottom = "4px";
    lbl.style.padding = "0 12px";
    container.appendChild(lbl);

    (state.footer.social_links || []).forEach((link, i) => {
      const row = document.createElement("div");
      row.className = "social-link-row";
      row.style.padding = "0 12px";

      const platformLabel = document.createElement("span");
      platformLabel.className = "social-label";
      platformLabel.textContent = link.platform;

      const inputUrl = document.createElement("input");
      inputUrl.type = "text";
      inputUrl.placeholder = "URL";
      inputUrl.value = link.url || "";

      const inputIcon = document.createElement("input");
      inputIcon.type = "text";
      inputIcon.placeholder = "Icono URL";
      inputIcon.value = link.icon_url || "";

      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.textContent = "×";
      btnRemove.title = "Quitar red social";
      btnRemove.style.cssText = "padding:0 6px; border:1px solid #ccc; border-radius:3px; background:#fff; cursor:pointer; font-size:14px; color:#888; flex-shrink:0;";

      inputUrl.addEventListener("input", () => {
        state.footer.social_links[i].url = inputUrl.value;
        schedulePreview();
      });
      inputIcon.addEventListener("input", () => {
        state.footer.social_links[i].icon_url = inputIcon.value;
        schedulePreview();
      });
      btnRemove.addEventListener("click", () => {
        state.footer.social_links.splice(i, 1);
        renderSocialLinks();
        schedulePreview();
      });

      row.appendChild(platformLabel);
      row.appendChild(inputUrl);
      row.appendChild(inputIcon);
      row.appendChild(btnRemove);
      container.appendChild(row);
    });
  }

  // ── Start ──────────────────────────────────────────────────────────────
  init();
})();
