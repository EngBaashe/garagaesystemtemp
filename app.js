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
      state.settings.services = state.settings.services || DEFAULT_SERVICES;
    }
  } catch (e) { console.error(e); }
}

function saveAuth() { localStorage.setItem(AUTH_KEY, "1"); }
function clearAuth() { localStorage.removeItem(AUTH_KEY); }
function isAuthenticated() { return localStorage.getItem(AUTH_KEY) === "1"; }

const $ = (id) => document.getElementById(id);
const money = (n) => (n == null || isNaN(n) ? "0.00" : Number(n).toFixed(2));
const today = () => new Date().toISOString().slice(0, 10);

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
  $("sCompany").value = state.settings.company;
  $("sVat").value = state.settings.vat;
  $("sExtra").value = state.settings.extra;
  $("sServices").value = state.settings.services.join("\n");
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
  $("fService").innerHTML = state.settings.services
    .map((s) => `<option>${s}</option>`)
    .join("");
}
function renderMaster() {
  renderServiceSelect();
  const body = $("masterBody");
  body.innerHTML = state.jobs.length
    ? state.jobs
        .map((j) => {
          const r = jobRow(j);
          return `<tr>
            <td><b>${j.jc}</b></td><td>${j.date}</td><td>${j.customer}</td>
            <td>${j.company}</td><td>${j.phone}</td><td>${j.plate}</td>
            <td>${j.vin}</td><td>${j.odometer}</td><td>${j.service}</td>
            <td><span class="status ${(j.status || "").replace(/\s/g, "")}">${j.status || ""}</span></td>
            <td>${j.approval}</td><td>${j.mechanic}</td>
            <td class="num">${money(j.labor)}</td>
            <td class="num">${money(r.totalParts)}</td>
            <td class="num">${money(r.vat)}</td>
            <td class="num grand">${money(r.grand)}</td>
            <td><button class="btn danger small" data-del-jc="${j.jc}">✕</button></td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="17" class="empty">No jobs yet. Fill the form above and click ADD NEW JOB.</td></tr>`;
}

$("btnAdd").addEventListener("click", () => {
  const jc = $("fJc").value.trim();
  if (!jc) { alert("JC.NO is required."); return; }
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
      service: $("fService").value || job.service,
      status: $("fStatus").value,
      approval: $("fApproval").value || job.approval,
      mechanic: $("fMechanic").value || job.mechanic,
      labor: $("fLabor").value || job.labor,
      report: $("fReport").value || job.report,
    });
  } else {
    state.jobs.unshift({
      jc, date: $("fDate").value || today(),
      customer: $("fCustomer").value, company: $("fCompany").value,
      phone: $("fPhone").value, plate: $("fPlate").value, vin: $("fVin").value,
      odometer: $("fOdometer").value, service: $("fService").value,
      status: $("fStatus").value, approval: $("fApproval").value,
      mechanic: $("fMechanic").value, labor: $("fLabor").value, report: $("fReport").value,
    });
  }
  save();
  renderAll();
  $("fJc").value = "";
  ["fCustomer","fPhone","fVin","fPlate","fMechanic","fLabor","fReport","fCompany","fOdometer","fApproval"]
    .forEach((id) => { $(id).value = ""; });
  $("fService").value = (state.settings.services && state.settings.services[0]) || "";
  $("fStatus").value = "Diagnosis";
  $("fDate").value = today();
  $("fJc").focus();
});

document.addEventListener("click", (e) => {
  const jc = e.target.dataset && e.target.dataset.delJc;
  if (jc) {
    if (!confirm(`Delete job ${jc} and its parts?`)) return;
    state.jobs = state.jobs.filter((j) => j.jc !== jc);
    state.parts = state.parts.filter((p) => p.jc !== jc);
    save();
    renderAll();
  }
});

// --------------------- parts ---------------------
function fillJcSelects() {
  const opts = state.jobs.map((j) => `<option value="${j.jc}">${j.jc} — ${j.customer || "no customer"}</option>`).join("");
  $("partsJc").innerHTML = opts || '<option value="">No jobs yet</option>';
  $("printJc").innerHTML = opts || '<option value="">No jobs yet</option>';
}
function renderParts() {
  fillJcSelects();
  const jc = $("partsJc").value;
  const rows = state.parts.filter((p) => p.jc === jc);
  $("partsBody").innerHTML = rows.length
    ? rows.map((p, i) => `<tr>
        <td><b>${p.jc}</b></td><td>${p.name}</td><td class="num">${p.qty}</td>
        <td class="num">${money(p.price)}</td><td>${p.source}</td><td class="num">${p.version}</td>
        <td class="num grand">${money(p.qty * p.price)}</td>
        <td><button class="btn danger small" data-del-part="${i}">✕</button></td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty">No parts for JC ${jc || ""}. Add parts below.</td></tr>`;
}

$("btnAddPart").addEventListener("click", () => {
  const jc = $("partsJc").value;
  const name = $("pName").value.trim();
  if (!jc || !name) { alert("Select a JC.NO and enter a part name."); return; }
  state.parts.push({
    jc, name,
    qty: Number($("pQty").value) || 1,
    price: Number($("pPrice").value) || 0,
    source: $("pSource").value,
    version: Number($("pVersion").value) || 1,
  });
  $("pName").value = ""; $("pPrice").value = "";
  save();
  renderParts();
  renderMaster();
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
          <td><button class="btn danger small" data-del-cash="${i}">✕</button></td>
        </tr>`)
        .reverse()
        .join("")
    : `<tr><td colspan="7" class="empty">No cash transactions logged.</td></tr>`;
}
$("btnAddCash").addEventListener("click", () => {
  const amount = Number($("cAmount").value);
  if (!amount || !$("cEmployee").value.trim()) { alert("Amount and Employee are required."); return; }
  state.cash.push({
    date: $("cDate").value || today(),
    shift: $("cShift").value,
    employee: $("cEmployee").value.trim(),
    type: $("cType").value,
    amount,
    description: $("cDesc").value.trim(),
  });
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
    ? state.closes.map((c) => `<tr>
        <td>${c.date}</td><td>${c.shift}</td><td>${c.employee}</td>
        <td class="num">${money(c.opening)}</td><td class="num">${money(c.totalIn)}</td>
        <td class="num">${money(c.totalOut)}</td><td class="num grand">${money(c.balance)}</td>
        <td>${c.closedBy}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty">No shift closings yet.</td></tr>`;
}
$("btnCloseShift").addEventListener("click", () => {
  const shift = $("closeShift").value;
  const emp = $("closeEmployee").value.trim();
  if (!emp) { alert("Employee name required."); return; }
  const inAmt = state.cash.filter((c) => c.shift === shift && c.type === "Cash In").reduce((s, c) => s + c.amount, 0);
  const outAmt = state.cash.filter((c) => c.shift === shift && c.type === "Cash Out").reduce((s, c) => s + c.amount, 0);
  const opening = Number($("closeOpening").value) || 0;
  const balance = opening + inAmt - outAmt;
  state.closes.unshift({ date: today(), shift, employee: emp, opening, totalIn: inAmt, totalOut: outAmt, balance, closedBy: emp });
  save();
  renderClose();
  window.printCloseHandover(state.closes[0]);
});

function printCloseHandover(c) {
  const html = `<div class="print-out">
    <div class="p-head"><div class="name">${state.settings.company}</div>
      <div class="serv">Shift Handover — ${c.date}</div></div>
    <div class="p-title">SHIFT CLOSE REPORT</div>
    <div class="p-field">
      <b>Shift:</b><span>${c.shift}</span>
      <b>Employee:</b><span>${c.employee}</span>
      <b>Opening Cash:</b><span>${money(c.opening)}</span>
      <b>Total Cash In:</b><span>${money(c.totalIn)}</span>
      <b>Total Cash Out:</b><span>${money(c.totalOut)}</span>
      <b>Remaining Balance:</b><span>${money(c.balance)}</span>
      <b>Closed By:</b><span>${c.closedBy}</span>
    </div>
    <div class="p-sign"><span></span><br/><small>Signature</small></div>
  </div>`;
  $("printCard").innerHTML = html;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(`<html><head><title>Shift Close</title><style>${printCss()}</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }
}

function printCss() {
  return `.print-out{width:210mm;min-height:280mm;margin:0 auto;padding:14mm;font-size:13px;font-family:system-ui,sans-serif;color:#1A1A1A;background:#fff;border-radius:10px;border-top:4px solid #2563eb}
  .p-head .name{font-size:22px;font-weight:800;color:#1F2937;letter-spacing:.3px}.p-head .serv{font-size:11px;font-style:italic;color:#4b5563;margin-top:4px}
  .p-title{text-align:center;font-size:17px;font-weight:700;margin:16px 0;letter-spacing:1px;color:#1F2937}.p-field{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px 14px;margin-top:10px}
  .p-field b{font-weight:600;color:#1F2937}.p-sign{margin-top:30px}.p-sign span{display:inline-block;min-width:220px;height:24px;border-bottom:1px dashed #1F2937}
  .p-table{border-collapse:collapse;width:100%;margin:8px 0}.p-table th,.p-table td{border:1px solid #1F2937;padding:6px 10px;text-align:left}
  .p-table th{background:#1F2937;color:#fff}.p-totals{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin-top:14px}
  .p-totals div{display:flex;justify-content:space-between;padding:4px 0}.p-grand{font-weight:800;font-size:15px;color:#2563eb}
  @media print{body{margin:0}.print-out{box-shadow:none;width:100%;min-height:auto;padding:10mm}}`;
}

// --------------------- print job card ---------------------
function renderPrintCard() {
  const jc = $("printJc").value;
  if (!jc) { $("printCard").innerHTML = ""; return; }
  const j = state.jobs.find((x) => x.jc === jc);
  if (!j) { $("printCard").innerHTML = ""; return; }
  const parts = state.parts.filter((p) => p.jc === jc);
  const r = jobRow(j);
  const partRows = parts.length
    ? parts.map((p) => `<tr><td>${p.name}</td><td class="num">${p.qty}</td><td class="num">${money(p.price)}</td><td class="num">${money(p.qty * p.price)}</td><td>${p.source} (v${p.version})</td></tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center">No parts listed</td></tr>`;
  $("printCard").innerHTML = `<div class="print-out">
    <div class="p-head">
      <div class="name">${state.settings.company}</div>
      <div class="serv">Diagnostic • Service • Major Repairs • Car Wash • Genuine Parts • Tires • A/C</div>
    </div>
    <div class="p-title">JOB CARD / PERFORMA</div>
    <div class="p-field">
      <b>JC.NO:</b><span>${j.jc}</span><b>Date:</b><span>${j.date}</span>
      <b>Customer:</b><span>${j.customer}</span><b>Phone:</b><span>${j.phone}</span>
      <b>Plate:</b><span>${j.plate}</span><b>VIN:</b><span>${j.vin}</span>
      <b>Service Type:</b><span>${j.service}</span><b>Odometer:</b><span>${j.odometer} Km</span>
      <b>Mechanic:</b><span>${j.mechanic}</span><b>Status:</b><span>${j.status}</span>
    </div>
    <div class="p-parts-title">Parts Used:</div>
    <table class="p-table">
      <thead><tr><th>Part Name</th><th>QTY</th><th>Unit Price</th><th>TOTAL</th><th>Source</th></tr></thead>
      <tbody>${partRows}</tbody>
    </table>
    <div style="margin-top:8px"><b>Mechanic's Report:</b> ${j.report || ""}</div>
    <div class="p-totals">
      <div><span>Total Parts Cost:</span><span>${money(r.totalParts)}</span></div>
      <div><span>Total Labor:</span><span>${money(j.labor)}</span></div>
      <div><span>VAT ${state.settings.vat}%:</span><span>${money(r.vat)}</span></div>
      <div><span>Extra ${state.settings.extra}%:</span><span>${money(r.extra)}</span></div>
      <div class="p-grand"><span>GRAND TOTAL:</span><span>${money(r.grand)}</span></div>
    </div>
    <div class="p-field" style="margin-top:24px">
      <b>Approved By:</b><span class="p-sign" style="display:inline-block"><span></span></span>
    </div>
    <div class="p-note">I approve that ${state.settings.company} to carry out above mentioned job description.</div>
  </div>`;
}

$("btnPrint").addEventListener("click", () => {
  const jc = $("printJc").value;
  if (!jc) { alert("Select a JC.NO first."); return; }
  renderPrintCard();
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(`<html><head><title>JobCard_${jc}</title><style>${printCss()}
      table.p-table{border-collapse:collapse;width:100%}.p-table th,.p-table td{border:1px solid #1F2937;padding:4px 8px;text-align:left}
      .p-table th{background:#1F2937;color:#fff}.num{text-align:right}
    </style></head><body>${$("printCard").innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }
});

["printJc", "partsJc"].forEach((id) => {
  $(id).addEventListener("change", () => {
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
