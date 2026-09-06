/* ===================================================
   ỨNG DỤNG QUẢN LÝ THÁP TÀI SẢN (FINANCIAL TOWER APP - v7.6 PRO)
   =================================================== */

const KEY = "thap-tai-san-v7.6";

const LAYERS_CONFIG = [
  { id: 1, name: "1. Nền tảng năng lực cá nhân", desc: "Sức khỏe, kiến thức, kỹ năng, mối quan hệ", targetPct: 0, minPct: 0, maxPct: 0 },
  { id: 2, name: "2. Phải có", desc: "Quỹ dự phòng, tiền mặt, vàng", targetPct: 12.5, minPct: 10, maxPct: 15 },
  { id: 3, name: "3. Thu nhập", desc: "BĐS cho thuê, cổ tức, trái phiếu, tiết kiệm", targetPct: 27.5, minPct: 20, maxPct: 35 },
  { id: 4, name: "4. Tăng trưởng", desc: "Cổ phiếu, ETF, BĐS tăng giá", targetPct: 52.5, minPct: 45, maxPct: 60 },
  { id: 5, name: "5. Đầu cơ", desc: "Crypto, BĐS lướt sóng, cơ hội rủi ro cao", targetPct: 7.5, minPct: 0, maxPct: 10 }
];

let S = JSON.parse(localStorage.getItem(KEY) || "null") || {
  assets: [],
  income: 0, expense: 0, monthlyInvest: 0, bonus: 0, annualReturn: 10,
  loans: [],
  goals: [],
  history: [
    { date: "2026-09-06", netAssets: 0, grossIncome: 0, totalExpense: 0, interestPaid: 0 }
  ],
  tab: "dashboard", assetPeriod: "1Y", assetStartYear: "2024", cashPeriod: "1Y", cashStartYear: "2024", lastCalc: new Date().toISOString()
};

function save(){ S.lastCalc = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(S)); }

function money(n){ return new Intl.NumberFormat("vi-VN",{maximumFractionDigits:0}).format(Math.round(n||0)) + " đ"; }
function pct(n){ return (n||0).toFixed(1) + "%"; }
function datef(x){ return x ? new Date(x + "T00:00:00").toLocaleDateString("vi-VN") : ""; }

function formatNumberInput(val) {
  if (val === undefined || val === null || val === "") return "";
  let str = val.toString().replace(/\./g, "");
  let parts = str.split(",");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
}

function parseNumberInput(val) {
  if (!val) return 0;
  let clean = val.toString().replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function bindMoneyInput(inputEl) {
  if(!inputEl) return;
  inputEl.addEventListener("input", function(e) {
    let cursor = e.target.selectionStart;
    let oldLen = e.target.value.length;
    let raw = e.target.value.replace(/[^0-9,]/g, "");
    let formatted = formatNumberInput(raw);
    e.target.value = formatted;
    let newLen = formatted.length;
    e.target.setSelectionRange(cursor + (newLen - oldLen), cursor + (newLen - oldLen));
  });
}

function assetIncome(a){
  if (a.type === "rental") return Math.max(0, (+a.rent||0)*(1 - (+a.vacancy||0)/100) - (+a.cost||0));
  if (["stock", "bond", "deposit"].includes(a.type)) return (+a.value||0) * (+a.rate||0) / 100 / 12;
  return +a.cashflow || 0;
}

function totals(){
  const assets = S.assets.reduce((a, x) => a + (+x.value || 0), 0);
  const debt = S.loans.reduce((a, x) => a + (+x.balance || 0), 0) + S.assets.reduce((a, x) => a + (+x.debt || 0), 0);
  const passive = S.assets.reduce((a, x) => a + assetIncome(x), 0);
  
  const bankLoanInterest = S.loans.reduce((a, x) => a + (+x.balance || 0) * (+x.rate || 0) / 100 / 12, 0);
  const bankLoanPrincipal = S.loans.reduce((a, x) => a + (+x.principal || 0), 0);
  const assetLoanInterest = S.assets.reduce((a, x) => a + (+x.debt || 0) * (+x.loanRate || 0) / 100 / 12, 0);
  const assetLoanPrincipal = S.assets.reduce((a, x) => a + (+x.principal || 0), 0);
  
  const totalLoanInterest = bankLoanInterest + assetLoanInterest;
  const totalPrincipal = bankLoanPrincipal + assetLoanPrincipal;
  const totalDebtPaymentMonthly = totalLoanInterest + totalPrincipal;
  
  const totalIncomeMonthly = +S.income + passive;
  const totalLivingExpense = +S.expense;
  const totalExpenseMonthly = totalLivingExpense + totalDebtPaymentMonthly;
  
  const surplus = totalIncomeMonthly - totalExpenseMonthly;
  const debtToIncomeRatio = totalIncomeMonthly > 0 ? (totalLoanInterest / totalIncomeMonthly) * 100 : 0;
  const debtAndExpenseToIncomeRatio = totalIncomeMonthly > 0 ? ((totalLoanInterest + totalExpenseMonthly) / totalIncomeMonthly) * 100 : 0;

  return {
    assets, debt, net: assets - debt, passive,
    totalLoanInterest, totalPrincipal, totalDebtPaymentMonthly,
    totalIncomeMonthly, totalLivingExpense, totalExpenseMonthly, surplus,
    debtToIncomeRatio, debtAndExpenseToIncomeRatio
  };
}

function getExactRecordFor(dateStr) {
  let targetTime = new Date(dateStr + "T00:00:00").getTime();
  let sorted = [...S.history].sort((a,b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime());
  
  let match = null;
  for (let item of sorted) {
    if (new Date(item.date + "T00:00:00").getTime() <= targetTime) {
      match = item;
    } else break;
  }
  return match || { netAssets: 0, grossIncome: 0, totalExpense: 0, interestPaid: 0 };
}

function getFilteredMilestones(periodKey, startYear) {
  let now = new Date();
  let currentYear = now.getFullYear();
  let sYear = parseInt(startYear) || (currentYear - 2);
  let milestones = [];

  if (periodKey === "3M") {
    for (let y = sYear; y <= currentYear; y++) {
      milestones.push(
        { label: `Q1/${y}`, date: `${y}-03-31` },
        { label: `Q2/${y}`, date: `${y}-06-30` },
        { label: `Q3/${y}`, date: `${y}-09-30` },
        { label: `Q4/${y}`, date: `${y}-12-31` }
      );
    }
  } else if (periodKey === "6M") {
    for (let y = sYear; y <= currentYear; y++) {
      milestones.push(
        { label: `6Th1/${y}`, date: `${y}-06-30` },
        { label: `6Th2/${y}`, date: `${y}-12-31` }
      );
    }
  } else if (periodKey === "1Y") {
    for (let y = sYear; y <= currentYear; y++) {
      milestones.push({ label: `${y}`, date: `${y}-12-31` });
    }
  } else if (periodKey === "3Y") {
    for (let y = sYear; y <= currentYear; y += 3) {
      milestones.push({ label: `${y}-${y+2}`, date: `${y+2}-12-31` });
    }
  } else if (periodKey === "5Y") {
    for (let y = sYear; y <= currentYear; y += 5) {
      milestones.push({ label: `${y}-${y+4}`, date: `${y+4}-12-31` });
    }
  }
  milestones.push({ label: "Hiện tại", date: now.toISOString().slice(0,10) });
  
  let uniqueMap = new Map();
  milestones.forEach(m => uniqueMap.set(m.date, m));
  return Array.from(uniqueMap.values()).sort((a,b) => new Date(a.date) - new Date(b.date));
}

function nav(){
  let ns = [["dashboard", "Tổng quan"], ["tower", "Tháp tài sản"], ["assets", "Tài sản"], ["cash", "Dòng tiền"], ["history", "Nhập thực tế"]];
  document.getElementById("nav").innerHTML = ns.map(([id, t]) => `<button class="${S.tab===id?"active":""}" onclick="S.tab='${id}';save();render()">${t}</button>`).join("");
}

function render(){ nav(); ({dashboard, tower, assets, cash, history}[S.tab] || dashboard)(); }

function dashboard(){
  const t = totals();
  let totalVal = Math.max(1, t.assets);

  const l1 = S.assets.filter(a => +a.layer === 1).reduce((s, a) => s + (+a.value || 0), 0);
  const l2 = S.assets.filter(a => +a.layer === 2).reduce((s, a) => s + (+a.value || 0), 0);
  const l3 = S.assets.filter(a => +a.layer === 3).reduce((s, a) => s + (+a.value || 0), 0);
  const l4 = S.assets.filter(a => +a.layer === 4).reduce((s, a) => s + (+a.value || 0), 0);
  const l5 = S.assets.filter(a => +a.layer === 5).reduce((s, a) => s + (+a.value || 0), 0);

  const p1 = (l1 / totalVal) * 100;
  const p2 = (l2 / totalVal) * 100;
  const p3 = (l3 / totalVal) * 100;
  const p4 = (l4 / totalVal) * 100;
  const p5 = (l5 / totalVal) * 100;

  // Đánh giá tỷ lệ nợ/thu và (nợ+chi)/thu
  let ratio1 = t.debtToIncomeRatio;
  let eval1Text = ratio1 <= 30 ? "Tốt" : (ratio1 <= 40 ? "Cảnh báo" : "Không nên");
  let eval1Class = ratio1 <= 30 ? "text-good" : (ratio1 <= 40 ? "text-warn" : "text-bad");

  let ratio2 = t.debtAndExpenseToIncomeRatio;
  let eval2Text = ratio2 <= 50 ? "Tốt" : (ratio2 <= 70 ? "Cảnh báo" : "Không nên");
  let eval2Class = ratio2 <= 50 ? "text-good" : (ratio2 <= 70 ? "text-warn" : "text-bad");

  let currentAssetPeriod = S.assetPeriod || "1Y";
  let assetStartYear = S.assetStartYear || "2024";
  let currentCashPeriod = S.cashPeriod || "1Y";
  let cashStartYear = S.cashStartYear || "2024";
  let yearsList = ["2022", "2023", "2024", "2025", "2026"];

  document.getElementById("app").innerHTML = `
    <style>
      .pyramid-container { width: 100%; max-width: 440px; margin: 15px auto; }
      .pyramid-svg { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.1)); }
      .pyramid-layer { transition: all 0.2s ease; cursor: pointer; }
      .pyramid-layer:hover { opacity: 0.93; transform: scale(1.008); transform-origin: center; }
      
      .chart-toolbar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; margin-bottom: 6px; }
      .period-selector { display: flex; gap: 2px; background: #f1f5f9; padding: 2px; border-radius: 6px; }
      .period-btn { border: 0; background: transparent; color: #64748b; font-size: 9px; padding: 3px 5px; border-radius: 4px; font-weight: 700; cursor: pointer; }
      .period-btn.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
      .year-select { background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 10px; font-weight: 700; color: #334155; padding: 2px 4px; border-radius: 6px; cursor: pointer; }

      .chart-legend { display: flex; gap: 12px; justify-content: center; margin-top: 10px; font-size: 11px; font-weight: 600; flex-wrap: wrap; }
      .legend-item { display: flex; align-items: center; gap: 5px; }
      .legend-color { width: 12px; height: 3px; border-radius: 2px; }
      .legend-bar-color { width: 10px; height: 10px; border-radius: 2px; }
      canvas { width: 100% !important; height: 210px !important; display: block; }
      .no-data-msg { text-align: center; padding: 60px 0; color: #94a3b8; font-size: 13px; font-weight: 600; }
    </style>

    <div class="card hero">
      <div class="small">TÀI SẢN RÒNG THỰC TẾ</div>
      <div style="font-size:26px;font-weight:900;margin:4px 0 8px">${money(t.net)}</div>
      
      <div class="grid2" style="margin-bottom:8px">
        <div class="metric dark"><div class="label">Tổng tài sản</div><div class="v">${money(t.assets)}</div></div>
        <div class="metric dark"><div class="label">Tổng nợ</div><div class="v">${money(t.debt)}</div></div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; text-align:center; margin-bottom: 8px;">
        <div><div style="font-size:9px;opacity:0.8">TỔNG THU</div><div style="font-size:11px;font-weight:700;color:#34d399">${money(t.totalIncomeMonthly)}</div></div>
        <div><div style="font-size:9px;opacity:0.8">TỔNG CHI</div><div style="font-size:11px;font-weight:700;color:#f87171">${money(t.totalExpenseMonthly)}</div></div>
        <div><div style="font-size:9px;opacity:0.8">LÃI VAY</div><div style="font-size:11px;font-weight:700;color:#fbbf24">${money(t.totalLoanInterest)}</div></div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px; font-size: 10px; opacity: 0.95; display: flex; flex-direction: column; gap: 3px;">
        <div style="display:flex; justify-content:space-between;">
          <span>• Nợ / Thu (${pct(ratio1)}):</span>
          <b class="${eval1Class}">${eval1Text}</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>• (Nợ + Chi) / Thu (${pct(ratio2)}):</span>
          <b class="${eval2Class}">${eval2Text}</b>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead" style="align-items:flex-start">
        <div>
          <h3>Tài sản Ròng Thực tế</h3>
          <div class="small muted">Biểu đồ Cột & Đường xu hướng</div>
        </div>
        <div class="chart-toolbar">
          <select class="year-select" onchange="setAssetStartYear(this.value)">
            ${yearsList.map(y => `<option value="${y}" ${assetStartYear===y?'selected':''}>Từ ${y}</option>`).join('')}
          </select>
          <div class="period-selector">
            <button class="period-btn ${currentAssetPeriod==='3M'?'active':''}" onclick="setAssetPeriod('3M')">Quý</button>
            <button class="period-btn ${currentAssetPeriod==='6M'?'active':''}" onclick="setAssetPeriod('6M')">6Th</button>
            <button class="period-btn ${currentAssetPeriod==='1Y'?'active':''}" onclick="setAssetPeriod('1Y')">1N</button>
            <button class="period-btn ${currentAssetPeriod==='3Y'?'active':''}" onclick="setAssetPeriod('3Y')">3N</button>
            <button class="period-btn ${currentAssetPeriod==='5Y'?'active':''}" onclick="setAssetPeriod('5Y')">5N</button>
          </div>
        </div>
      </div>
      <div id="assetChartContainer"><canvas id="assetBarChart"></canvas></div>
      <div class="chart-legend" id="assetLegend">
        <div class="legend-item"><div class="legend-bar-color" style="background:#3b82f6"></div><span style="color:#1e40af">Tài sản ròng (Tỷ VNĐ) & Xu hướng</span></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead" style="align-items:flex-start">
        <div>
          <h3>Dòng tiền Thực tế</h3>
          <div class="small muted">Biểu đồ Dây Thu - Chi - Lãi vay</div>
        </div>
        <div class="chart-toolbar">
          <select class="year-select" onchange="setCashStartYear(this.value)">
            ${yearsList.map(y => `<option value="${y}" ${cashStartYear===y?'selected':''}>Từ ${y}</option>`).join('')}
          </select>
          <div class="period-selector">
            <button class="period-btn ${currentCashPeriod==='3M'?'active':''}" onclick="setCashPeriod('3M')">Quý</button>
            <button class="period-btn ${currentCashPeriod==='6M'?'active':''}" onclick="setCashPeriod('6M')">6Th</button>
            <button class="period-btn ${currentCashPeriod==='1Y'?'active':''}" onclick="setCashPeriod('1Y')">1N</button>
            <button class="period-btn ${currentCashPeriod==='3Y'?'active':''}" onclick="setCashPeriod('3Y')">3N</button>
            <button class="period-btn ${currentCashPeriod==='5Y'?'active':''}" onclick="setCashPeriod('5Y')">5N</button>
          </div>
        </div>
      </div>
      <div id="cashChartContainer"><canvas id="cashLineChart"></canvas></div>
      <div class="chart-legend" id="cashLegend">
        <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span style="color:#065f46">🟢 Tổng thu</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span style="color:#991b1b">🔴 Tổng chi</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#f59e0b"></div><span style="color:#92400e">🟡 Lãi vay</span></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead">
        <h3>Tỷ lệ Tháp Tài Sản</h3>
        <span class="small muted">Mô hình kim tự tháp chuẩn</span>
      </div>

      <div class="pyramid-container">
        <svg viewBox="0 0 400 305" class="pyramid-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f87171"/><stop offset="100%" stop-color="#dc2626"/></linearGradient>
            <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
          </defs>

          <!-- Layer 5 -->
          <g class="pyramid-layer">
            <polygon points="175,10 225,10 248,55 152,55" fill="url(#g5)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <text x="200" y="27" fill="#ffffff" font-size="8.5" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">5. ĐẦU CƠ</text>
            <text x="200" y="41" fill="rgba(255,255,255,0.95)" font-size="7.5" font-weight="700" text-anchor="middle" font-family="-apple-system, sans-serif">${pct(p5)} (Max 10%)</text>
          </g>

          <!-- Layer 4 -->
          <g class="pyramid-layer">
            <polygon points="149,59 251,59 289,114 111,114" fill="url(#g4)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <text x="200" y="80" fill="#ffffff" font-size="9.5" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">4. TĂNG TRƯỞNG</text>
            <text x="200" y="96" fill="rgba(255,255,255,0.95)" font-size="8.5" font-weight="700" text-anchor="middle" font-family="-apple-system, sans-serif">${pct(p4)} (45-60%)</text>
          </g>

          <!-- Layer 3 -->
          <g class="pyramid-layer">
            <polygon points="108,118 292,118 331,173 69,173" fill="url(#g3)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <text x="200" y="139" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">3. THU NHẬP</text>
            <text x="200" y="155" fill="rgba(255,255,255,0.95)" font-size="9" font-weight="700" text-anchor="middle" font-family="-apple-system, sans-serif">${pct(p3)} (20-35%)</text>
          </g>

          <!-- Layer 2 -->
          <g class="pyramid-layer">
            <polygon points="66,177 334,177 373,232 27,232" fill="url(#g2)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <text x="200" y="198" fill="#ffffff" font-size="10.5" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">2. PHẢI CÓ</text>
            <text x="200" y="214" fill="rgba(255,255,255,0.95)" font-size="9" font-weight="700" text-anchor="middle" font-family="-apple-system, sans-serif">${pct(p2)} (10-15%)</text>
          </g>

          <!-- Layer 1 -->
          <g class="pyramid-layer">
            <polygon points="24,236 376,236 400,296 0,296" fill="url(#g1)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <text x="200" y="259" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle" font-family="-apple-system, sans-serif">1. NỀN TẢNG NĂNG LỰC CÁ NHÂN</text>
            <text x="200" y="276" fill="rgba(255,255,255,0.95)" font-size="8" font-weight="600" text-anchor="middle" font-family="-apple-system, sans-serif">Sức khỏe • Kiến thức • Kỹ năng • Mối quan hệ</text>
          </g>
        </svg>
      </div>

      <div class="tower-analysis">
        ${LAYERS_CONFIG.slice(1).map(cfg => {
          let layerVal = S.assets.filter(a => +a.layer === cfg.id).reduce((s, a) => s + (+a.value || 0), 0);
          let realPct = (layerVal / totalVal) * 100;
          let statusClass = "good";
          let diffText = "Đạt chuẩn";
          if (realPct < cfg.minPct) { statusClass = "warn"; diffText = `Thiếu (Cần ${cfg.minPct}%)`; }
          else if (cfg.maxPct > 0 && realPct > cfg.maxPct) { statusClass = "bad"; diffText = `Thừa (Tối đa ${cfg.maxPct}%)`; }

          return `
            <div class="tower-row">
              <div class="tower-row-header">
                <span class="layer-title">${cfg.name}</span>
                <span class="layer-stat"><b>${pct(realPct)}</b> <small>(${cfg.minPct}-${cfg.maxPct}%)</small></span>
              </div>
              <div class="bar"><i class="${statusClass}" style="width:${Math.min(100, realPct)}%"></i></div>
              <div class="row-sub small">
                <span>Giá trị: ${money(layerVal)}</span>
                <span class="${statusClass === 'good' ? 'text-good' : statusClass === 'warn' ? 'text-warn' : 'text-bad'}">${diffText}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  drawAssetBarChart("assetBarChart", currentAssetPeriod, assetStartYear);
  drawCashLineChart("cashLineChart", currentCashPeriod, cashStartYear);
}

function setAssetPeriod(p) { S.assetPeriod = p; save(); render(); }
function setAssetStartYear(y) { S.assetStartYear = y; save(); render(); }
function setCashPeriod(p) { S.cashPeriod = p; save(); render(); }
function setCashStartYear(y) { S.cashStartYear = y; save(); render(); }

function drawAssetBarChart(id, periodKey = "1Y", startYear = "2024") {
  let canvas = document.getElementById(id);
  if (!canvas) return;

  let milestones = getFilteredMilestones(periodKey, startYear);
  let pts = milestones.map(m => {
    let rec = getExactRecordFor(m.date);
    return { label: m.label, val: rec ? rec.netAssets / 1e9 : null, date: m.date };
  });

  let validPts = pts.filter(p => p.val !== null);
  let container = document.getElementById("assetChartContainer");
  let legend = document.getElementById("assetLegend");

  if (validPts.length === 0) {
    if (container) container.innerHTML = `<div class="no-data-msg">Chưa có thông tin nhập cho khoảng thời gian này</div>`;
    if (legend) legend.style.display = "none";
    return;
  } else {
    if (legend) legend.style.display = "flex";
  }

  let d = window.devicePixelRatio || 1;
  let w = canvas.clientWidth || 300;
  let h = 210;
  canvas.width = w * d;
  canvas.height = h * d;
  let ctx = canvas.getContext("2d");
  ctx.scale(d, d);

  let pLeft = 40, pRight = 15, pTop = 25, pBottom = 25;
  let plotW = w - pLeft - pRight;
  let plotH = h - pTop - pBottom;

  let maxVal = Math.max(...validPts.map(p => p.val), 0.1);
  let minVal = Math.min(0, ...validPts.map(p => p.val));

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    let y = pTop + (plotH / 4) * i;
    let labelVal = maxVal - (maxVal / 4) * i;
    ctx.fillStyle = "#64748b";
    ctx.font = "8.5px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(labelVal.toFixed(1) + "t", pLeft - 4, y + 3);
    ctx.beginPath(); ctx.moveTo(pLeft, y); ctx.lineTo(w - pRight, y); ctx.stroke();
  }

  let steps = pts.length;
  let barWidth = Math.max(4, (plotW / steps) * 0.4);
  let coords = [];

  pts.forEach((p, i) => {
    let x = pLeft + (i + 0.5) * (plotW / steps);

    if (p.val !== null) {
      let yVal = pTop + plotH - ((p.val - minVal) / (maxVal - minVal || 1)) * plotH;
      let yZero = pTop + plotH - ((0 - minVal) / (maxVal - minVal || 1)) * plotH;
      
      let barH = Math.abs(yVal - yZero);
      let barY = p.val >= 0 ? yVal : yZero;

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x - barWidth / 2, barY, barWidth, barH);
      coords.push({ x, y: yVal });

      ctx.font = "8.5px -apple-system, sans-serif";
      ctx.fillStyle = "#1e40af";
      ctx.textAlign = "center";
      ctx.fillText(p.val.toFixed(2), x, barY - 4);
    }

    ctx.fillStyle = "#64748b";
    ctx.font = "8px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.label, x, h - 6);
  });

  if (coords.length > 1) {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    coords.forEach((c, idx) => {
      if (idx === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();

    coords.forEach(c => {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

function drawCashLineChart(id, periodKey = "1Y", startYear = "2024") {
  let canvas = document.getElementById(id);
  if (!canvas) return;

  let milestones = getFilteredMilestones(periodKey, startYear);
  let ptsData = milestones.map(m => {
    let rec = getExactRecordFor(m.date);
    return rec ? {
      label: m.label,
      inc: rec.grossIncome / 1e6,
      exp: rec.totalExpense / 1e6,
      interest: rec.interestPaid / 1e6
    } : { label: m.label, inc: 0, exp: 0, interest: 0 };
  });

  let validPts = ptsData.filter(p => p.inc !== null);
  let container = document.getElementById("cashChartContainer");
  let legend = document.getElementById("cashLegend");

  if (validPts.length === 0) {
    if (container) container.innerHTML = `<div class="no-data-msg">Chưa có thông tin nhập cho khoảng thời gian này</div>`;
    if (legend) legend.style.display = "none";
    return;
  } else {
    if (legend) legend.style.display = "flex";
  }

  let d = window.devicePixelRatio || 1;
  let w = canvas.clientWidth || 300;
  let h = 210;
  canvas.width = w * d;
  canvas.height = h * d;
  let ctx = canvas.getContext("2d");
  ctx.scale(d, d);

  let pLeft = 40, pRight = 15, pTop = 20, pBottom = 25;
  let plotW = w - pLeft - pRight;
  let plotH = h - pTop - pBottom;

  let maxVal = Math.max(...validPts.map(p => Math.max(p.inc, p.exp, p.interest)), 1);
  let steps = milestones.length - 1;

  const getY = (v) => pTop + plotH - (v / maxVal) * plotH;

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    let y = pTop + (plotH / 4) * i;
    let labelVal = maxVal - (maxVal / 4) * i;
    ctx.fillStyle = "#64748b";
    ctx.font = "8.5px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(labelVal.toFixed(0) + "M", pLeft - 4, y + 3);
    ctx.beginPath(); ctx.moveTo(pLeft, y); ctx.lineTo(w - pRight, y); ctx.stroke();
  }

  const drawLine = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    let drawing = false;
    ctx.beginPath();
    ptsData.forEach((p, i) => {
      let x = pLeft + (steps > 0 ? i * (plotW / steps) : plotW / 2);
      let y = getY(p[key]);
      if (!drawing) { ctx.moveTo(x, y); drawing = true; }
      else { ctx.lineTo(x, y); }
    });
    ctx.stroke();

    ptsData.forEach((p, i) => {
      let x = pLeft + (steps > 0 ? i * (plotW / steps) : plotW / 2);
      let y = getY(p[key]);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    });
  };

  drawLine("inc", "#10b981");
  drawLine("exp", "#ef4444");
  drawLine("interest", "#f59e0b");

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  milestones.forEach((m, i) => {
    let x = pLeft + (steps > 0 ? i * (plotW / steps) : plotW / 2);
    ctx.fillText(m.label, x, h - 6);
  });
}

function history(){
  let h = `
    <div class="card">
      <div class="sectionhead">
        <div>
          <h2>Nhật ký Thực tế</h2>
          <p class="small muted">Nhập số liệu thực tế tại các mốc ngày báo cáo.</p>
        </div>
        <button onclick="historyForm()">+ Cập nhật mốc mới</button>
      </div>
    </div>
    <div class="card">
      <h3>Lịch sử đã ghi nhận</h3>
      <div class="asset-list">
        ${S.history.length === 0 ? `<div class="small muted">Chưa có dữ liệu lịch sử.</div>` : ''}
        ${[...S.history].sort((a,b) => new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00")).map((item) => `
          <div class="item-compact" style="flex-direction:column;align-items:flex-start;gap:4px">
            <div style="display:flex;justify-content:space-between;width:100%">
              <b>Mốc: ${datef(item.date)}</b>
              <button class="danger small-btn" onclick="delHistory('${item.date}')">Xóa</button>
            </div>
            <div class="small muted">
              • TS Ròng: <b style="color:#2563eb">${money(item.netAssets)}</b><br>
              • Thu nhập: <span style="color:#059669">${money(item.grossIncome)}</span> 
              • Tổng chi: <span style="color:#dc2626">${money(item.totalExpense)}</span> 
              • Lãi vay: <span style="color:#d97706">${money(item.interestPaid)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById("app").innerHTML = h;
}

function historyForm(){
  let nowStr = new Date().toISOString().slice(0, 10);
  let t = totals();

  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>Ghi nhận Số liệu Thực tế</h2>
      <label>Ngày báo cáo</label>
      <input id="hdate" type="date" value="${nowStr}">

      <label>Tài sản ròng thực tế (VNĐ)</label>
      <input id="hnet" class="money-input" value="${formatNumberInput(t.net)}">

      <label>Tổng thu nhập thực tế (VNĐ)</label>
      <input id="hinc" class="money-input" value="${formatNumberInput(t.totalIncomeMonthly)}">

      <label>Tổng chi phí thực tế (VNĐ)</label>
      <input id="hexp" class="money-input" value="${formatNumberInput(t.totalExpenseMonthly)}">

      <label>Dòng tiền nợ lãi thực tế (VNĐ)</label>
      <input id="hint" class="money-input" value="${formatNumberInput(t.totalLoanInterest)}">

      <br><br>
      <button onclick="saveHistory()">Lưu số liệu thực tế</button>
      <button class="secondary" onclick="render()">Hủy</button>
    </div>
  `;
  document.querySelectorAll(".money-input").forEach(bindMoneyInput);
}

function saveHistory(){
  let d = document.getElementById("hdate").value;
  if(!d) { alert("Vui lòng chọn ngày"); return; }

  let rec = {
    date: d,
    netAssets: parseNumberInput(document.getElementById("hnet").value),
    grossIncome: parseNumberInput(document.getElementById("hinc").value),
    totalExpense: parseNumberInput(document.getElementById("hexp").value),
    interestPaid: parseNumberInput(document.getElementById("hint").value)
  };

  let idx = S.history.findIndex(x => x.date === d);
  if (idx >= 0) S.history[idx] = rec;
  else S.history.push(rec);

  save(); S.tab = "history"; render();
}

function delHistory(d){
  if(confirm("Xóa bản ghi mốc ngày " + d + "?")) {
    S.history = S.history.filter(x => x.date !== d);
    save(); render();
  }
}

function tower(){
  let totalVal = Math.max(1, totals().assets);
  let h = `<div class="card"><h2>Tháp Tài Sản 5 Lớp</h2><p class="small muted">Xem và nhập danh mục tài sản chi tiết cho từng tầng tháp.</p></div>`;

  LAYERS_CONFIG.forEach(cfg => {
    let layerAssets = S.assets.filter(a => +a.layer === cfg.id);
    let layerVal = layerAssets.reduce((s, a) => s + (+a.value || 0), 0);
    let realPct = (layerVal / totalVal) * 100;

    h += `
      <div class="card">
        <div class="sectionhead">
          <div>
            <h3>${cfg.name}</h3>
            <div class="small muted">${cfg.desc}</div>
          </div>
          <button class="small-btn" onclick="assetForm(null, ${cfg.id})">+ Thêm mục</button>
        </div>
        <div class="row-sub small" style="margin-bottom:8px">
          <span>Tổng: <b>${money(layerVal)}</b> (${pct(realPct)})</span>
          ${cfg.targetPct > 0 ? `<span>Chuẩn: <b>${cfg.minPct}-${cfg.maxPct}%</b></span>` : ''}
        </div>
        
        <div class="asset-list">
          ${layerAssets.length === 0 ? `<div class="small muted" style="padding:6px 0">Chưa có đầu mục tài sản nào.</div>` : ''}
          ${layerAssets.map(a => `
            <div class="item-compact">
              <div class="item-info">
                <b>${a.name}</b>
                <span class="small muted">${a.type === 'gold' ? `${a.chi||0} chỉ × ${money(a.goldPrice)} = ` : ''}<b>${money(a.value)}</b> ${a.debt ? `• Nợ: ${money(a.debt)}` : ''}</span>
              </div>
              <div class="item-actions">
                <button class="secondary small-btn" onclick="assetForm('${a.id}')">Sửa</button>
                <button class="danger small-btn" onclick="delAsset('${a.id}')">Xóa</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  document.getElementById("app").innerHTML = h;
}

function assets(){
  let h = `<div class="card"><div class="sectionhead"><div><h2>Tất cả tài sản</h2><p class="small muted">Danh sách toàn bộ các đầu mục tài sản đã khai báo.</p></div><button onclick="assetForm()">+ Thêm tài sản</button></div></div>`;
  
  LAYERS_CONFIG.forEach(cfg => {
    let layerAssets = S.assets.filter(a => +a.layer === cfg.id);
    if (layerAssets.length === 0) return;

    h += `<div class="card"><h3>${cfg.name}</h3>`;
    layerAssets.forEach(a => {
      h += `
        <div class="item-compact">
          <div class="item-info">
            <b>${a.name}</b>
            <span class="small muted">
              ${a.type === 'gold' ? `${a.chi||0} chỉ × ${money(a.goldPrice)} = ` : ''}<b>${money(a.value)}</b>
              ${a.rate ? ` • Lãi: ${pct(a.rate)}` : ''}
            </span>
          </div>
          <div class="item-actions">
            <button class="secondary small-btn" onclick="assetForm('${a.id}')">Sửa</button>
            <button class="danger small-btn" onclick="delAsset('${a.id}')">Xóa</button>
          </div>
        </div>
      `;
    });
    h += `</div>`;
  });

  document.getElementById("app").innerHTML = h;
}

function assetForm(id = null, defaultLayer = 2){
  let a = id ? S.assets.find(x => x.id === id) : { id: "a_" + Date.now(), name: "", type: "cash", value: 0, chi: 0, goldPrice: 8500000, rate: 0, rent: 0, cost: 0, vacancy: 0, debt: 0, loanRate: 0, principal: 0, layer: defaultLayer };
  
  let h = `
    <div class="card">
      <h2>${id ? "Sửa tài sản" : "Thêm tài sản mới"}</h2>
      <label>Tên tài sản</label>
      <input id="xname" value="${a.name}" placeholder="VD: Vàng SJC, Cổ phiếu...">

      <label>Thuộc Lớp Tháp Tài Sản</label>
      <select id="xlayer">
        ${LAYERS_CONFIG.map(l => `<option value="${l.id}" ${+a.layer === l.id ? "selected" : ""}>${l.name}</option>`).join('')}
      </select>

      <label>Loại tài sản</label>
      <select id="xtype" onchange="toggleGoldInputs(this.value)">
        <option value="cash" ${a.type==='cash'?'selected':''}>Tiền mặt / Tiền gửi linh hoạt</option>
        <option value="gold" ${a.type==='gold'?'selected':''}>Vàng (SJC, Nhẫn...)</option>
        <option value="deposit" ${a.type==='deposit'?'selected':''}>Tiền gửi tiết kiệm</option>
        <option value="stock" ${a.type==='stock'?'selected':''}>Cổ phiếu / Quỹ ETF</option>
        <option value="bond" ${a.type==='bond'?'selected':''}>Trái phiếu</option>
        <option value="rental" ${a.type==='rental'?'selected':''}>BĐS cho thuê</option>
        <option value="other" ${a.type==='other'?'selected':''}>Khác</option>
      </select>

      <div id="gold-group" style="display:${a.type==='gold'?'block':'none'}">
        <label>Số chỉ vàng</label>
        <input id="xchi" class="money-input" value="${formatNumberInput(a.chi||0)}" oninput="calcGoldTotal()">
        <label>Đơn giá 1 chỉ hiện tại (VNĐ)</label>
        <input id="xgoldprice" class="money-input" value="${formatNumberInput(a.goldPrice||8500000)}" oninput="calcGoldTotal()">
        <label class="small text-good" style="margin-top:4px">Tổng tiền quy đổi: <b id="gold-total-preview">${money((a.chi||0)*(a.goldPrice||8500000))}</b></label>
      </div>

      <div id="value-group" style="display:${a.type==='gold'?'none':'block'}">
        <label>Tổng giá trị tài sản (VNĐ)</label>
        <input id="xvalue" class="money-input" value="${formatNumberInput(a.value||0)}">
      </div>

      <label>Tỷ suất lợi nhuận (%/năm)</label>
      <input id="xrate" value="${(a.rate||0).toString().replace('.',',')}">

      <br><br>
      <button onclick="saveAsset('${a.id}')">Lưu tài sản</button>
      <button class="secondary" onclick="render()">Hủy</button>
    </div>
  `;
  document.getElementById("app").innerHTML = h;
  document.querySelectorAll(".money-input").forEach(bindMoneyInput);
}

function toggleGoldInputs(type) {
  document.getElementById("gold-group").style.display = type === "gold" ? "block" : "none";
  document.getElementById("value-group").style.display = type === "gold" ? "none" : "block";
}

function calcGoldTotal(){
  let chi = parseNumberInput(document.getElementById("xchi")?.value);
  let price = parseNumberInput(document.getElementById("xgoldprice")?.value);
  let total = chi * price;
  let preview = document.getElementById("gold-total-preview");
  if(preview) preview.innerText = money(total);
}

function saveAsset(id) {
  let type = document.getElementById("xtype").value;
  let chi = parseNumberInput(document.getElementById("xchi")?.value);
  let goldPrice = parseNumberInput(document.getElementById("xgoldprice")?.value);
  let value = type === "gold" ? chi * goldPrice : parseNumberInput(document.getElementById("xvalue")?.value);

  let newAsset = {
    id: id,
    name: document.getElementById("xname").value || "Tài sản mới",
    layer: +document.getElementById("xlayer").value,
    type: type,
    chi: chi,
    goldPrice: goldPrice,
    value: value,
    rate: parseNumberInput(document.getElementById("xrate")?.value),
    debt: 0, loanRate: 0, principal: 0
  };

  let idx = S.assets.findIndex(x => x.id === id);
  if (idx >= 0) S.assets[idx] = newAsset;
  else S.assets.push(newAsset);

  save(); render();
}

function delAsset(id) {
  if (confirm("Xóa tài sản này khỏi danh mục?")) {
    S.assets = S.assets.filter(x => x.id !== id);
    save(); render();
  }
}

function cash(){
  let h = `
    <div class="card">
      <div class="sectionhead">
        <h2>Khoản vay ngoài</h2>
        <button onclick="loanForm()">+ Thêm khoản vay</button>
      </div>
      <p class="small muted">Các khoản vay ngân hàng hoặc cá nhân.</p>
    </div>
  `;

  S.loans.forEach((l, i) => {
    let interest = l.balance * l.rate / 100 / 12;
    h += `
      <div class="card">
        <div class="sectionhead"><b>${l.name}</b><strong>${money(l.balance)}</strong></div>
        <p class="small muted">Lãi suất: ${pct(l.rate)}/năm • Lãi hàng tháng: ${money(interest)}</p>
        <div class="actions">
          <button class="secondary small-btn" onclick="loanForm(${i})">Sửa</button>
          <button class="danger small-btn" onclick="S.loans.splice(${i},1);save();render()">Xóa</button>
        </div>
      </div>
    `;
  });

  document.getElementById("app").innerHTML = h;
}

function loanForm(i = null){
  let l = i === null ? { name: "", balance: 0, rate: 0, principal: 0 } : S.loans[i];
  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>${i === null ? "Thêm khoản vay mới" : "Sửa khoản vay"}</h2>
      <label>Tên khoản vay</label>
      <input id="ln" value="${l.name}" placeholder="VD: Vay ngân hàng...">
      <label>Dư nợ gốc hiện tại (VNĐ)</label>
      <input id="lb" class="money-input" value="${formatNumberInput(l.balance)}">
      <label>Lãi suất (%/năm)</label>
      <input id="lr" value="${(l.rate||0).toString().replace('.',',')}">
      <br><br>
      <button onclick="saveLoan(${i})">Lưu khoản vay</button>
      <button class="secondary" onclick="render()">Hủy</button>
    </div>
  `;
  document.querySelectorAll(".money-input").forEach(bindMoneyInput);
}

function saveLoan(i){
  let l = {
    id: "l_" + Date.now(),
    name: document.getElementById("ln").value || "Khoản vay",
    balance: parseNumberInput(document.getElementById("lb").value),
    rate: parseNumberInput(document.getElementById("lr").value),
    principal: 0
  };

  if (i === null || i === undefined) S.loans.push(l);
  else S.loans[i] = l;

  save(); S.tab = "cash"; render();
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
save(); render();