// ══════ SUPABASE ══════
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
const GIORNI_MESE = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CAT_COLORS = {
  Benzina: "#f97316",
  Auto: "#3b82f6",
  Fisse: "#ef4444",
  Bar: "#22c55e",
  Cibo: "#16a34a",
  Personali: "#a855f7",
  Altro: "#94a3b8",
  Vacanza: "#ec4899",
  Uscite: "#eab308",
  Abbonamenti: "#6366f1",
  Famiglia: "#78716c",
  Garden: "#15803d",
  Vestiti: "#db2777",
  Università: "#0891b2",
};
const TIPO_COLORS = {
  Conto: "#3b82f6",
  Portafoglio: "#22c55e",
  Deposito: "#f59e0b",
  Carta: "#8b5cf6",
  Contanti: "#64748b",
  Prepagata: "#ec4899",
};
function catColor(c) {
  return CAT_COLORS[c] || "#94a3b8";
}
function tipoColor(t) {
  return TIPO_COLORS[t] || "#94a3b8";
}

// ══════ STATE ══════
let S = {
  uscite: { 2024: [], 2025: [], 2026: [] },
  entrate: { 2024: [], 2025: [], 2026: [] },
  categorie: [],
  tipos: [],
  etipos: [],
  saldi_iniziali: { conto: 666.2, portafoglio: 5.9, deposito: 0 },
};
function loadSettings() {
  const saved = localStorage.getItem("spese_settings_v1");
  if (saved) {
    try {
      const p = JSON.parse(saved);
      S.categorie = p.categorie || [];
      S.tipos = p.tipos || [];
      S.etipos = p.etipos || [];
      S.saldi_iniziali = p.saldi_iniziali || {
        conto: 0,
        portafoglio: 0,
        deposito: 0,
      };
    } catch (e) {}
  }
  if (!S.categorie.length)
    S.categorie = [
      "Abbonamenti",
      "Altro",
      "Auto",
      "Bar",
      "Benzina",
      "Famiglia",
      "Fisse",
      "Garden",
      "Personali",
      "Prelievo",
      "Università",
      "Uscite",
      "Vacanza",
      "Vestiti",
    ];
  if (!S.tipos.length) S.tipos = ["Carta", "Contanti", "Prepagata"];
  if (!S.etipos.length) S.etipos = ["Conto", "Deposito", "Portafoglio"];
  if (!S.categorie.includes("Prelievo")) {
    S.categorie.push("Prelievo");
    S.categorie.sort();
  }
}
function saveSettings() {
  localStorage.setItem(
    "spese_settings_v1",
    JSON.stringify({
      categorie: S.categorie,
      tipos: S.tipos,
      etipos: S.etipos,
      saldi_iniziali: S.saldi_iniziali,
    }),
  );
}
async function fetchAll(table) {
  const PAGE = 1000;
  let all = [],
    from = 0;
  while (true) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .order("data", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
async function loadState() {
  showLoading(true);
  loadSettings();
  try {
    const [uAll, eAll] = await Promise.all([
      fetchAll("uscite"),
      fetchAll("entrate"),
    ]);
    S.uscite = { 2024: [], 2025: [], 2026: [] };
    S.entrate = { 2024: [], 2025: [], 2026: [] };
    uAll.forEach((u) => {
      const y = u.data ? u.data.slice(0, 4) : "2026";
      if (S.uscite[y]) S.uscite[y].push(u);
    });
    eAll.forEach((e) => {
      const y = e.data ? e.data.slice(0, 4) : "2026";
      if (S.entrate[y]) S.entrate[y].push(e);
    });
  } catch (e) {
    console.error("Errore caricamento dati:", e);
    alert("Errore connessione al database: " + e.message);
  }
  showLoading(false);
}

// ══════ LOADING ══════
function showLoading(on) {
  let el = document.getElementById("loading-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "loading-overlay";
    el.style.cssText =
      "position:fixed;inset:0;background:rgba(255,255,255,.7);z-index:9999;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:#2563eb;";
    el.textContent = "⏳ Caricamento…";
    document.body.appendChild(el);
  }
  el.style.display = on ? "flex" : "none";
}

// ══════ UTILS ══════
function fmt(n, d = 2) {
  return n == null
    ? "—"
    : "€\u202f" +
        n.toLocaleString("it-IT", {
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        });
}
function fmtN(n, d = 1) {
  return n == null
    ? "—"
    : n.toLocaleString("it-IT", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
}
function dateMese(d) {
  if (!d) return "";
  return MESI[parseInt(d.slice(5, 7)) - 1] || "";
}
function uid() {
  return crypto.randomUUID();
}
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}
function isLeap(y) {
  y = parseInt(y);
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function daysInMonth(mi, year) {
  if (mi === 1) return isLeap(year) ? 29 : 28;
  return GIORNI_MESE[mi];
}
function daysElapsed(mi, year) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(year, mi, 1);
  const end = new Date(year, mi + 1, 0);
  if (today < start) return 0;
  if (today >= end) return daysInMonth(mi, year);
  return Math.floor((today - start) / 86400000);
}
function populateSelect(id, options) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  const first = sel.options[0];
  sel.innerHTML = "";
  sel.appendChild(first);
  options.forEach((o) => {
    const op = new Option(o.l, o.v);
    sel.appendChild(op);
  });
  if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
}

// ══════ AUTOCOMPLETE ══════
function setupAutocomplete(inputId, getItems, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const dd = document.getElementById(inputId + "-ac");
  if (!dd) return;
  let acIdx = -1;
  input.addEventListener("input", () => {
    acIdx = -1;
    const q = input.value.trim().toLowerCase();
    if (!q) {
      dd.style.display = "none";
      return;
    }
    const items = [
      ...new Set(
        getItems().filter((d) => d && d.trim().toLowerCase().includes(q)),
      ),
    ].slice(0, 10);
    if (!items.length) {
      dd.style.display = "none";
      return;
    }
    dd.innerHTML = items
      .map(
        (item, i) =>
          `<div class="ac-item" data-val="${esc(item)}" data-idx="${i}">${esc(item)}</div>`,
      )
      .join("");
    dd.style.display = "block";
    dd.querySelectorAll(".ac-item").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = el.dataset.val;
        dd.style.display = "none";
        if (onSelect) onSelect(el.dataset.val);
      });
    });
  });
  input.addEventListener("keydown", (e) => {
    const items = dd.querySelectorAll(".ac-item");
    if (!items.length || dd.style.display === "none") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      acIdx = Math.min(acIdx + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle("selected", i === acIdx));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      acIdx = Math.max(acIdx - 1, 0);
      items.forEach((it, i) => it.classList.toggle("selected", i === acIdx));
    } else if (e.key === "Enter" && acIdx >= 0) {
      e.preventDefault();
      const val = items[acIdx].dataset.val;
      input.value = val;
      dd.style.display = "none";
      if (onSelect) onSelect(val);
    } else if (e.key === "Escape") {
      dd.style.display = "none";
      acIdx = -1;
    }
  });
  input.addEventListener("blur", () =>
    setTimeout(() => {
      dd.style.display = "none";
      acIdx = -1;
    }, 180),
  );
}
function initAutocompletes() {
  setupAutocomplete(
    "nu-desc",
    () =>
      ["2026", "2025", "2024"].flatMap((y) =>
        (S.uscite[y] || []).map((u) => u.descrizione),
      ),
    (val) => {
      const match = ["2026", "2025", "2024"]
        .flatMap((y) => S.uscite[y] || [])
        .find((u) => u.descrizione === val);
      if (match) {
        const catSel = document.getElementById("nu-cat");
        const tipSel = document.getElementById("nu-tipo");
        if (
          catSel &&
          [...catSel.options].some((o) => o.value === match.categoria)
        )
          catSel.value = match.categoria;
        if (tipSel && [...tipSel.options].some((o) => o.value === match.tipo))
          tipSel.value = match.tipo;
      }
    },
  );
  setupAutocomplete(
    "ne-desc",
    () =>
      ["2026", "2025", "2024"].flatMap((y) =>
        (S.entrate[y] || []).map((e) => e.descrizione),
      ),
    (val) => {
      const match = ["2026", "2025", "2024"]
        .flatMap((y) => S.entrate[y] || [])
        .find((e) => e.descrizione === val);
      if (match) {
        const tipSel = document.getElementById("ne-tipo");
        if (tipSel && [...tipSel.options].some((o) => o.value === match.tipo))
          tipSel.value = match.tipo;
      }
    },
  );
}

// ══════ TAB NAVIGATION ══════
function switchTab(name) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  document.querySelectorAll(".nav-tab").forEach((t) => {
    if (t.getAttribute("onclick") === `switchTab('${name}')`)
      t.classList.add("active");
  });
  if (name === "dashboard") {
    renderDashboard();
    renderSaldi();
    renderResoconto();
  }
  if (name === "uscite") renderUscite();
  if (name === "entrate") renderEntrate();
  if (name === "gestione") renderGestione();
  if (name === "impostazioni") renderImpostazioni();
}

// ══════ MODAL ══════
function openModal(id) {
  document.getElementById(id).classList.add("open");
  if (id === "modal-add-uscita") populateUscitaModal();
  if (id === "modal-add-entrata") populateEntrataModal();
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
document.querySelectorAll(".overlay").forEach((o) =>
  o.addEventListener("click", (e) => {
    if (e.target === o) o.classList.remove("open");
  }),
);

function toggleNuTipoFg() {
  const cat = document.getElementById("nu-cat");
  const fg = document.getElementById("nu-tipo-fg");
  if (fg) fg.style.display = cat && cat.value === "Prelievo" ? "none" : "";
}
function populateUscitaModal() {
  const cat = document.getElementById("nu-cat");
  cat.innerHTML = S.categorie.map((c) => `<option>${c}</option>`).join("");
  const tip = document.getElementById("nu-tipo");
  tip.innerHTML = S.tipos.map((t) => `<option>${t}</option>`).join("");
  document.getElementById("nu-data").value = new Date()
    .toISOString()
    .slice(0, 10);
  document.getElementById("nu-desc").value = "";
  document.getElementById("nu-val").value = "";
  toggleNuTipoFg();
}
function populateEntrataModal() {
  const tip = document.getElementById("ne-tipo");
  tip.innerHTML = S.etipos.map((t) => `<option>${t}</option>`).join("");
  document.getElementById("ne-data").value = new Date()
    .toISOString()
    .slice(0, 10);
  document.getElementById("ne-desc").value = "";
  document.getElementById("ne-val").value = "";
}

// ══════ CRUD ══════
async function addUscita() {
  const data = document.getElementById("nu-data").value;
  const desc = document.getElementById("nu-desc").value.trim();
  const val = parseFloat(document.getElementById("nu-val").value);
  const cat = document.getElementById("nu-cat").value;
  const tipo =
    cat === "Prelievo" ? "Prelievo" : document.getElementById("nu-tipo").value;
  const year = document.getElementById("nu-year").value;
  if (!data || !desc || isNaN(val) || val <= 0) {
    alert("Compila tutti i campi correttamente.");
    return;
  }
  const row = {
    id: uid(),
    mese: dateMese(data),
    data,
    descrizione: desc,
    valore: val,
    categoria: cat,
    tipo,
  };
  const { error } = await db.from("uscite").insert([row]);
  if (error) {
    alert("Errore salvataggio: " + error.message);
    return;
  }
  S.uscite[year].unshift(row);
  closeModal("modal-add-uscita");
  renderUscite();
  renderDashboard();
  renderSaldi();
  renderResoconto();
}
async function deleteUscita(year, id) {
  if (!confirm("Eliminare questa uscita?")) return;
  const { error } = await db.from("uscite").delete().eq("id", id);
  if (error) {
    alert("Errore eliminazione: " + error.message);
    return;
  }
  S.uscite[year] = S.uscite[year].filter((u) => u.id !== id);
  renderUscite();
  renderDashboard();
  renderSaldi();
  renderResoconto();
}
function editUscita(year, id) {
  const u = (S.uscite[year] || []).find((x) => x.id === id);
  if (!u) return;
  document.getElementById("eu-year").value = year;
  document.getElementById("eu-id").value = id;
  const cat = document.getElementById("eu-cat");
  cat.innerHTML = S.categorie.map((c) => `<option>${c}</option>`).join("");
  const tip = document.getElementById("eu-tipo");
  tip.innerHTML = S.tipos.map((t) => `<option>${t}</option>`).join("");
  document.getElementById("eu-data").value = u.data || "";
  document.getElementById("eu-desc").value = u.descrizione || "";
  document.getElementById("eu-val").value = u.valore || "";
  cat.value = u.categoria || "";
  tip.value = u.tipo || "";
  toggleEuTipoFg();
  document.getElementById("modal-edit-uscita").classList.add("open");
}
function toggleEuTipoFg() {
  const cat = document.getElementById("eu-cat");
  const fg = document.getElementById("eu-tipo-fg");
  if (fg) fg.style.display = cat && cat.value === "Prelievo" ? "none" : "";
}
async function saveEditUscita() {
  const data = document.getElementById("eu-data").value;
  const desc = document.getElementById("eu-desc").value.trim();
  const val = parseFloat(document.getElementById("eu-val").value);
  const cat = document.getElementById("eu-cat").value;
  const tipo =
    cat === "Prelievo" ? "Prelievo" : document.getElementById("eu-tipo").value;
  const year = document.getElementById("eu-year").value;
  const id = document.getElementById("eu-id").value;
  if (!data || !desc || isNaN(val) || val <= 0) {
    alert("Compila tutti i campi correttamente.");
    return;
  }
  const updates = {
    data,
    mese: dateMese(data),
    descrizione: desc,
    valore: val,
    categoria: cat,
    tipo,
  };
  const { error } = await db.from("uscite").update(updates).eq("id", id);
  if (error) {
    alert("Errore modifica: " + error.message);
    return;
  }
  const arr = S.uscite[year] || [];
  const idx = arr.findIndex((u) => u.id === id);
  if (idx !== -1) arr[idx] = { ...arr[idx], ...updates };
  closeModal("modal-edit-uscita");
  renderUscite();
  renderDashboard();
  renderSaldi();
  renderResoconto();
}
async function addEntrata() {
  const data = document.getElementById("ne-data").value;
  const desc = document.getElementById("ne-desc").value.trim();
  const val = parseFloat(document.getElementById("ne-val").value);
  const tipo = document.getElementById("ne-tipo").value;
  const year = document.getElementById("ne-year").value;
  if (!data || !desc || isNaN(val) || val <= 0) {
    alert("Compila tutti i campi correttamente.");
    return;
  }
  const row = {
    id: uid(),
    mese: dateMese(data),
    data,
    descrizione: desc,
    valore: val,
    tipo,
  };
  const { error } = await db.from("entrate").insert([row]);
  if (error) {
    alert("Errore salvataggio: " + error.message);
    return;
  }
  S.entrate[year].unshift(row);
  closeModal("modal-add-entrata");
  renderEntrate();
  renderDashboard();
  renderSaldi();
  renderResoconto();
}
async function deleteEntrata(year, id) {
  if (!confirm("Eliminare questa entrata?")) return;
  const { error } = await db.from("entrate").delete().eq("id", id);
  if (error) {
    alert("Errore eliminazione: " + error.message);
    return;
  }
  S.entrate[year] = S.entrate[year].filter((e) => e.id !== id);
  renderEntrate();
  renderDashboard();
  renderSaldi();
  renderResoconto();
}
function editEntrata(year, id) {
  const e = (S.entrate[year] || []).find((x) => x.id === id);
  if (!e) return;
  document.getElementById("ee-year").value = year;
  document.getElementById("ee-id").value = id;
  const tip = document.getElementById("ee-tipo");
  tip.innerHTML = S.etipos.map((t) => `<option>${t}</option>`).join("");
  document.getElementById("ee-data").value = e.data || "";
  document.getElementById("ee-desc").value = e.descrizione || "";
  document.getElementById("ee-val").value = e.valore || "";
  tip.value = e.tipo || "";
  document.getElementById("modal-edit-entrata").classList.add("open");
}
async function saveEditEntrata() {
  const data = document.getElementById("ee-data").value;
  const desc = document.getElementById("ee-desc").value.trim();
  const val = parseFloat(document.getElementById("ee-val").value);
  const tipo = document.getElementById("ee-tipo").value;
  const year = document.getElementById("ee-year").value;
  const id = document.getElementById("ee-id").value;
  if (!data || !desc || isNaN(val) || val <= 0) {
    alert("Compila tutti i campi correttamente.");
    return;
  }
  const updates = {
    data,
    mese: dateMese(data),
    descrizione: desc,
    valore: val,
    tipo,
  };
  const { error } = await db.from("entrate").update(updates).eq("id", id);
  if (error) {
    alert("Errore modifica: " + error.message);
    return;
  }
  const arr = S.entrate[year] || [];
  const idx = arr.findIndex((e) => e.id === id);
  if (idx !== -1) arr[idx] = { ...arr[idx], ...updates };
  closeModal("modal-edit-entrata");
  renderEntrate();
  renderDashboard();
  renderSaldi();
  renderResoconto();
}

// ══════ SORT ══════
const sortState = {
  uscite: { col: "data", dir: "desc" },
  entrate: { col: "data", dir: "desc" },
};
function sortTable(tbl, col) {
  if (sortState[tbl].col === col)
    sortState[tbl].dir = sortState[tbl].dir === "asc" ? "desc" : "asc";
  else {
    sortState[tbl].col = col;
    sortState[tbl].dir = "asc";
  }
  document.querySelectorAll(`#tbl-${tbl} th`).forEach((th) => {
    th.classList.remove("asc", "desc");
    if (th.dataset.sort === col) th.classList.add(sortState[tbl].dir);
  });
  if (tbl === "uscite") renderUscite();
  else renderEntrate();
}

// ══════ RENDER USCITE ══════
function renderUscite() {
  const fy = document.getElementById("f-uscita-year").value;
  const fm = document.getElementById("f-uscita-month").value;
  const fc = document.getElementById("f-uscita-cat").value;
  const ft = document.getElementById("f-uscita-tipo").value;
  const fs = document.getElementById("f-uscita-search").value.toLowerCase();
  populateSelect(
    "f-uscita-month",
    MESI.map((m) => ({ v: m, l: m })),
  );
  populateSelect(
    "f-uscita-cat",
    S.categorie.map((c) => ({ v: c, l: c })),
  );
  populateSelect(
    "f-uscita-tipo",
    S.tipos.map((t) => ({ v: t, l: t })),
  );
  let rows = [];
  const years = fy ? [fy] : ["2024", "2025", "2026"];
  years.forEach((y) =>
    (S.uscite[y] || []).forEach((u) => rows.push({ ...u, _year: y })),
  );
  if (fm) rows = rows.filter((u) => u.mese === fm);
  if (fc) rows = rows.filter((u) => u.categoria === fc);
  if (ft) rows = rows.filter((u) => u.tipo === ft);
  if (fs)
    rows = rows.filter((u) => (u.descrizione || "").toLowerCase().includes(fs));
  const { col, dir } = sortState.uscite;
  rows.sort((a, b) => {
    let va = a[col] ?? "",
      vb = b[col] ?? "";
    if (typeof va === "number") return dir === "asc" ? va - vb : vb - va;
    return dir === "asc"
      ? va.localeCompare(vb, "it")
      : vb.localeCompare(va, "it");
  });
  const tbody = document.getElementById("tbody-uscite");
  tbody.innerHTML = rows.length
    ? rows
        .map((u) => {
          const isP = u.categoria === "Prelievo";
          const amtStyle = isP ? 'style="color:#8b5cf6"' : 'class="amt neg"';
          const prelTag = isP
            ? ` <span style="font-size:.7rem;color:#8b5cf6;font-weight:700;">[→Portafoglio]</span>`
            : "";
          return `<tr${isP ? ' style="background:#faf5ff;"' : ""}>
    <td>${u.data || ""}</td><td>${esc(u.descrizione)}${prelTag}</td>
    <td ${amtStyle}>${fmt(u.valore)}</td>
    <td><span class="badge" style="background:${catColor(u.categoria)}22;color:${catColor(u.categoria)}">${esc(u.categoria)}</span></td>
    <td>${isP ? "—" : esc(u.tipo || "")}</td>
    <td style="color:var(--muted);font-size:.8rem;">${u._year}</td>
    <td style="display:flex;gap:.2rem;">
      <button class="btn btn-ghost btn-sm" onclick="editUscita('${u._year}','${u.id}')">✏️</button>
      <button class="btn btn-danger" onclick="deleteUscita('${u._year}','${u.id}')">✕</button>
    </td>
  </tr>`;
        })
        .join("")
    : `<tr><td colspan="7"><div class="empty"><div class="icon">🔍</div>Nessuna uscita trovata</div></td></tr>`;
  const totSpese = rows
    .filter((u) => u.categoria !== "Prelievo")
    .reduce((s, u) => s + u.valore, 0);
  const totPrel = rows
    .filter((u) => u.categoria === "Prelievo")
    .reduce((s, u) => s + u.valore, 0);
  let sumText = `${rows.length} transazioni · Spese: ${fmt(totSpese)}`;
  if (totPrel > 0) sumText += ` · Prelievi: ${fmt(totPrel)}`;
  document.getElementById("uscite-summary").textContent = sumText;
}

// ══════ RENDER ENTRATE ══════
function renderEntrate() {
  const fy = document.getElementById("f-entrata-year").value;
  const fm = document.getElementById("f-entrata-month").value;
  const ft = document.getElementById("f-entrata-tipo").value;
  const fs = document.getElementById("f-entrata-search").value.toLowerCase();
  populateSelect(
    "f-entrata-month",
    MESI.map((m) => ({ v: m, l: m })),
  );
  populateSelect(
    "f-entrata-tipo",
    S.etipos.map((t) => ({ v: t, l: t })),
  );
  let rows = [];
  const years = fy ? [fy] : ["2024", "2025", "2026"];
  years.forEach((y) =>
    (S.entrate[y] || []).forEach((e) => rows.push({ ...e, _year: y })),
  );
  if (fm) rows = rows.filter((e) => e.mese === fm);
  if (ft) rows = rows.filter((e) => e.tipo === ft);
  if (fs)
    rows = rows.filter((e) => (e.descrizione || "").toLowerCase().includes(fs));
  const { col, dir } = sortState.entrate;
  rows.sort((a, b) => {
    let va = a[col] ?? "",
      vb = b[col] ?? "";
    if (typeof va === "number") return dir === "asc" ? va - vb : vb - va;
    return dir === "asc"
      ? va.localeCompare(vb, "it")
      : vb.localeCompare(va, "it");
  });
  const tbody = document.getElementById("tbody-entrate");
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (e) => `<tr>
    <td>${e.data || ""}</td><td>${esc(e.descrizione)}</td>
    <td class="amt pos">${fmt(e.valore)}</td>
    <td><span class="badge" style="background:${tipoColor(e.tipo)}22;color:${tipoColor(e.tipo)}">${esc(e.tipo || "")}</span></td>
    <td style="color:var(--muted);font-size:.8rem;">${e._year}</td>
    <td style="display:flex;gap:.2rem;">
      <button class="btn btn-ghost btn-sm" onclick="editEntrata('${e._year}','${e.id}')">✏️</button>
      <button class="btn btn-danger" onclick="deleteEntrata('${e._year}','${e.id}')">✕</button>
    </td>
  </tr>`,
        )
        .join("")
    : `<tr><td colspan="6"><div class="empty"><div class="icon">🔍</div>Nessuna entrata trovata</div></td></tr>`;
  const tot = rows.reduce((s, e) => s + e.valore, 0);
  document.getElementById("entrate-summary").textContent =
    `${rows.length} transazioni · Totale: ${fmt(tot)}`;
}

// ══════ DASHBOARD ══════
let dashYear = "2026";
let chartMonthly = null,
  chartCat = null,
  chartCompare = null;
let chartUsciteCategoria = null;
let chartEntrateMonthly = null,
  chartEntrateProvenienza = null,
  chartEntrateTipo = null,
  chartEntrateCompare = null;
let dashCatFilter = "";
function setDashYear(y, el) {
  dashYear = y;
  document
    .querySelectorAll("#dash-year-pills .pill")
    .forEach((p) => p.classList.remove("active"));
  if (el) el.classList.add("active");
  renderDashboard();
  renderResoconto();
}
function renderDashboard() {
  const years = dashYear === "tutti" ? ["2024", "2025", "2026"] : [dashYear];
  const uscite = years.flatMap((y) =>
    (S.uscite[y] || [])
      .filter((u) => u.categoria !== "Prelievo")
      .map((u) => ({ ...u, _year: y })),
  );
  const entrate = years.flatMap((y) =>
    (S.entrate[y] || []).map((e) => ({ ...e, _year: y })),
  );
  const totU = uscite.reduce((s, u) => s + u.valore, 0);
  const totE = entrate.reduce((s, e) => s + e.valore, 0);
  const saldo = totE - totU;
  const monthSet = new Set(
    uscite.map((u) => (u.data ? u.data.slice(0, 7) : "")).filter(Boolean),
  );
  const nM = monthSet.size || 1;
  document.getElementById("dash-stats").innerHTML = `
    <div class="card"><div class="card-title">Entrate Totali</div><div class="card-value pos">${fmt(totE)}</div><div class="card-sub">${years.join(", ")}</div></div>
    <div class="card"><div class="card-title">Uscite Totali</div><div class="card-value neg">${fmt(totU)}</div><div class="card-sub">${uscite.length} transazioni</div></div>
    <div class="card"><div class="card-title">Saldo</div><div class="card-value ${saldo >= 0 ? "pos" : "neg"}">${fmt(saldo)}</div><div class="card-sub">Entrate − Uscite</div></div>
    <div class="card"><div class="card-title">Media Mensile Uscite</div><div class="card-value">${fmt(totU / nM)}</div><div class="card-sub">su ${nM} mesi</div></div>`;
  const mD = {
    2024: Array(12).fill(0),
    2025: Array(12).fill(0),
    2026: Array(12).fill(0),
  };
  ["2024", "2025", "2026"].forEach((y) =>
    (S.uscite[y] || []).forEach((u) => {
      if (u.data) {
        const mi = parseInt(u.data.slice(5, 7)) - 1;
        mD[y][mi] += u.valore;
      }
    }),
  );
  const colors = { 2024: "#3b82f6", 2025: "#22c55e", 2026: "#f97316" };
  const filtYears = years;
  if (chartMonthly) chartMonthly.destroy();
  chartMonthly = new Chart(document.getElementById("chartMonthly"), {
    type: "line",
    data: {
      labels: MESI.map((m) => m.slice(0, 3)),
      datasets: filtYears.map((y) => ({
        label: y,
        data: mD[y],
        borderColor: colors[y],
        backgroundColor: colors[y] + "22",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => "€" + v.toLocaleString("it-IT") },
        },
      },
    },
  });
  const catT = {};
  uscite.forEach((u) => {
    catT[u.categoria] = (catT[u.categoria] || 0) + u.valore;
  });
  const catS = Object.entries(catT).sort((a, b) => b[1] - a[1]);
  if (chartCat) chartCat.destroy();
  chartCat = new Chart(document.getElementById("chartCat"), {
    type: "doughnut",
    data: {
      labels: catS.map((c) => c[0]),
      datasets: [
        {
          data: catS.map((c) => c[1]),
          backgroundColor: catS.map((c) => catColor(c[0])),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}` },
        },
      },
    },
  });
  if (chartCompare) chartCompare.destroy();
  chartCompare = new Chart(document.getElementById("chartCompare"), {
    type: "bar",
    data: {
      labels: MESI.map((m) => m.slice(0, 3)),
      datasets: filtYears.map((y) => ({
        label: y,
        data: mD[y],
        backgroundColor: colors[y] + "cc",
        borderRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => "€" + v.toLocaleString("it-IT") },
        },
      },
    },
  });
  // Populate category select & render category chart
  const catSel = document.getElementById("dash-cat-select");
  if (catSel) {
    const usedCats = [
      ...new Set(uscite.map((u) => u.categoria).filter(Boolean)),
    ].sort();
    const prev = catSel.value;
    catSel.innerHTML =
      '<option value="">Seleziona categoria…</option>' +
      usedCats
        .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
        .join("");
    if (usedCats.includes(prev)) catSel.value = prev;
    else if (!prev && usedCats.includes("Benzina")) catSel.value = "Benzina";
    dashCatFilter = catSel.value;
  }
  renderDashCatChart();
  // Entrate charts
  const eColors = { 2024: "#8b5cf6", 2025: "#06b6d4", 2026: "#10b981" };
  const entrateYears =
    dashYear === "tutti" ? ["2024", "2025", "2026"] : [dashYear];
  const eMonthly = {};
  entrateYears.forEach((y) => {
    eMonthly[y] = Array(12).fill(0);
    (S.entrate[y] || []).forEach((e) => {
      if (e.data) {
        const mi = parseInt(e.data.slice(5, 7)) - 1;
        eMonthly[y][mi] += e.valore;
      }
    });
  });
  if (chartEntrateMonthly) chartEntrateMonthly.destroy();
  chartEntrateMonthly = new Chart(
    document.getElementById("chartEntrateMonthly"),
    {
      type: "bar",
      data: {
        labels: MESI.map((m) => m.slice(0, 3)),
        datasets: entrateYears.map((y) => ({
          label: y,
          data: eMonthly[y],
          backgroundColor: eColors[y] + "cc",
          borderRadius: 3,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => "€" + v.toLocaleString("it-IT") },
          },
        },
      },
    },
  );
  // Provenienza entrate (match esatto sulla descrizione)
  const FONTI = [
    { label: "Nonni", match: /^nonni$/i, color: "#8b5cf6" },
    { label: "Mamma", match: /^mamma$/i, color: "#ec4899" },
    { label: "Papi", match: /^papi$/i, color: "#3b82f6" },
    { label: "Assegno Unico", match: /^assegno\s*unico$/i, color: "#f59e0b" },
    { label: "Lavoro", match: /^lavoro$/i, color: "#22c55e" },
  ];
  const grouped = {
    Nonni: 0,
    Mamma: 0,
    Papi: 0,
    "Assegno Unico": 0,
    Lavoro: 0,
    Altro: 0,
  };
  entrate.forEach((e) => {
    const desc = (e.descrizione || "").trim();
    const f = FONTI.find((x) => x.match.test(desc));
    if (f) grouped[f.label] += e.valore;
    else grouped["Altro"] += e.valore;
  });
  const gEntries = Object.entries(grouped).filter(([, v]) => v > 0);
  const gColorMap = {
    Nonni: "#8b5cf6",
    Mamma: "#ec4899",
    Papi: "#3b82f6",
    "Assegno Unico": "#f59e0b",
    Lavoro: "#22c55e",
    Altro: "#94a3b8",
  };
  if (chartEntrateProvenienza) chartEntrateProvenienza.destroy();
  chartEntrateProvenienza = new Chart(
    document.getElementById("chartEntrateProvenienza"),
    {
      type: "doughnut",
      data: {
        labels: gEntries.map((e) => e[0]),
        datasets: [
          {
            data: gEntries.map((e) => e[1]),
            backgroundColor: gEntries.map(([l]) => gColorMap[l] || "#94a3b8"),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}` },
          },
        },
      },
    },
  );
  // Entrate per tipo (Conto / Portafoglio)
  const tipoTotals = {};
  entrate.forEach((e) => {
    if (e.tipo) {
      tipoTotals[e.tipo] = (tipoTotals[e.tipo] || 0) + e.valore;
    }
  });
  const tipoSorted = Object.entries(tipoTotals).sort((a, b) => b[1] - a[1]);
  if (chartEntrateTipo) chartEntrateTipo.destroy();
  chartEntrateTipo = new Chart(document.getElementById("chartEntrateTipo"), {
    type: "doughnut",
    data: {
      labels: tipoSorted.map((t) => t[0]),
      datasets: [
        {
          data: tipoSorted.map((t) => t[1]),
          backgroundColor: tipoSorted.map((t) => tipoColor(t[0])),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}` },
        },
      },
    },
  });
  // Confronto mensile entrate (segue anno selezionato)
  const allEMonthly = {};
  entrateYears.forEach((y) => {
    allEMonthly[y] = Array(12).fill(0);
    (S.entrate[y] || []).forEach((e) => {
      if (e.data) {
        const mi = parseInt(e.data.slice(5, 7)) - 1;
        allEMonthly[y][mi] += e.valore;
      }
    });
  });
  if (chartEntrateCompare) chartEntrateCompare.destroy();
  chartEntrateCompare = new Chart(
    document.getElementById("chartEntrateCompare"),
    {
      type: "line",
      data: {
        labels: MESI.map((m) => m.slice(0, 3)),
        datasets: entrateYears.map((y) => ({
          label: y,
          data: allEMonthly[y],
          borderColor: eColors[y],
          backgroundColor: eColors[y] + "22",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => "€" + v.toLocaleString("it-IT") },
          },
        },
      },
    },
  );
}

// ══════ DASH CAT CHART ══════
function renderDashCatChart() {
  const sel = document.getElementById("dash-cat-select");
  dashCatFilter = sel ? sel.value : "";
  const years = dashYear === "tutti" ? ["2024", "2025", "2026"] : [dashYear];
  const colors = { 2024: "#3b82f6", 2025: "#22c55e", 2026: "#f97316" };
  const datasets = years.map((y) => {
    const data = Array(12).fill(0);
    (S.uscite[y] || [])
      .filter(
        (u) => u.categoria === dashCatFilter && u.categoria !== "Prelievo",
      )
      .forEach((u) => {
        if (u.data) {
          const mi = parseInt(u.data.slice(5, 7)) - 1;
          data[mi] += u.valore;
        }
      });
    return {
      label: y,
      data,
      backgroundColor: colors[y] + "cc",
      borderRadius: 3,
    };
  });
  if (chartUsciteCategoria) chartUsciteCategoria.destroy();
  if (!dashCatFilter) {
    chartUsciteCategoria = null;
    return;
  }
  chartUsciteCategoria = new Chart(
    document.getElementById("chartUsciteCategoria"),
    {
      type: "bar",
      data: { labels: MESI.map((m) => m.slice(0, 3)), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: `Categoria: ${dashCatFilter}` },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => "€" + v.toLocaleString("it-IT") },
          },
        },
      },
    },
  );
}

// ══════ SALDI ══════
function renderSaldi() {
  const allU = ["2026"].flatMap((y) => S.uscite[y] || []);
  const allE = ["2026"].flatMap((y) => S.entrate[y] || []);
  const si = S.saldi_iniziali || {};
  const iC = parseFloat(si.conto || 0);
  const iP = parseFloat(si.portafoglio || 0);
  const iD = parseFloat(si.deposito || 0);
  const eC = allE
    .filter((e) => e.tipo === "Conto")
    .reduce((s, e) => s + e.valore, 0);
  const eP = allE
    .filter((e) => e.tipo === "Portafoglio")
    .reduce((s, e) => s + e.valore, 0);
  const eD = allE
    .filter((e) => e.tipo === "Deposito")
    .reduce((s, e) => s + e.valore, 0);
  const prelievi = allU.filter((u) => u.categoria === "Prelievo");
  const totPrel = prelievi.reduce((s, u) => s + u.valore, 0);
  const regU = allU.filter((u) => u.categoria !== "Prelievo");
  const uCarta = regU
    .filter((u) => u.tipo === "Carta")
    .reduce((s, u) => s + u.valore, 0);
  const uCont = regU
    .filter((u) => u.tipo === "Contanti")
    .reduce((s, u) => s + u.valore, 0);
  const uPrep = regU
    .filter((u) => u.tipo === "Prepagata")
    .reduce((s, u) => s + u.valore, 0);
  const conto = iC + eC - uCarta - uPrep - totPrel;
  const port = iP + eP - uCont + totPrel;
  const dep = iD + eD;
  const prelSub = totPrel > 0 ? ` − Prelievi ${fmt(totPrel)}` : "";
  const prelAdd = totPrel > 0 ? ` + Prelievi ${fmt(totPrel)}` : "";
  document.getElementById("saldi-cards").innerHTML = `
    <div class="card saldi-card" style="border-left-color:#3b82f6">
      <div class="card-title">🏦 Conto Bancario</div>
      <div class="card-value">${fmt(conto)}</div>
      <div class="card-sub">Iniziale ${fmt(iC)} + Entrate Conto ${fmt(eC)} − Carta ${fmt(uCarta)} − Prepagata ${fmt(uPrep)}${prelSub}</div>
    </div>
    <div class="card saldi-card" style="border-left-color:#22c55e">
      <div class="card-title">👛 Portafoglio</div>
      <div class="card-value">${fmt(port)}</div>
      <div class="card-sub">Iniziale ${fmt(iP)} + Entrate Portafoglio ${fmt(eP)} − Contanti ${fmt(uCont)}${prelAdd}</div>
    </div>`;
}

// ══════ RESOCONTO ══════
function renderResoconto() {
  const year = dashYear === "tutti" ? "2026" : dashYear;
  const uscite = (S.uscite[year] || []).filter(
    (u) => u.categoria !== "Prelievo",
  );
  const entrate = S.entrate[year] || [];
  const cats = [
    ...new Set(uscite.map((u) => u.categoria).filter(Boolean)),
  ].sort();
  const uscTipos = [
    ...new Set(uscite.map((u) => u.tipo).filter(Boolean)),
  ].sort();
  const entTipos = [
    ...new Set(entrate.map((e) => e.tipo).filter(Boolean)),
  ].sort();
  let thead = `<thead class="resoconto-tbl"><tr><th class="no-sort">Mese</th>`;
  cats.forEach(
    (c) => (thead += `<th class="no-sort cat-header">${esc(c)}</th>`),
  );
  thead += `<th class="no-sort" style="background:#0f172a;">Totale Uscite</th>`;
  uscTipos.forEach(
    (t) => (thead += `<th class="no-sort tipo-header">${esc(t)}</th>`),
  );
  entTipos.forEach(
    (t) => (thead += `<th class="no-sort ent-header">${esc(t)}</th>`),
  );
  thead += `<th class="no-sort" style="background:#0f172a;color:#fcd34d;">Tot. Entrate</th>
    <th class="no-sort" style="background:#0f172a;color:#f87171;">Diff.</th></tr></thead>`;
  const totCat = {},
    totUT = {},
    totET = {};
  cats.forEach((c) => (totCat[c] = 0));
  uscTipos.forEach((t) => (totUT[t] = 0));
  entTipos.forEach((t) => (totET[t] = 0));
  let grandU = 0,
    grandE = 0;
  let tbody = "<tbody>";
  MESI.forEach((mese) => {
    const mu = uscite.filter((u) => u.mese === mese);
    const me = entrate.filter((e) => e.mese === mese);
    const totU = mu.reduce((s, u) => s + u.valore, 0);
    const totE = me.reduce((s, e) => s + e.valore, 0);
    const diff = totE - totU;
    grandU += totU;
    grandE += totE;
    tbody += `<tr><td><strong>${mese}</strong></td>`;
    cats.forEach((c) => {
      const v = mu
        .filter((u) => u.categoria === c)
        .reduce((s, u) => s + u.valore, 0);
      totCat[c] += v;
      tbody += `<td class="amt${v === 0 ? " zero" : ""}">${v === 0 ? "—" : fmt(v)}</td>`;
    });
    tbody += `<td class="amt neg"><strong>${totU > 0 ? fmt(totU) : "—"}</strong></td>`;
    uscTipos.forEach((t) => {
      const v = mu
        .filter((u) => u.tipo === t)
        .reduce((s, u) => s + u.valore, 0);
      totUT[t] += v;
      tbody += `<td class="amt${v === 0 ? " zero" : ""}">${v === 0 ? "—" : fmt(v)}</td>`;
    });
    entTipos.forEach((t) => {
      const v = me
        .filter((e) => e.tipo === t)
        .reduce((s, e) => s + e.valore, 0);
      totET[t] += v;
      tbody += `<td class="amt${v === 0 ? " zero" : ""}">${v === 0 ? "—" : fmt(v)}</td>`;
    });
    tbody += `<td class="amt pos"><strong>${totE > 0 ? fmt(totE) : "—"}</strong></td>
      <td class="amt ${diff >= 0 ? "pos" : "neg"}"><strong>${diff !== 0 ? fmt(diff) : "—"}</strong></td></tr>`;
  });
  tbody += `<tr class="total-row"><td>Totali</td>`;
  cats.forEach((c) => (tbody += `<td class="amt neg">${fmt(totCat[c])}</td>`));
  tbody += `<td class="amt neg">${fmt(grandU)}</td>`;
  uscTipos.forEach(
    (t) => (tbody += `<td class="amt neg">${fmt(totUT[t])}</td>`),
  );
  entTipos.forEach(
    (t) => (tbody += `<td class="amt pos">${fmt(totET[t])}</td>`),
  );
  const grandDiff = grandE - grandU;
  tbody += `<td class="amt pos">${fmt(grandE)}</td><td class="amt ${grandDiff >= 0 ? "pos" : "neg"}">${fmt(grandDiff)}</td></tr></tbody>`;
  document.getElementById("resoconto-wrap").innerHTML =
    `<table class="resoconto-tbl">${thead}${tbody}</table>`;
}

// ══════ GESTIONE ══════
let gestYear = "2026";
let chartGestione = null;
function setGestYear(y, el) {
  gestYear = y;
  document
    .querySelectorAll("#gest-year-pills .pill")
    .forEach((p) => p.classList.remove("active"));
  if (el) el.classList.add("active");
  renderGestione();
}
const CUR_YEAR = new Date().getFullYear();
function _giorni(mi, year) {
  const y = parseInt(year);
  return y === CUR_YEAR ? daysElapsed(mi, y) : daysInMonth(mi, y);
}
function gestioneCalc(year) {
  return MESI.map((mese, mi) => {
    const fisse = (S.uscite[year] || [])
      .filter((u) => u.categoria === "Fisse" && u.mese === mese)
      .reduce((s, u) => s + u.valore, 0);
    const b = Math.round(fisse / 5.5);
    const c = b * 20;
    const giorni = _giorni(mi, year);
    const dato = giorni > 0 ? c / giorni : 0;
    return { mese, fisse, b, c, giorni, dato };
  });
}
function gestioneCalcTutti() {
  const years = ["2024", "2025", "2026"];
  return MESI.map((mese, mi) => {
    const fisse = years.reduce(
      (s, y) =>
        s +
        (S.uscite[y] || [])
          .filter((u) => u.categoria === "Fisse" && u.mese === mese)
          .reduce((ss, u) => ss + u.valore, 0),
      0,
    );
    const b = Math.round(fisse / 5.5);
    const c = b * 20;
    const giorni = years.reduce((s, y) => s + _giorni(mi, y), 0);
    const dato = giorni > 0 ? c / giorni : 0;
    return { mese, fisse, b, c, giorni, dato };
  });
}
function renderGestione() {
  const data =
    gestYear === "tutti" ? gestioneCalcTutti() : gestioneCalc(gestYear);
  const totalFisse = data.reduce((s, r) => s + r.fisse, 0);
  const totalB = data.reduce((s, r) => s + r.b, 0);
  const totalC = data.reduce((s, r) => s + r.c, 0);
  const gestLabel = gestYear === "tutti" ? "Tutti gli anni" : gestYear;
  document.getElementById("gest-summary-cards").innerHTML = `
    <div class="card"><div class="card-title">Totale Fisse ${gestLabel}</div><div class="card-value">${fmt(totalFisse)}</div><div class="card-sub">Spese personali giornaliere</div></div>
    <div class="card"><div class="card-title">Totale Unità</div><div class="card-value">${Math.round(totalB)}</div><div class="card-sub"></div></div>
    <div class="card"><div class="card-title"> Totale</div><div class="card-value">${Math.round(totalC)}</div><div class="card-sub">Unità × 20</div></div>`;
  document.getElementById("gest-monthly-title").textContent =
    `Dettaglio Mensile — ${gestLabel}`;
  const totalGiorni = data.reduce((s, r) => s + r.giorni, 0);
  const totalDato = totalGiorni > 0 ? totalC / totalGiorni : 0;
  const tbody = document.getElementById("tbody-gestione");
  tbody.innerHTML =
    data
      .map(
        (r) => `<tr>
    <td><strong>${r.mese}</strong></td>
    <td class="amt neg" style="text-align:center;">${fmt(r.fisse)}</td>
    <td class="amt" style="text-align:center;">${r.b}</td>
    <td class="amt" style="text-align:center;">${r.c}</td>
    <td class="amt" style="text-align:center;font-weight:700;">${r.giorni > 0 && r.c > 0 ? fmtN(r.dato, 2) : "—"}</td>
  </tr>`,
      )
      .join("") +
    `<tr class="total-row">
    <td><strong>Totale</strong></td>
    <td class="amt neg" style="text-align:center;"><strong>${fmt(totalFisse)}</strong></td>
    <td class="amt" style="text-align:center;"><strong>${Math.round(totalB)}</strong></td>
    <td class="amt" style="text-align:center;"><strong>${Math.round(totalC)} </strong></td>
    <td class="amt" style="text-align:center;font-weight:700;"><strong>${fmtN(totalDato, 2)}</strong></td>
  </tr>`;
  const d24 = gestioneCalc("2024"),
    d25 = gestioneCalc("2025"),
    d26 = gestioneCalc("2026");
  document.getElementById("tbody-gest-compare").innerHTML = MESI.map(
    (m, i) => `<tr>
    <td><strong>${m}</strong></td>
    <td style="background:#eff6ff">${d24[i].b}</td><td style="background:#eff6ff">${d24[i].c} </td>
    <td style="background:#f0fdf4">${d25[i].b}</td><td style="background:#f0fdf4">${d25[i].c} </td>
    <td style="background:#fefce8">${d26[i].b}</td><td style="background:#fefce8">${d26[i].c} </td>
  </tr>`,
  ).join("");
  // Gestione histogram
  const gColors = { 2024: "#3b82f6", 2025: "#22c55e", 2026: "#f97316" };
  const gData = { 2024: d24, 2025: d25, 2026: d26 };
  if (chartGestione) chartGestione.destroy();
  chartGestione = new Chart(document.getElementById("chartGestione"), {
    type: "bar",
    data: {
      labels: MESI.map((m) => m.slice(0, 3)),
      datasets: ["2024", "2025", "2026"].map((y) => ({
        label: `${y}`,
        data: gData[y].map((r) => parseFloat(r.dato.toFixed(2))),
        backgroundColor: gColors[y] + "cc",
        borderRadius: 3,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) =>
              v.toLocaleString("it-IT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
          },
        },
      },
    },
  });
}

// ══════ IMPOSTAZIONI ══════
function renderImpostazioni() {
  renderTagList("cat-list", S.categorie, removeCategoria);
  renderTagList("tipo-list", S.tipos, removeTipo);
  renderTagList("etipo-list", S.etipos, removeETipo);
  const si = S.saldi_iniziali || {};
  const scEl = document.getElementById("saldo-conto");
  const spEl = document.getElementById("saldo-portafoglio");
  const sdEl = document.getElementById("saldo-deposito");
  if (scEl) scEl.value = si.conto || "";
  if (spEl) spEl.value = si.portafoglio || "";
  if (sdEl) sdEl.value = si.deposito || "";
}
function saveSaldi() {
  if (!S.saldi_iniziali) S.saldi_iniziali = {};
  S.saldi_iniziali.conto =
    parseFloat(document.getElementById("saldo-conto").value) || 0;
  S.saldi_iniziali.portafoglio =
    parseFloat(document.getElementById("saldo-portafoglio").value) || 0;
  S.saldi_iniziali.deposito =
    parseFloat(document.getElementById("saldo-deposito").value) || 0;
  saveSettings();
  renderSaldi();
}
function renderTagList(id, items, removeFn) {
  document.getElementById(id).innerHTML = items
    .map(
      (i) => `
    <div class="tag-item"><span>${esc(i)}</span>
    <button onclick='${removeFn.name}(${JSON.stringify(i)})' title="Rimuovi">✕</button></div>`,
    )
    .join("");
}
function addCategoria() {
  const v = document.getElementById("new-cat-input").value.trim();
  if (!v || S.categorie.includes(v)) return;
  S.categorie.push(v);
  S.categorie.sort();
  saveSettings();
  document.getElementById("new-cat-input").value = "";
  renderImpostazioni();
}
function removeCategoria(c) {
  if (!confirm(`Rimuovere la categoria "${c}"?`)) return;
  S.categorie = S.categorie.filter((x) => x !== c);
  saveSettings();
  renderImpostazioni();
}
function addTipo() {
  const v = document.getElementById("new-tipo-input").value.trim();
  if (!v || S.tipos.includes(v)) return;
  S.tipos.push(v);
  S.tipos.sort();
  saveSettings();
  document.getElementById("new-tipo-input").value = "";
  renderImpostazioni();
}
function removeTipo(t) {
  if (!confirm(`Rimuovere il tipo "${t}"?`)) return;
  S.tipos = S.tipos.filter((x) => x !== t);
  saveSettings();
  renderImpostazioni();
}
function addETipo() {
  const v = document.getElementById("new-etipo-input").value.trim();
  if (!v || S.etipos.includes(v)) return;
  S.etipos.push(v);
  S.etipos.sort();
  saveSettings();
  document.getElementById("new-etipo-input").value = "";
  renderImpostazioni();
}
function removeETipo(t) {
  if (!confirm(`Rimuovere il tipo entrata "${t}"?`)) return;
  S.etipos = S.etipos.filter((x) => x !== t);
  saveSettings();
  renderImpostazioni();
}

// ══════ EXPORT / RESET ══════
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "spese_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
}
function exportCSV(type) {
  const years = ["2024", "2025", "2026"];
  let rows = [];
  if (type === "uscite") {
    rows = [
      ["Anno", "Mese", "Data", "Descrizione", "Valore", "Categoria", "Tipo"],
    ];
    years.forEach((y) =>
      (S.uscite[y] || []).forEach((u) =>
        rows.push([
          y,
          u.mese,
          u.data,
          u.descrizione,
          u.valore,
          u.categoria,
          u.tipo,
        ]),
      ),
    );
  } else {
    rows = [["Anno", "Mese", "Data", "Descrizione", "Valore", "Tipo"]];
    years.forEach((y) =>
      (S.entrate[y] || []).forEach((e) =>
        rows.push([y, e.mese, e.data, e.descrizione, e.valore, e.tipo]),
      ),
    );
  }
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `spese_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
async function confirmReset() {
  if (
    !confirm(
      "Ripristinare le impostazioni (categorie, tipi, saldi iniziali)?\nI dati nel database NON verranno modificati.",
    )
  )
    return;
  localStorage.removeItem("spese_settings_v1");
  loadSettings();
  renderDashboard();
  renderSaldi();
  renderResoconto();
  renderImpostazioni();
  alert("Impostazioni ripristinate!");
}

// ══════ AUTH ══════
async function checkAuth() {
  // Il body è nascosto di default, lo mostriamo solo se autenticato
  const {
    data: { session },
  } = await db.auth.getSession();
  if (session) {
    document.body.style.visibility = "visible";
    return true;
  }
  // Nessuna sessione → redirect al login
  window.location.href =
    "https://giacomoprevitali.github.io/Gestore_Spese/login.html";
  return false;
}

async function logout() {
  await db.auth.signOut();
  window.location.href =
    "https://giacomoprevitali.github.io/Gestore_Spese/login.html";
}

// ══════ INIT ══════
(async () => {
  const ok = await checkAuth();
  if (!ok) return;

  await loadState();
  initAutocompletes();
  document.getElementById("f-uscita-year").value = "2026";
  document.getElementById("f-entrata-year").value = "2026";
  renderDashboard();
  renderSaldi();
  renderResoconto();
})();
