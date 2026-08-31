const DB_KEY = "garage_system_v1";
const AUTH_KEY = "garage_system_auth";

const DEFAULT_SERVICES = [
  "Diagnostic with high computer technology",
  "Service and maintenance",
  "Major repairs",
  "Accessories and reconditioning",
  "Car wash",
  "Body denting and painting",
  "Genuine parts",
  "Tires service",
  "Wheel alignment service",
  "A/C service",
  "Tires balance service",
];

const DEFAULT_PASSWORD = "admin123";

const state = {
  settings: {
    company: "AUTO EXPERT & GENUINE PARTS",
    vat: 15,
    extra: 3,
    services: [...DEFAULT_SERVICES],
  },
  jobs: [], // { jc,date,customer,company,phone,plate,vin,odometer,service,status,approval,mechanic,labor,report }
  parts: [], // { jc,name,qty,price,source,version }
  cash: [], // { date,shift,employee,type,amount,description }
  closes: [], // { date,shift,employee,opening,totalIn,totalOut,balance,closedBy }
};

function save() { localStorage.setItem(DB_KEY, JSON.stringify(state)); }

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      Object.assign(state, d);
    }
  } catch (e) { console.error(e); }
  normalizeState();
}

function normalizeState() {
  if (!state.settings || typeof state.settings !== "object") {
    state.settings = { company: "AUTO EXPERT & GENUINE PARTS", vat: 15, extra: 3, services: [...DEFAULT_SERVICES] };
  } else {
    state.settings.company = state.settings.company || "AUTO EXPERT & GENUINE PARTS";
    state.settings.vat = Number(state.settings.vat) || 15;
    state.settings.extra = Number(state.settings.extra) || 3;
    if (!Array.isArray(state.settings.services) || state.settings.services.length === 0) {
      state.settings.services = [...DEFAULT_SERVICES];
    }
  }
  if (!Array.isArray(state.jobs)) state.jobs = [];
  if (!Array.isArray(state.parts)) state.parts = [];
  if (!Array.isArray(state.cash)) state.cash = [];
  if (!Array.isArray(state.closes)) state.closes = [];
}

function saveAuth() { localStorage.setItem(AUTH_KEY, "1"); }
function clearAuth() { localStorage.removeItem(AUTH_KEY); }
function isAuthenticated() { return localStorage.getItem(AUTH_KEY) === "1"; }

const $ = (id) => document.getElementById(id);
const money = (n) => (n == null || isNaN(n) ? "0.00" : Number(n).toFixed(2));
const today = () => new Date().toISOString().slice(0, 10);

function partsTotal(jc) {
  return state.parts.filter((p) => p.jc === jc).reduce((s, p) => s + p.qty * p.price, 0);
}
function jobRow(j) {
  const totalParts = partsTotal(j.jc);
  const labor = Number(j.labor) || 0;
  const vat = (labor + totalParts) * ((Number(state.settings.vat) || 0) / 100);
  const extra = (labor + totalParts) * ((Number(state.settings.extra) || 0) / 100);
  const grand = labor + totalParts + vat + extra;
  return { totalParts, vat, extra, grand };
}

// --------------------- login/logout ---------------------
function showLogin() {
  $("loginOverlay").classList.remove("hidden");
  $("mainContent").classList.add("hidden");
  $("topbar").classList.add("hidden");
  $("loginPassword").value = "";
  setTimeout(() => $("loginPassword").focus(), 100);
}

function hideLogin() {
  $("loginOverlay").classList.add("hidden");
  $("mainContent").classList.remove("hidden");
  $("topbar").classList.remove("hidden");
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const pw = $("loginPassword").value;
  if (pw === DEFAULT_PASSWORD) {
    saveAuth();
    hideLogin();
  } else {
    alert("Incorrect password. Please try again.");
    $("loginPassword").value = "";
    $("loginPassword").focus();
  }
});

$("btnLogout").addEventListener("click", () => {
  clearAuth();
  showLogin();
});

// --------------------- navigation ---------------------
document.querySelectorAll(".tab[data-sheet]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab[data-sheet]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    document.querySelectorAll(".sheet").forEach((s) => s.classList.remove("active"));
    $("sheet-" + btn.dataset.sheet).classList.add("active");
  });
});

// --------------------- settings ---------------------
function renderSettings() {
  $("sCompany").value = state.settings.company || "";
  $("sVat").value = state.settings.vat != null ? state.settings.vat : 15;
  $("sExtra").value = state.settings.extra != null ? state.settings.extra : 3;
  $("sServices").value = Array.isArray(state.settings.services) ? state.settings.services.join("\n") : DEFAULT_SERVICES.join("\n");
}
$("btnSaveSettings").addEventListener("click", () => {
  state.settings.company = $("sCompany").value.trim() || state.settings.company;
  state.settings.vat = Number($("sVat").value) || 0;
  state.settings.extra = Number($("sExtra").value) || 0;
  state.settings.services = $("sServices").value.split("\n").map((s) => s.trim()).filter(Boolean);
  save();
  renderAll();
  alert("Settings saved.");
});

// --------------------- masters ---------------------
function renderServiceSelect() {
  const services = Array.isArray(state.settings.services) ? state.settings.services : DEFAULT_SERVICES;
  $("fService").innerHTML = services
    .map((s) => `<option>${s}</option>`)
    .join("");
}

function getSelectedServices() {
  return Array.from($("fService").selectedOptions).map((o) => o.value);
}

$("btnAddService").addEventListener("click", () => {
  const name = prompt("Enter new service name:");
  if (!name || !name.trim()) return;
  const trimmed = name.trim();
  const services = Array.isArray(state.settings.services) ? state.settings.services : DEFAULT_SERVICES;
  if (!services.includes(trimmed)) {
    services.push(trimmed);
    state.settings.services = services;
    save();
    renderServiceSelect();
    renderSettings();
    alert("Service added.");
  } else {
    alert("Service already exists.");
  }
});

function renderMaster() {
  renderServiceSelect();
  const body = $("masterBody");
  body.innerHTML = state.jobs.length
    ? state.jobs
        .map((j) => {
          const r = jobRow(j);
          const serviceText = Array.isArray(j.service) ? j.service.join(", ") : (j.service || "");
          return `<tr>
            <td><b>${j.jc}</b></td><td>${j.date}</td><td>${j.customer}</td>
            <td>${j.company}</td><td>${j.phone}</td><td>${j.plate}</td>
            <td>${j.vin}</td><td>${j.odometer}</td><td>${serviceText}</td>
            <td><span class="status ${(j.status || "").replace(/\s/g, "")}">${j.status || ""}</span></td>
            <td>${j.approval}</td><td>${j.mechanic}</td>
            <td>${j.report || ""}</td>
            <td class="num">${money(j.labor)}</td>
            <td class="num">${money(r.totalParts)}</td>
            <td class="num">${money(r.vat)}</td>
            <td class="num">${money(r.extra)}</td>
            <td class="num grand">${money(r.grand)}</td>
            <td><button class="btn small" data-edit-jc="${j.jc}">Edit</button></td>
            <td><button class="btn danger small" data-del-jc="${j.jc}">Delete</button></td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="22" class="empty">No jobs yet. Fill the form above and click ADD NEW JOB.</td></tr>`;
}

$("btnAdd").addEventListener("click", () => {
  const jc = $("fJc").value.trim();
  if (!jc) { alert("JC.NO is required."); return; }
  const service = getSelectedServices();
  if (state.jobs.some((j) => j.jc === jc)) {
    let job = state.jobs.find((j) => j.jc === jc);
    Object.assign(job, {
      date: $("fDate").value || job.date,
      customer: $("fCustomer").value || job.customer,
      company: $("fCompany").value || job.company,
      phone: $("fPhone").value || job.phone,
      plate: $("fPlate").value || job.plate,
      vin: $("fVin").value || job.vin,
      odometer: $("fOdometer").value || job.odometer,
      service: service.length ? service : job.service,
      status: $("fStatus").value,
      approval: $("fApproval").value || job.approval,
      mechanic: $("fMechanic").value || job.mechanic,
      report: $("fReport").value || job.report,
      labor: $("fLabor").value || job.labor,
    });
  } else {
    state.jobs.unshift({
      jc, date: $("fDate").value || today(),
      customer: $("fCustomer").value, company: $("fCompany").value,
      phone: $("fPhone").value, plate: $("fPlate").value, vin: $("fVin").value,
      odometer: $("fOdometer").value, service,
      status: $("fStatus").value, approval: $("fApproval").value,
      mechanic: $("fMechanic").value, report: $("fReport").value,
      labor: $("fLabor").value,
    });
  }
  save();
  renderAll();
  $("fJc").value = "";
  ["fCustomer","fPhone","fVin","fPlate","fMechanic","fLabor","fReport","fCompany","fOdometer","fApproval"]
    .forEach((id) => { $(id).value = ""; });
  Array.from($("fService").options).forEach((o) => { o.selected = false; });
  $("fStatus").value = "Diagnosis";
  $("fDate").value = today();
  $("fJc").focus();
});

let editingPartIndex = null;
let editingCashIndex = null;
let editingCloseIndex = null;

document.addEventListener("click", (e) => {
  // Master edit
  const editJc = e.target.dataset && e.target.dataset.editJc;
  if (editJc) {
    const j = state.jobs.find((x) => x.jc === editJc);
    if (!j) return;
    $("fJc").value = j.jc;
    $("fDate").value = j.date || today();
    $("fCustomer").value = j.customer || "";
    $("fCompany").value = j.company || "";
    $("fPhone").value = j.phone || "";
    $("fPlate").value = j.plate || "";
    $("fVin").value = j.vin || "";
    $("fOdometer").value = j.odometer || "";
    $("fStatus").value = j.status || "Diagnosis";
    $("fApproval").value = j.approval || "";
    $("fMechanic").value = j.mechanic || "";
    $("fReport").value = j.report || "";
    $("fLabor").value = j.labor || "";
    Array.from($("fService").options).forEach((o) => { o.selected = Array.isArray(j.service) && j.service.includes(o.value); });
    document.querySelectorAll(".tab[data-sheet]").forEach((b) => {
      b.classList.toggle("active", b.dataset.sheet === "master");
      b.setAttribute("aria-selected", b.dataset.sheet === "master" ? "true" : "false");
    });
    document.querySelectorAll(".sheet").forEach((s) => s.classList.remove("active"));
    $("sheet-master").classList.add("active");
    $("fJc").focus();
    return;
  }

  // Parts edit
  const editPart = e.target.dataset && e.target.dataset.editPart;
  if (editPart != null) {
    const p = state.parts[Number(editPart)];
    if (!p) return;
    editingPartIndex = Number(editPart);
    $("partsJc").value = p.jc;
    $("pName").value = p.name || "";
    $("pQty").value = p.qty || 1;
    $("pPrice").value = p.price || 0;
    $("pSource").value = p.source || "Internal";
    $("btnAddPart").textContent = "UPDATE PART";
    document.querySelectorAll(".tab[data-sheet]").forEach((b) => {
      b.classList.toggle("active", b.dataset.sheet === "parts");
      b.setAttribute("aria-selected", b.dataset.sheet === "parts" ? "true" : "false");
    });
    document.querySelectorAll(".sheet").forEach((s) => s.classList.remove("active"));
    $("sheet-parts").classList.add("active");
    return;
  }

  // Cash edit
  const editCash = e.target.dataset && e.target.dataset.editCash;
  if (editCash != null) {
    const c = state.cash[Number(editCash)];
    if (!c) return;
    editingCashIndex = Number(editCash);
    $("cShift").value = c.shift || "Shift 1";
    $("cEmployee").value = c.employee || "";
    $("cType").value = c.type || "Cash In";
    $("cAmount").value = c.amount || "";
    $("cDesc").value = c.description || "";
    $("cDate").value = c.date || today();
    $("btnAddCash").textContent = "UPDATE";
    document.querySelectorAll(".tab[data-sheet]").forEach((b) => {
      b.classList.toggle("active", b.dataset.sheet === "cash");
      b.setAttribute("aria-selected", b.dataset.sheet === "cash" ? "true" : "false");
    });
    document.querySelectorAll(".sheet").forEach((s) => s.classList.remove("active"));
    $("sheet-cash").classList.add("active");
    return;
  }

  // Close edit
  const editClose = e.target.dataset && e.target.dataset.editClose;
  if (editClose != null) {
    const c = state.closes[Number(editClose)];
    if (!c) return;
    editingCloseIndex = Number(editClose);
    $("closeShift").value = c.shift || "Shift 1";
    $("closeEmployee").value = c.employee || "";
    $("closeOpening").value = c.opening || 0;
    $("btnCloseShift").textContent = "UPDATE CLOSE";
    document.querySelectorAll(".tab[data-sheet]").forEach((b) => {
      b.classList.toggle("active", b.dataset.sheet === "close");
      b.setAttribute("aria-selected", b.dataset.sheet === "close" ? "true" : "false");
    });
    document.querySelectorAll(".sheet").forEach((s) => s.classList.remove("active"));
    $("sheet-close").classList.add("active");
    return;
  }

  // Delete handlers
  const jc = e.target.dataset && e.target.dataset.delJc;
  if (jc) {
    if (!confirm(`Delete job ${jc} and its parts?`)) return;
    state.jobs = state.jobs.filter((j) => j.jc !== jc);
    state.parts = state.parts.filter((p) => p.jc !== jc);
    save();
    renderAll();
    return;
  }

  const idx = e.target.dataset && e.target.dataset.delPart;
  if (idx != null) {
    state.parts.splice(Number(idx), 1);
    save();
    renderParts();
    renderMaster();
    return;
  }

  const cashIdx = e.target.dataset && e.target.dataset.delCash;
  if (cashIdx != null) {
    state.cash.splice(Number(cashIdx), 1);
    save();
    renderCash();
    return;
  }

  const closeIdx = e.target.dataset && e.target.dataset.delClose;
  if (closeIdx != null) {
    if (!confirm("Delete this shift close record?")) return;
    state.closes.splice(Number(closeIdx), 1);
    save();
    renderClose();
    return;
  }
});

function fillJcSelects() {
  const prevPartsJc = $("partsJc").value;
  const prevPrintJc = $("printJc").value;
  const opts = state.jobs.map((j) => `<option value="${j.jc}">${j.jc} — ${j.customer || "no customer"}</option>`).join("");
  $("partsJcList").innerHTML = opts || '<option value="">No jobs yet</option>';
  $("printJcList").innerHTML = opts || '<option value="">No jobs yet</option>';
  if (prevPartsJc) $("partsJc").value = prevPartsJc;
  if (prevPrintJc) $("printJc").value = prevPrintJc;
}
function renderParts() {
  fillJcSelects();
  const jc = $("partsJc").value;
  const rows = state.parts.filter((p) => p.jc === jc);
  $("partsBody").innerHTML = rows.length
    ? rows.map((p, i) => `<tr>
        <td><b>${p.jc}</b></td><td>${p.name}</td><td class="num">${p.qty}</td>
        <td class="num">${money(p.price)}</td><td>${p.source}</td>
        <td class="num grand">${money(p.qty * p.price)}</td>
        <td><button class="btn small" data-edit-part="${i}">Edit</button></td>
        <td><button class="btn danger small" data-del-part="${i}">Delete</button></td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty">No parts for JC ${jc || ""}. Add parts below.</td></tr>`;
}

$("btnAddPart").addEventListener("click", () => {
  const jc = $("partsJc").value;
  const name = $("pName").value.trim();
  if (!jc || !name) { alert("Select a JC.NO and enter a part name."); return; }
  const partData = {
    jc, name,
    qty: Number($("pQty").value) || 1,
    price: Number($("pPrice").value) || 0,
    source: $("pSource").value,
  };
  if (editingPartIndex != null) {
    state.parts[editingPartIndex] = partData;
    editingPartIndex = null;
    $("btnAddPart").textContent = "ADD PART";
  } else {
    state.parts.push(partData);
  }
  $("pName").value = ""; $("pPrice").value = "";
  save();
  renderParts();
  renderMaster();
  renderPrintCard();
});

document.addEventListener("click", (e) => {
  const idx = e.target.dataset && e.target.dataset.delPart;
  if (idx != null) {
    state.parts.splice(Number(idx), 1);
    save();
    renderParts();
    renderMaster();
  }
});

// --------------------- cash ---------------------
function renderCash() {
  const body = $("cashBody");
  body.innerHTML = state.cash.length
    ? state.cash
        .map((c, i) => `<tr>
          <td>${c.date}</td><td>${c.shift}</td><td>${c.employee}</td>
          <td>${c.type}</td><td class="num ${c.type === "Cash In" ? "grand" : "grand"}">${money(c.amount)}</td>
          <td>${c.description}</td>
          <td><button class="btn small" data-edit-cash="${i}">Edit</button></td>
          <td><button class="btn danger small" data-del-cash="${i}">Delete</button></td>
        </tr>`)
        .reverse()
        .join("")
    : `<tr><td colspan="8" class="empty">No cash transactions logged.</td></tr>`;
}
$("btnAddCash").addEventListener("click", () => {
  const amount = Number($("cAmount").value);
  if (!amount || !$("cEmployee").value.trim()) { alert("Amount and Employee are required."); return; }
  const cashData = {
    date: $("cDate").value || today(),
    shift: $("cShift").value,
    employee: $("cEmployee").value.trim(),
    type: $("cType").value,
    amount,
    description: $("cDesc").value.trim(),
  };
  if (editingCashIndex != null) {
    state.cash[editingCashIndex] = cashData;
    editingCashIndex = null;
    $("btnAddCash").textContent = "ADD";
  } else {
    state.cash.push(cashData);
  }
  $("cEmployee").value = ""; $("cAmount").value = ""; $("cDesc").value = "";
  save();
  renderCash();
});
document.addEventListener("click", (e) => {
  const idx = e.target.dataset && e.target.dataset.delCash;
  if (idx != null) {
    state.cash.splice(Number(idx), 1);
    save();
    renderCash();
  }
});

// --------------------- close shift ---------------------
function renderClose() {
  const body = $("closeBody");
  body.innerHTML = state.closes.length
    ? state.closes.map((c, i) => `<tr>
        <td>${c.date}</td><td>${c.shift}</td><td>${c.employee}</td>
        <td class="num">${money(c.opening)}</td><td class="num">${money(c.totalIn)}</td>
        <td class="num">${money(c.totalOut)}</td><td class="num grand">${money(c.balance)}</td>
        <td>${c.closedBy}</td>
        <td><button class="btn small" data-edit-close="${i}">Edit</button></td>
        <td><button class="btn danger small" data-del-close="${i}">Delete</button></td>
      </tr>`).join("")
    : `<tr><td colspan="10" class="empty">No shift closings yet.</td></tr>`;
}
$("btnCloseShift").addEventListener("click", () => {
  const shift = $("closeShift").value;
  const emp = $("closeEmployee").value.trim();
  if (!emp) { alert("Employee name required."); return; }
  const inAmt = state.cash.filter((c) => c.shift === shift && c.type === "Cash In").reduce((s, c) => s + c.amount, 0);
  const outAmt = state.cash.filter((c) => c.shift === shift && c.type === "Cash Out").reduce((s, c) => s + c.amount, 0);
  const opening = Number($("closeOpening").value) || 0;
  const balance = opening + inAmt - outAmt;
  if (editingCloseIndex != null) {
    state.closes[editingCloseIndex] = { ...state.closes[editingCloseIndex], shift, employee: emp, opening, totalIn: inAmt, totalOut: outAmt, balance, closedBy: emp };
    editingCloseIndex = null;
    $("btnCloseShift").textContent = "CLOSE SHIFT";
  } else {
    state.closes.unshift({ date: today(), shift, employee: emp, opening, totalIn: inAmt, totalOut: outAmt, balance, closedBy: emp });
    window.printCloseHandover(state.closes[0]);
  }
  save();
  renderClose();
});

function printCloseHandover(c) {
  const html = `<div class="print-out">
    <div class="p-header">
      <div class="name">${state.settings.company}</div>
      <div class="serv">Shift Handover — ${c.date}</div>
    </div>
    <div class="p-body">
      <div class="p-title">Shift Close Report</div>
      <div class="p-field">
        <div><b>Shift</b><span>${c.shift}</span></div>
        <div><b>Employee</b><span>${c.employee}</span></div>
        <div><b>Opening Cash</b><span>${money(c.opening)}</span></div>
        <div><b>Total Cash In</b><span>${money(c.totalIn)}</span></div>
        <div><b>Total Cash Out</b><span>${money(c.totalOut)}</span></div>
        <div><b>Remaining Balance</b><span>${money(c.balance)}</span></div>
        <div><b>Closed By</b><span>${c.closedBy}</span></div>
      </div>
      <div class="p-sign-area">
        <div class="p-sign"><span></span><small>Prepared By</small></div>
        <div class="p-sign"><span></span><small>Approved By</small></div>
      </div>
    </div>
  </div>`;
  $("printCard").innerHTML = html;
  const w = window.open("", "_blank", "width=900,height=700");
  if (w) {
    w.document.write(`<!DOCTYPE html><html><head><title>ShiftClose_${c.date}</title>
      <style>${printCss()}@page{size:A4;margin:0}body{font-family:system-ui,sans-serif;margin:0;padding:0;background:#fff}</style>
    </head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }
}

function printCss() {
  return `.print-out{width:210mm;min-height:297mm;margin:20px auto;padding:0;font-size:12px;font-family:system-ui,sans-serif;color:#1A1A1A;background:#fff;border-radius:10px;border-top:6px solid #2563eb;box-shadow:0 4px 12px rgba(0,0,0,0.08)}
  .p-header{background:#1F2937;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0}.p-header .name{font-size:20px;font-weight:800;letter-spacing:.3px;margin-bottom:2px}
  .p-header .serv{font-size:11px;color:#9ca3af;font-style:italic}.p-body{padding:20px}
  .p-title{text-align:center;font-size:16px;font-weight:700;margin:16px 0;letter-spacing:1.5px;color:#1F2937;text-transform:uppercase}
  .p-field{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px 16px;margin:16px 0;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb}
  .p-field>div{display:flex;justify-content:space-between;gap:8px;padding:4px 0}.p-field b{font-weight:600;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
  .p-parts-title{font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#1F2937;margin:20px 0 10px;padding-bottom:6px;border-bottom:2px solid #1F2937}
  .p-table{border-collapse:collapse;width:100%;margin:8px 0}.p-table th,.p-table td{border:1px solid #d1d5db;padding:7px 10px;text-align:left;font-size:12px}
  .p-table th{background:#1F2937;color:#fff;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.03em}
  .p-table tbody tr:nth-child(even){background:#f9fafb}.p-table .num{text-align:right;font-variant-numeric:tabular-nums}
  .p-totals{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:16px;padding:14px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb}
  .p-totals div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #e5e7eb}.p-totals div:last-child{border-bottom:none}
  .p-grand{font-weight:800;font-size:15px;color:#2563eb}.p-sign-area{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .p-sign{text-align:center}.p-sign span{display:inline-block;width:100%;min-width:180px;height:40px;border-bottom:1px dashed #1F2937;margin-top:24px}
  .p-sign small{display:block;margin-top:4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
  .p-note{margin-top:16px;font-size:11px;color:#6b7280;font-style:italic;text-align:center;padding:10px;background:#fef3c7;border-radius:6px;border-left:3px solid #f59e0b}
  @media print{body{margin:0;background:#fff}.print-out{box-shadow:none;width:100%;min-height:auto;padding:0;margin:0;border-radius:0;border-top:none}
  .p-header{border-radius:0}.p-header,.p-body{padding-left:10mm;padding-right:10mm}}`;
}

// --------------------- print job card ---------------------
function renderPrintCard() {
  const jc = $("printJc").value;
  if (!jc) { $("printCard").innerHTML = ""; return; }
  const j = state.jobs.find((x) => x.jc === jc);
  if (!j) { $("printCard").innerHTML = ""; return; }
  const parts = state.parts.filter((p) => p.jc === jc);
  const r = jobRow(j);
  const serviceLines = Array.isArray(j.service) ? j.service.join(" • ") : (j.service || "");
  const partRows = parts.length
    ? parts.map((p) => `<tr>
        <td>${p.name}</td>
        <td class="num">${p.qty}</td>
        <td class="num">${money(p.price)}</td>
        <td class="num">${money(p.qty * p.price)}</td>
        <td>${p.source}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center;color:#9ca3af;font-style:italic">No parts added for this job</td></tr>`;
  const partsTotalRow = parts.length
    ? `<tr style="background:#f3f4f6;font-weight:600">
        <td colspan="3" style="text-align:right">Parts Total</td>
        <td class="num">${money(r.totalParts)}</td><td></td>
      </tr>`
    : "";
  $("printCard").innerHTML = `<div class="print-out">
    <div class="p-header">
      <div class="name">${state.settings.company}</div>
      <div class="serv">${serviceLines || "Garage Management System"}</div>
    </div>
    <div class="p-body">
      <div class="p-title">Job Card / Performa</div>
      <div class="p-field">
        <div><b>JC.NO</b><span>${j.jc}</span></div>
        <div><b>Date</b><span>${j.date}</span></div>
        <div><b>Customer</b><span>${j.customer}</span></div>
        <div><b>Phone</b><span>${j.phone}</span></div>
        <div><b>Plate</b><span>${j.plate}</span></div>
        <div><b>VIN/Model</b><span>${j.vin}</span></div>
        <div><b>Odometer</b><span>${j.odometer || 0} Km</span></div>
        <div><b>Mechanic</b><span>${j.mechanic}</span></div>
        <div><b>Status</b><span>${j.status || "-"}</span></div>
      </div>
      <div class="p-parts-title">Parts Used</div>
      <table class="p-table">
        <thead><tr><th>Part Name</th><th>QTY</th><th>Unit Price</th><th>TOTAL</th><th>Source</th></tr></thead>
        <tbody>${partRows}${partsTotalRow}</tbody>
      </table>
      <div style="margin-top:12px"><b>Mechanic's Report:</b> ${j.report || "No report added"}</div>
      <div class="p-field">
        <div><b>Service Type</b><span>${serviceLines || "-"}</span></div>
      </div>
      <div class="p-totals">
        <div><span>Total Parts Cost</span><span>${money(r.totalParts)}</span></div>
        <div><span>Labor Cost</span><span>${money(j.labor || 0)}</span></div>
        <div><span>VAT ${Number(state.settings.vat) || 0}%</span><span>${money(r.vat)}</span></div>
        <div><span>Extra ${Number(state.settings.extra) || 0}%</span><span>${money(r.extra)}</span></div>
        <div class="p-grand"><span>GRAND TOTAL</span><span>${money(r.grand)}</span></div>
      </div>
      <div class="p-sign-area">
        <div class="p-sign"><span></span><small>Prepared By</small></div>
        <div class="p-sign"><span></span><small>Approved By</small></div>
      </div>
      <div class="p-note">I approve that ${state.settings.company} to carry out the above mentioned job description.</div>
    </div>
  </div>`;
}

$("btnPrint").addEventListener("click", () => {
  const jc = $("printJc").value;
  if (!jc) { alert("Select a JC.NO first."); return; }
  renderPrintCard();
  const printContent = $("printCard").innerHTML;
  if (!printContent) { alert("No data found for this JC.NO."); return; }
  const w = window.open("", "_blank", "width=900,height=700");
  if (w) {
    w.document.write(`<!DOCTYPE html><html><head><title>JobCard_${jc}</title>
      <style>${printCss()}
        @page{size:A4;margin:0}
        .p-table{border-collapse:collapse;width:100%}
        .p-table th,.p-table td{border:1px solid #d1d5db;padding:6px 10px;text-align:left}
        .p-table th{background:#1F2937;color:#fff}
        .num{text-align:right;font-variant-numeric:tabular-nums}
        body{font-family:system-ui,sans-serif;margin:0;padding:0;background:#fff}
      </style>
    </head><body>${printContent}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  } else {
    alert("Please allow popups for this site to print job cards.");
  }
});

["printJc", "partsJc"].forEach((id) => {
  $(id).addEventListener("input", () => {
    if (id === "partsJc") renderParts();
    else renderPrintCard();
  });
});

// --------------------- init ---------------------
function renderAll() {
  $("brandName").textContent = state.settings.company;
  $("fDate").value = today();
  renderMaster();
  renderParts();
  renderCash();
  renderClose();
  renderSettings();
  renderPrintCard();
}

function init() {
  load();
  if (isAuthenticated()) {
    hideLogin();
    renderAll();
  } else {
    showLogin();
  }
}

init();
