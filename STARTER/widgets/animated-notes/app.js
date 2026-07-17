(() => {
  "use strict";
  const STORAGE_KEY = "animatedNotes.v1";
  const icons = Array.isArray(window.NOTE_ICONS) ? window.NOTE_ICONS : [];
  const $ = (selector) => document.querySelector(selector);
  const els = {
    list: $("#notes-list"), count: $("#note-count"), search: $("#search-notes"), noResults: $("#no-results"),
    empty: $("#empty-state"), editor: $("#note-editor"), title: $("#note-title"), content: $("#note-content"),
    picker: $("#icon-picker"), iconHelp: $("#icon-help"), status: $("#save-status"), words: $("#word-count"),
    updated: $("#updated-time"), toast: $("#toast"), importFile: $("#import-file")
  };
  let notes = loadNotes();
  let activeId = notes[0]?.id || null;
  let saveTimer;
  let toastTimer;

  function loadNotes() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    els.status.textContent = "Saved locally";
    renderList();
  }
  function newNote() {
    const now = Date.now();
    const note = { id: crypto.randomUUID?.() || `${now}-${Math.random()}`, title: "", content: "", icon: icons[0] || "", createdAt: now, updatedAt: now };
    notes.unshift(note); activeId = note.id; persist(); renderEditor(); els.title.focus();
  }
  function activeNote() { return notes.find((note) => note.id === activeId); }
  function escapeHtml(value) {
    const div = document.createElement("div"); div.textContent = value; return div.innerHTML;
  }
  function iconMarkup(icon) {
    return icon ? `<img src="icons/${encodeURIComponent(icon)}" alt="">` : `<span class="fallback-icon">✦</span>`;
  }
  function renderList() {
    const query = els.search.value.trim().toLowerCase();
    const matches = notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query));
    els.count.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
    els.noResults.hidden = matches.length > 0 || !query;
    els.list.innerHTML = matches.map((note) => {
      const title = note.title.trim() || "Untitled note";
      const preview = note.content.trim().replace(/\s+/g, " ") || "Empty note";
      return `<button class="note-card ${note.id === activeId ? "active" : ""}" type="button" data-id="${escapeHtml(note.id)}"><span class="note-card-icon">${iconMarkup(note.icon)}</span><span class="note-card-copy"><span class="note-card-title">${escapeHtml(title)}</span><span class="note-card-preview">${escapeHtml(preview)}</span></span></button>`;
    }).join("");
  }
  function renderPicker(note) {
    els.iconHelp.hidden = icons.length > 0;
    els.picker.innerHTML = icons.map((icon) => `<button class="icon-option ${note.icon === icon ? "selected" : ""}" type="button" data-icon="${escapeHtml(icon)}" aria-label="Choose ${escapeHtml(icon)}" aria-pressed="${note.icon === icon}">${iconMarkup(icon)}</button>`).join("");
  }
  function renderEditor() {
    const note = activeNote();
    els.empty.hidden = Boolean(note); els.editor.hidden = !note;
    if (!note) return;
    els.title.value = note.title; els.content.value = note.content;
    renderPicker(note); updateMeta(note); renderList();
  }
  function updateMeta(note) {
    const words = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
    els.words.textContent = `${words} ${words === 1 ? "word" : "words"}`;
    els.updated.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(note.updatedAt)}`;
  }
  function queueSave() {
    const note = activeNote(); if (!note) return;
    note.title = els.title.value; note.content = els.content.value; note.updatedAt = Date.now();
    els.status.textContent = "Saving…"; updateMeta(note); renderList(); clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 250);
  }
  function deleteNote() {
    const note = activeNote(); if (!note || !confirm(`Delete “${note.title.trim() || "Untitled note"}”? This cannot be undone.`)) return;
    notes = notes.filter((item) => item.id !== note.id); activeId = notes[0]?.id || null; persist(); renderEditor(); showToast("Note deleted");
  }
  function exportNotes() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), notes }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `animated-notes-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href); showToast("Notes exported");
  }
  async function importNotes(file) {
    try {
      const parsed = JSON.parse(await file.text()); const incoming = Array.isArray(parsed) ? parsed : parsed.notes;
      if (!Array.isArray(incoming)) throw new Error();
      if (notes.length && !confirm("Importing will replace the notes currently saved in this browser. Continue?")) return;
      notes = incoming.map((note) => ({ id: String(note.id || crypto.randomUUID()), title: String(note.title || ""), content: String(note.content || ""), icon: String(note.icon || ""), createdAt: Number(note.createdAt) || Date.now(), updatedAt: Number(note.updatedAt) || Date.now() }));
      activeId = notes[0]?.id || null; persist(); renderEditor(); showToast(`${notes.length} notes imported`);
    } catch { showToast("That file is not a valid notes export"); }
    finally { els.importFile.value = ""; }
  }
  function showToast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.hidden = false; toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2600); }

  [$("#new-note"), $("#mobile-new-note"), $("#empty-new-note")].forEach((button) => button.addEventListener("click", newNote));
  $("#delete-note").addEventListener("click", deleteNote);
  $("#export-notes").addEventListener("click", exportNotes);
  els.importFile.addEventListener("change", () => els.importFile.files[0] && importNotes(els.importFile.files[0]));
  els.search.addEventListener("input", renderList);
  els.list.addEventListener("click", (event) => { const card = event.target.closest("[data-id]"); if (card) { activeId = card.dataset.id; renderEditor(); } });
  els.picker.addEventListener("click", (event) => { const option = event.target.closest("[data-icon]"); const note = activeNote(); if (!option || !note) return; note.icon = option.dataset.icon; note.updatedAt = Date.now(); persist(); renderPicker(note); updateMeta(note); });
  els.title.addEventListener("input", queueSave); els.content.addEventListener("input", queueSave);
  window.addEventListener("storage", (event) => { if (event.key === STORAGE_KEY) { notes = loadNotes(); if (!activeNote()) activeId = notes[0]?.id || null; renderEditor(); showToast("Notes updated in another tab"); } });
  renderList(); renderEditor();
})();
