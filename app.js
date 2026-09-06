/* ===================================================
   ỨNG DỤNG QUẢN LÝ THÁP TÀI SẢN (FINANCIAL TOWER APP)
   =================================================== */

const KEY = "thap-tai-san-v6";

// Config cấu trúc các tầng tháp tài sản
const LAYERS_CONFIG = [
  { id: 1, name: "1. Nền tảng năng lực cá nhân", desc: "Sức khỏe, kiến thức, kỹ năng, mối quan hệ", targetPct: 0, minPct: 0, maxPct: 0 },
  { id: 2, name: "2. Tài sản phải có", desc: "Quỹ dự phòng (12-18 tháng chi phí), tiền mặt", targetPct: 12.5, minPct: 10, maxPct: 15 },
  { id: 3, name: "3. Tài sản thu nhập", desc: "BĐS cho thuê, cổ tức, trái phiếu, tiền gửi", targetPct: 27.5, minPct: 20, maxPct: 35 },
  { id: 4, name: "4. Tài sản tăng trưởng", desc: "Cổ phiếu, ETF, BĐS tăng giá, quỹ", targetPct: 52.5, minPct: 45, maxPct: 60 },
  { id: 5, name: "5. Tài sản đầu cơ", desc: "Crypto, BĐS lướt sóng, cơ hội rủi ro cao", targetPct: 7.5, minPct: 0, maxPct: 10 }
];

let S = JSON.parse(localStorage.getItem(KEY) || "null") || {
  assets: [
    { id: "a1", name: "Quỹ dự phòng khẩn cấp", type: "cash", value: 300000000, rate: 0, cashflow: 0, debt: 0, layer: 2 },
    { id: "a2", name: "Vàng SJC", type: "gold", chi: 20, goldPrice: 8500000, value: 170000000, rate: 0, cashflow: 0, debt: 0, layer: 2 },
    { id: "a3", name: "Tiền gửi tiết kiệm", type: "deposit", value: 1000000000, rate: 6, cashflow: 0, debt: 0, layer: 3 },
    { id: "a4", name: "Căn hộ cho thuê", type: "rental", value: 3000000000, rent: 15000000, cost: 1000000, vacancy: 0, debt: 800000000, loanRate: 8, principal: 10000000, layer: 3 },
    { id: "a5", name: "Danh mục Cổ phiếu / ETF", type: "stock", value: 4500000000, rate: 10, cashflow: 0, debt: 0, layer: 4 },
    { id: "a6", name: "Tài sản Crypto", type: "other", value: 400000000, rate: 0, cashflow: 0, debt: 0, layer: 5 }
  ],
  income: 100000000, expense: 35000000, monthlyInvest: 50000000, bonus: 0, annualReturn: 10, emergencyMonths: 12,
  loans: [{ id: "l1", name: "Vay mua nhà", balance: 800000000, rate: 8, principal: 10000000 }],
  goals: [
    { id: "g1", name: "Tự do tài chính 15 tỷ", target: 15000000000, deadline: "2033-09-01", assignedAssetIds: ["a3", "a5"], externalCapital: 1000000000 }
  ],
  events: [], tab: "dashboard", assetPeriod: "3Y", cashPeriod: "3Y", lastCalc: new Date().toISOString()
};

function save(){ S.lastCalc = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(S)); }

function money(n){ return new Intl.NumberFormat("vi-VN",{maximumFractionDigits:0}).format(Math.round(n||0)) + " đ"; }
function pct(n){ return (n||0).toFixed(1) + "%"; }
function monthsTo(date){ return Math.max(0, Math.ceil((new Date(date) - new Date()) / (30.4375 * 864e5))); }
function datef(x){ return x ? new Date(x).toLocaleDateString("vi-VN") : ""; }

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
  
  const debtToIncomeRatio = totalIncomeMonthly > 0 ? (totalDebtPaymentMonthly / totalIncomeMonthly) * 100 : 0;
  const expenseToIncomeRatio = totalIncomeMonthly > 0 ? (totalExpenseMonthly / totalIncomeMonthly) * 100 : 0;

  return {
    assets, debt, net: assets - debt, passive,
    totalLoanInterest, totalPrincipal, totalDebtPaymentMonthly,
    totalIncomeMonthly, totalLivingExpense, totalExpenseMonthly, surplus,
    debtToIncomeRatio, expenseToIncomeRatio
  };
}

function nav(){
  let ns = [["dashboard", "Tổng quan"], ["tower", "Tháp tài sản"], ["assets", "Tài sản"], ["cash", "Dòng tiền"], ["goals", "Mục tiêu"]];
  document.getElementById("nav").innerHTML = ns.map(([id, t]) => `<button class="${S.tab===id?"active":""}" onclick="S.tab='${id}';save();render()">${t}</button>`).join("");
}

function render(){ nav(); ({dashboard, tower, assets, cash, goals}[S.tab] || dashboard)(); }

function goalPlan(g){
  const m = monthsTo(g.deadline);
  const t = totals();
  const r = Math.pow(1 + S.annualReturn / 100, 1 / 12) - 1;

  const assignedAssetsVal = S.assets
    .filter(a => (g.assignedAssetIds || []).includes(a.id))
    .reduce((sum, a) => sum + (+a.value || 0), 0);

  const external = +g.externalCapital || 0;
  const initialCap = assignedAssetsVal + external;
  const baseFuture = initialCap * Math.pow(1 + r, m);

  const surplusInvestMonthly = Math.max(0, t.surplus);
  const surplusFuture = surplusInvestMonthly * (r ? ((Math.pow(1 + r, m) - 1) / r) : m);

  const projected = baseFuture + surplusFuture;
  const gap = Math.max(0, +g.target - projected);
  const extraNeeded = gap > 0 ? gap / (r ? ((Math.pow(1 + r, m) - 1) / r) : Math.max(1, m)) : 0;

  return { m, assignedAssetsVal, external, initialCap, projected, gap, extraNeeded, ok: projected >= +g.target };
}

function dashboard(){
  const t = totals();
  const g = S.goals[0];
  const p = g ? goalPlan(g) : null;

  let debtBadge = { text: "Tốt", class: "badge-good" };
  if (t.debtToIncomeRatio > 40) debtBadge = { text: "Không nên", class: "badge-bad" };
  else if (t.debtToIncomeRatio > 30) debtBadge = { text: "Cảnh báo", class: "badge-warn" };

  let expBadge = { text: "Tốt", class: "badge-good" };
  if (t.expenseToIncomeRatio > 70) expBadge = { text: "Không nên", class: "badge-bad" };
  else if (t.expenseToIncomeRatio > 50) expBadge = { text: "Cảnh báo", class: "badge-warn" };

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

  let currentAssetPeriod = S.assetPeriod || "3Y";
  let currentCashPeriod = S.cashPeriod || "3Y";

  document.getElementById("app").innerHTML = `
    <style>
      .pyramid-container { width: 100%; max-width: 420px; margin: 16px auto 24px; }
      .pyramid-svg { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.12)); }
      .pyramid-layer { transition: transform 0.2s ease, opacity 0.2s ease; cursor: pointer; }
      .pyramid-layer:hover { opacity: 0.95; transform: translateY(-2px); }
      .pyramid-label { fill: #ffffff; font-size: 11px; font-weight: 800; text-anchor: middle; font-family: -apple-system, sans-serif; pointer-events: none; }
      .pyramid-sub { fill: rgba(255, 255, 255, 0.9); font-size: 9.5px; font-weight: 600; text-anchor: middle; font-family: -apple-system, sans-serif; pointer-events: none; }
      
      .period-selector { display: flex; gap: 3px; background: #f1f5f9; padding: 3px; border-radius: 8px; flex-wrap: wrap; }
      .period-btn { border: 0; background: transparent; color: #64748b; font-size: 10px; padding: 3px 6px; border-radius: 6px; font-weight: 700; cursor: pointer; }
      .period-btn.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      
      .chart-legend { display: flex; gap: 12px; justify-content: center; margin-top: 10px; font-size: 11px; font-weight: 600; flex-wrap: wrap; }
      .legend-item { display: flex; align-items: center; gap: 5px; }
      .legend-color { width: 12px; height: 3px; border-radius: 2px; }
      .legend-bar-color { width: 10px; height: 10px; border-radius: 2px; }
    </style>

    <div class="card hero">
      <div class="small">TÀI SẢN RÒNG (NET WORTH)</div>
      <div style="font-size:28px;font-weight:900;margin:4px 0 10px">${money(t.net)}</div>
      <div class="grid2">
        <div class="metric dark"><div class="label">Tổng tài sản</div><div class="v">${money(t.assets)}</div></div>
        <div class="metric dark"><div class="label">Tổng nợ</div><div class="v">${money(t.debt)}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead"><h3>Chỉ số An toàn & Dòng tiền</h3></div>
      <div class="eval-grid">
        <div class="eval-box">
          <div class="eval-title">Nợ NH / Dòng thu</div>
          <div class="eval-val">${pct(t.debtToIncomeRatio)}</div>
          <span class="badge ${debtBadge.class}">${debtBadge.text}</span>
          <div class="small muted" style="margin-top:4px">Mục tiêu: ≤ 30%</div>
        </div>
        <div class="eval-box">
          <div class="eval-title">Tổng chi / Dòng thu</div>
          <div class="eval-val">${pct(t.expenseToIncomeRatio)}</div>
          <span class="badge ${expBadge.class}">${expBadge.text}</span>
          <div class="small muted" style="margin-top:4px">Mục tiêu: ≤ 50%</div>
        </div>
      </div>
    </div>

    <!-- BIỂU ĐỒ 1: CỘT TÀI SẢN RÒNG -->
    <div class="card">
      <div class="sectionhead">
        <div>
          <h3>Dự phóng Tài sản Ròng</h3>
          <div class="small muted">Biểu đồ Cột</div>
        </div>
        <div class="period-selector">
          <button class="period-btn ${currentAssetPeriod==='3M'?'active':''}" onclick="setAssetPeriod('3M')">Quý</button>
          <button class="period-btn ${currentAssetPeriod==='6M'?'active':''}" onclick="setAssetPeriod('6M')">6Th</button>
          <button class="period-btn ${currentAssetPeriod==='1Y'?'active':''}" onclick="setAssetPeriod('1Y')">1Năm</button>
          <button class="period-btn ${currentAssetPeriod==='3Y'?'active':''}" onclick="setAssetPeriod('3Y')">3Năm</button>
          <button class="period-btn ${currentAssetPeriod==='5Y'?'active':''}" onclick="setAssetPeriod('5Y')">5Năm</button>
          <button class="period-btn ${currentAssetPeriod==='10Y'?'active':''}" onclick="setAssetPeriod('10Y')">10Năm</button>
        </div>
      </div>
      
      <canvas id="assetBarChart"></canvas>
      
      <div class="chart-legend">
        <div class="legend-item"><div class="legend-bar-color" style="background:#3b82f6"></div><span style="color:#1e40af">Giá trị tài sản ròng (Tỷ VNĐ)</span></div>
      </div>
    </div>

    <!-- BIỂU ĐỒ 2: DÂY DÒNG TIỀN CHI TIẾT -->
    <div class="card">
      <div class="sectionhead">
        <div>
          <h3>Dự phóng Dòng tiền</h3>
          <div class="small muted">Biểu đồ Dây (3 Thuộc tính)</div>
        </div>
        <div class="period-selector">
          <button class="period-btn ${currentCashPeriod==='3M'?'active':''}" onclick="setCashPeriod('3M')">Quý</button>
          <button class="period-btn ${currentCashPeriod==='6M'?'active':''}" onclick="setCashPeriod('6M')">6Th</button>
          <button class="period-btn ${currentCashPeriod==='1Y'?'active':''}" onclick="setCashPeriod('1Y')">1Năm</button>
          <button class="period-btn ${currentCashPeriod==='3Y'?'active':''}" onclick="setCashPeriod('3Y')">3Năm</button>
          <button class="period-btn ${currentCashPeriod==='5Y'?'active':''}" onclick="setCashPeriod('5Y')">5Năm</button>
          <button class="period-btn ${currentCashPeriod==='10Y'?'active':''}" onclick="setCashPeriod('10Y')">10Năm</button>
        </div>
      </div>
      
      <canvas id="cashLineChart"></canvas>
      
      <div class="chart-legend">
        <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span style="color:#065f46">Tổng thu nhập</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span style="color:#991b1b">Tổng chi phí (gốc+lãi)</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#f59e0b"></div><span style="color:#92400e">Lãi vay phải trả</span></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead">
        <h3>Tỷ lệ Tháp Tài Sản</h3>
        <span class="small muted">Thực tế vs Chuẩn</span>
      </div>

      <div class="pyramid-container">
        <svg viewBox="0 0 400 250" class="pyramid-svg">
          <defs>
            <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>
            <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4ade80"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
          </defs>

          <g class="pyramid-layer">
            <polygon points="200,10 162,54 238,54" fill="url(#g5)"/>
            <text x="200" y="34" class="pyramid-label">5. Đầu cơ</text>
            <text x="200" y="46" class="pyramid-sub">${pct(p5)}</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="159,58 241,58 277,102 123,102" fill="url(#g4)"/>
            <text x="200" y="78" class="pyramid-label">4. Tăng trưởng</text>
            <text x="200" y="92" class="pyramid-sub">${pct(p4)} (Chuẩn 45-60%)</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="120,106 280,106 316,150 84,150" fill="url(#g3)"/>
            <text x="200" y="126" class="pyramid-label">3. Tài sản thu nhập</text>
            <text x="200" y="140" class="pyramid-sub">${pct(p3)} (Chuẩn 20-35%)</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="81,154 319,154 355,198 45,198" fill="url(#g2)"/>
            <text x="200" y="174" class="pyramid-label">2. Tài sản phải có</text>
            <text x="200" y="188" class="pyramid-sub">${pct(p2)} (Chuẩn 10-15%)</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="42,202 358,202 394,246 6,246" fill="url(#g1)"/>
            <text x="200" y="222" class="pyramid-label">1. Nền tảng năng lực cá nhân</text>
            <text x="200" y="236" class="pyramid-sub">Sức khỏe • Kỹ năng • Mối quan hệ</text>
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

    <div class="card">
      <div class="sectionhead"><h3>Dòng tiền hàng tháng</h3><span class="badge ${t.surplus >= 0 ? 'badge-good' : 'badge-bad'}">${t.surplus >= 0 ? 'Dương' : 'Âm'}</span></div>
      <div class="grid2">
        <div class="metric"><div class="label">Tổng thu nhập</div><div class="v">${money(t.totalIncomeMonthly)}</div></div>
        <div class="metric"><div class="label">Tổng chi phí + Trả nợ</div><div class="v">${money(t.totalExpenseMonthly)}</div></div>
        <div class="metric"><div class="label">Dòng tiền dư/tháng</div><div class="v">${money(t.surplus)}</div></div>
        <div class="metric"><div class="label">Lãi vay phải trả</div><div class="v">${money(t.totalLoanInterest)}</div></div>
      </div>
    </div>

    ${g ? `
    <div class="card">
      <div class="sectionhead">
        <div><div class="small">MỤC TIÊU TÀI CHÍNH</div><h2>${g.name}</h2></div>
        <span class="badge ${p.ok ? 'badge-good' : 'badge-warn'}">${p.ok ? 'ĐẠT KẾ HOẠCH' : 'CẦN BỔ SUNG'}</span>
      </div>
      <div class="grid2">
        <div class="metric"><div class="label">Mục tiêu</div><div class="v">${money(g.target)}</div></div>
        <div class="metric"><div class="label">Dự kiến đạt</div><div class="v">${money(p.projected)}</div></div>
        <div class="metric"><div class="label">Còn thiếu</div><div class="v">${money(p.gap)}</div></div>
        <div class="metric"><div class="label">Cần tích lũy thêm</div><div class="v">${money(p.extraNeeded)}/tháng</div></div>
      </div>
      <p class="small muted" style="margin-top:10px">Hạn: ${datef(g.deadline)} • Vốn gán sẵn: ${money(p.initialCap)}</p>
    </div>` : `<div class="card"><h3>Chưa có mục tiêu</h3><button onclick="goalForm()">+ Tạo mục tiêu</button></div>`}

    <div class="card">
      <div class="sectionhead"><h3>Cập nhật hệ thống</h3></div>
      <div class="actions">
        <button onclick="settings()">Cấu hình thu nhập/chi tiêu</button>
        <button class="secondary" onclick="S.tab='assets';render()">Quản lý tài sản</button>
      </div>
    </div>
  `;

  drawAssetBarChart("assetBarChart", currentAssetPeriod);
  drawCashLineChart("cashLineChart", currentCashPeriod);
}

function setAssetPeriod(p) { S.assetPeriod = p; save(); render(); }
function setCashPeriod(p) { S.cashPeriod = p; save(); render(); }

// 1. BIỂU ĐỒ CỘT TÀI SẢN RÒNG
function drawAssetBarChart(id, periodKey = "3Y") {
  let canvas = document.getElementById(id);
  if (!canvas) return;

  let periodMap = { "3M": 3, "6M": 6, "1Y": 12, "3Y": 36, "5Y": 60, "10Y": 120 };
  let totalMonths = periodMap[periodKey] || 36;
  let steps = 6;

  let t = totals();
  let r = Math.pow(1 + (S.annualReturn || 10) / 100, 1 / 12) - 1;
  let baseNet = t.net;
  let monthlySurplus = t.surplus;

  let pts = [];
  for (let i = 0; i <= steps; i++) {
    let m = Math.round((totalMonths / steps) * i);
    let netVal = baseNet * Math.pow(1 + r, m) + (monthlySurplus > 0 ? monthlySurplus * (r ? ((Math.pow(1 + r, m) - 1) / r) : m) : 0);
    pts.push({ m, val: netVal / 1e9 }); // Đơn vị Tỷ VNĐ
  }

  let d = window.devicePixelRatio || 1;
  let w = canvas.clientWidth;
  let h = 200;
  canvas.width = w * d;
  canvas.height = h * d;
  let ctx = canvas.getContext("2d");
  ctx.scale(d, d);

  let pLeft = 40, pRight = 20, pTop = 25, pBottom = 25;
  let plotW = w - pLeft - pRight;
  let plotH = h - pTop - pBottom;

  let maxVal = Math.max(...pts.map(p => p.val), 0.1);
  let minVal = Math.min(0, ...pts.map(p => p.val));

  // Lưới ngang
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    let y = pTop + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pLeft, y); ctx.lineTo(w - pRight, y); ctx.stroke();
  }

  // Vẽ Cột
  let barWidth = (plotW / (steps + 1)) * 0.5;
  pts.forEach((p, i) => {
    let x = pLeft + (i + 0.5) * (plotW / (steps + 1));
    let yVal = pTop + plotH - ((p.val - minVal) / (maxVal - minVal || 1)) * plotH;
    let yZero = pTop + plotH - ((0 - minVal) / (maxVal - minVal || 1)) * plotH;
    
    let barH = Math.abs(yVal - yZero);
    let barY = p.val >= 0 ? yVal : yZero;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x - barWidth / 2, barY, barWidth, barH);

    // Giá trị đầu cột
    ctx.font = "9px -apple-system, sans-serif";
    ctx.fillStyle = "#1e40af";
    ctx.textAlign = "center";
    ctx.fillText(p.val.toFixed(1) + "Tỷ", x, barY - 4);

    // Trục X
    let label = p.m === 0 ? "Hiện tại" : (p.m < 12 ? `${p.m} Th` : `${(p.m/12).toFixed(p.m % 12 === 0 ? 0 : 1)} Năm`);
    ctx.fillStyle = "#64748b";
    ctx.fillText(label, x, h - 6);
  });
}

// 2. BIỂU ĐỒ DÂY DÒNG TIỀN (3 ĐƯỜNG: TỔNG THU, TỔNG CHI, LÃI VAY)
function drawCashLineChart(id, periodKey = "3Y") {
  let canvas = document.getElementById(id);
  if (!canvas) return;

  let periodMap = { "3M": 3, "6M": 6, "1Y": 12, "3Y": 36, "5Y": 60, "10Y": 120 };
  let totalMonths = periodMap[periodKey] || 36;
  let steps = 6;

  let t = totals();
  let r = Math.pow(1 + (S.annualReturn || 10) / 100, 1 / 12) - 1;

  let incPts = [], expPts = [], interestPts = [];

  for (let i = 0; i <= steps; i++) {
    let m = Math.round((totalMonths / steps) * i);
    
    // Thu nhập tăng trưởng theo tài sản tích lũy
    let netVal = t.net * Math.pow(1 + r, m) + (t.surplus > 0 ? t.surplus * (r ? ((Math.pow(1 + r, m) - 1) / r) : m) : 0);
    let addedPassive = Math.max(0, netVal - t.net) * (r / 2);
    
    let inc = (t.totalIncomeMonthly + addedPassive) / 1e6; // Triệu VNĐ
    let exp = t.totalExpenseMonthly / 1e6; // Triệu VNĐ
    let interest = t.totalLoanInterest / 1e6; // Triệu VNĐ

    incPts.push(inc);
    expPts.push(exp);
    interestPts.push(interest);
  }

  let d = window.devicePixelRatio || 1;
  let w = canvas.clientWidth;
  let h = 200;
  canvas.width = w * d;
  canvas.height = h * d;
  let ctx = canvas.getContext("2d");
  ctx.scale(d, d);

  let pLeft = 35, pRight = 20, pTop = 20, pBottom = 25;
  let plotW = w - pLeft - pRight;
  let plotH = h - pTop - pBottom;

  let maxVal = Math.max(...incPts, ...expPts, ...interestPts, 1);

  const getY = (v) => pTop + plotH - (v / maxVal) * plotH;

  // Lưới ngang
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    let y = pTop + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pLeft, y); ctx.lineTo(w - pRight, y); ctx.stroke();
  }

  // Hàm vẽ 1 đường dây
  const drawLine = (pts, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach((v, i) => {
      let x = pLeft + i * (plotW / steps);
      let y = getY(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    pts.forEach((v, i) => {
      let x = pLeft + i * (plotW / steps);
      let y = getY(v);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
  };

  // Vẽ 3 Dây
  drawLine(incPts, "#10b981");      // Tổng thu (Xanh lá)
  drawLine(expPts, "#ef4444");      // Tổng chi (Đỏ)
  drawLine(interestPts, "#f59e0b"); // Lãi vay (Vàng)

  // Trục Y max
  ctx.font = "9px -apple-system, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "left";
  ctx.fillText(maxVal.toFixed(0) + "M", 2, pTop + 8);

  // Trục X mốc thời gian
  ctx.textAlign = "center";
  for (let i = 0; i <= steps; i++) {
    let m = Math.round((totalMonths / steps) * i);
    let x = pLeft + i * (plotW / steps);
    let label = m === 0 ? "Hiện tại" : (m < 12 ? `${m} Th` : `${(m/12).toFixed(m % 12 === 0 ? 0 : 1)} N`);
    ctx.fillText(label, x, h - 6);
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
                <span class="small muted">${a.type === 'gold' ? `${a.chi||0} chỉ (Đơn giá: ${money(a.goldPrice)})` : money(a.value)} ${a.debt ? `• Nợ: ${money(a.debt)}` : ''}</span>
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
              ${a.rate ? ` • Lãi/Tỷ suất: ${pct(a.rate)}` : ''}
              ${assetIncome(a) ? ` • Dòng tiền: ${money(assetIncome(a))}/tháng` : ''}
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
      <label>Tên tài sản / Đầu mục</label>
      <input id="xname" value="${a.name}" placeholder="VD: Vàng SJC, Cổ phiếu FPT, Nhà Phố...">

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
        <option value="rental" ${a.type==='rental'?'selected':''}>Bất động sản cho thuê</option>
        <option value="other" ${a.type==='other'?'selected':''}>Khác (Crypto, Khởi nghiệp...)</option>
      </select>

      <div id="gold-group" style="display:${a.type==='gold'?'block':'none'}">
        <label>Số chỉ vàng</label>
        <input id="xchi" class="money-input" value="${formatNumberInput(a.chi||0)}">

        <label>Đơn giá 1 chỉ hiện tại (VNĐ)</label>
        <input id="xgoldprice" class="money-input" value="${formatNumberInput(a.goldPrice||8500000)}">
      </div>

      <div id="value-group" style="display:${a.type==='gold'?'none':'block'}">
        <label>Tổng giá trị tài sản (VNĐ)</label>
        <input id="xvalue" class="money-input" value="${formatNumberInput(a.value||0)}">
      </div>

      <label>Tỷ suất lợi nhuận / Cổ tức (%/năm)</label>
      <input id="xrate" value="${(a.rate||0).toString().replace('.',',')}">

      <div id="rental-group" style="display:${a.type==='rental'?'block':'none'}">
        <label>Tiền thuê/tháng (VNĐ)</label>
        <input id="xrent" class="money-input" value="${formatNumberInput(a.rent||0)}">
        <label>Chi phí vận hành/tháng (VNĐ)</label>
        <input id="xcost" class="money-input" value="${formatNumberInput(a.cost||0)}">
        <label>Tỷ lệ trống (%)</label>
        <input id="xvac" value="${(a.vacancy||0).toString().replace('.',',')}">
      </div>

      <hr>
      <div class="small bold">Khoản nợ gắn liền với tài sản này (nếu có)</div>
      
      <label>Dư nợ hiện tại (VNĐ)</label>
      <input id="xdebt" class="money-input" value="${formatNumberInput(a.debt||0)}">
      
      <label>Lãi suất vay (%/năm)</label>
      <input id="xloanrate" value="${(a.loanRate||0).toString().replace('.',',')}">
      
      <label>Tiền gốc trả/tháng (VNĐ)</label>
      <input id="xprincipal" class="money-input" value="${formatNumberInput(a.principal||0)}">

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
  document.getElementById("rental-group").style.display = type === "rental" ? "block" : "none";
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
    rent: parseNumberInput(document.getElementById("xrent")?.value),
    cost: parseNumberInput(document.getElementById("xcost")?.value),
    vacancy: parseNumberInput(document.getElementById("xvac")?.value),
    debt: parseNumberInput(document.getElementById("xdebt")?.value),
    loanRate: parseNumberInput(document.getElementById("xloanrate")?.value),
    principal: parseNumberInput(document.getElementById("xprincipal")?.value)
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

function settings(){
  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>Dòng tiền & Lãi suất</h2>
      <label>Thu nhập chủ động hàng tháng (Lương, KD...)</label>
      <input id="si" class="money-input" value="${formatNumberInput(S.income)}">

      <label>Chi tiêu sinh hoạt hàng tháng</label>
      <input id="se" class="money-input" value="${formatNumberInput(S.expense)}">

      <label>Kỳ vọng tăng trưởng tài sản trung bình (%/năm)</label>
      <input id="sr" value="${(S.annualReturn||0).toString().replace('.',',')}">

      <br><br>
      <button onclick="saveSettings()">Lưu cấu hình</button>
      <button class="secondary" onclick="render()">Hủy</button>
    </div>

    <div class="card">
      <h3>Dữ liệu Sao lưu (Backup)</h3>
      <button onclick="exportData()">Xuất file JSON</button>
      <br><br>
      <input type="file" accept=".json" onchange="importData(event)">
    </div>
  `;
  document.querySelectorAll(".money-input").forEach(bindMoneyInput);
}

function saveSettings(){
  S.income = parseNumberInput(document.getElementById("si").value);
  S.expense = parseNumberInput(document.getElementById("se").value);
  S.annualReturn = parseNumberInput(document.getElementById("sr").value);
  save(); S.tab = "dashboard"; render();
}

function goals(){
  let h = `<div class="card"><div class="sectionhead"><div><h2>Mục tiêu Tài chính</h2></div><button onclick="goalForm()">+ Thêm mục tiêu</button></div></div>`;

  S.goals.forEach(g => {
    let p = goalPlan(g);
    h += `
      <div class="card">
        <div class="sectionhead">
          <b>${g.name}</b>
          <span class="badge ${p.ok ? 'badge-good' : 'badge-warn'}">${p.ok ? 'Đạt kế hoạch' : 'Cần bổ sung'}</span>
        </div>
        <div class="grid2" style="margin-top:8px">
          <div class="metric"><div class="label">Mục tiêu</div><div class="v">${money(g.target)}</div></div>
          <div class="metric"><div class="label">Dự kiến đạt</div><div class="v">${money(p.projected)}</div></div>
          <div class="metric"><div class="label">Còn thiếu</div><div class="v">${money(p.gap)}</div></div>
          <div class="metric"><div class="label">Cần tích lũy thêm</div><div class="v">${money(p.extraNeeded)}/tháng</div></div>
        </div>
        <p class="small muted" style="margin-top:8px">
          • Tài sản đã gán mục tiêu: <b>${money(p.assignedAssetsVal)}</b><br>
          • Nguồn vốn thu xếp sau: <b>${money(p.external)}</b><br>
          • Hạn hoàn thành: ${datef(g.deadline)}
        </p>
        <div class="actions" style="margin-top:10px">
          <button class="secondary small-btn" onclick="goalForm('${g.id}')">Sửa</button>
          <button class="danger small-btn" onclick="delGoal('${g.id}')">Xóa</button>
        </div>
      </div>
    `;
  });

  document.getElementById("app").innerHTML = h;
}

function goalForm(id = null){
  let g = id ? S.goals.find(x => x.id === id) : { id: "g_" + Date.now(), name: "", target: 10000000000, deadline: "2030-01-01", assignedAssetIds: [], externalCapital: 0 };

  let h = `
    <div class="card">
      <h2>${id ? "Sửa mục tiêu" : "Tạo mục tiêu mới"}</h2>
      <label>Tên mục tiêu</label>
      <input id="gn" value="${g.name}" placeholder="VD: Tự do tài chính, Mua BĐS thứ 2...">

      <label>Số tiền mục tiêu cần đạt (VNĐ)</label>
      <input id="gt" class="money-input" value="${formatNumberInput(g.target)}">

      <label>Thời hạn hoàn thành</label>
      <input id="gd" type="date" value="${g.deadline}">

      <label>Nguồn vốn thu xếp sau (VNĐ)</label>
      <input id="gext" class="money-input" value="${formatNumberInput(g.externalCapital||0)}">

      <hr>
      <label><b>Chọn các tài sản gán riêng cho mục tiêu này:</b></label>
      <div class="asset-checkbox-list">
        ${S.assets.map(a => `
          <div class="checkbox-row">
            <input type="checkbox" id="chk_${a.id}" value="${a.id}" ${(g.assignedAssetIds||[]).includes(a.id) ? "checked" : ""}>
            <label for="chk_${a.id}" style="display:inline;margin:0">${a.name} (${money(a.value)})</label>
          </div>
        `).join('')}
      </div>

      <br>
      <button onclick="saveGoal('${g.id}')">Lưu mục tiêu</button>
      <button class="secondary" onclick="render()">Hủy</button>
    </div>
  `;
  document.getElementById("app").innerHTML = h;
  document.querySelectorAll(".money-input").forEach(bindMoneyInput);
}

function saveGoal(id){
  let assigned = [];
  S.assets.forEach(a => {
    let chk = document.getElementById(`chk_${a.id}`);
    if (chk && chk.checked) assigned.push(a.id);
  });

  let newGoal = {
    id: id,
    name: document.getElementById("gn").value || "Mục tiêu mới",
    target: parseNumberInput(document.getElementById("gt").value),
    deadline: document.getElementById("gd").value,
    externalCapital: parseNumberInput(document.getElementById("gext").value),
    assignedAssetIds: assigned
  };

  let idx = S.goals.findIndex(x => x.id === id);
  if (idx >= 0) S.goals[idx] = newGoal;
  else S.goals.push(newGoal);

  save(); S.tab = "goals"; render();
}

function delGoal(id){
  if (confirm("Xóa mục tiêu này?")) {
    S.goals = S.goals.filter(x => x.id !== id);
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
      <p class="small muted">Các khoản vay ngân hàng hoặc cá nhân không gắn với BĐS cụ thể.</p>
    </div>
  `;

  S.loans.forEach((l, i) => {
    let interest = l.balance * l.rate / 100 / 12;
    h += `
      <div class="card">
        <div class="sectionhead"><b>${l.name}</b><strong>${money(l.balance)}</strong></div>
        <p class="small muted">Lãi suất: ${pct(l.rate)}/năm • Lãi hàng tháng: ${money(interest)} • Gốc trả hàng tháng: ${money(l.principal)}</p>
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
      <input id="ln" value="${l.name}" placeholder="VD: Vay tín chấp, Vay người thân...">

      <label>Dư nợ gốc hiện tại (VNĐ)</label>
      <input id="lb" class="money-input" value="${formatNumberInput(l.balance)}">

      <label>Lãi suất (%/năm)</label>
      <input id="lr" value="${(l.rate||0).toString().replace('.',',')}">

      <label>Gốc trả hàng tháng (VNĐ)</label>
      <input id="lp" class="money-input" value="${formatNumberInput(l.principal)}">

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
    principal: parseNumberInput(document.getElementById("lp").value)
  };

  if (i === null || i === undefined) S.loans.push(l);
  else S.loans[i] = l;

  save(); S.tab = "cash"; render();
}

function exportData(){
  let p = { app: "Tháp Tài Sản", version: "6.0", exportedAt: new Date().toISOString(), data: S };
  let b = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
  let u = URL.createObjectURL(b);
  let a = document.createElement("a");
  a.href = u; a.download = "thap-tai-san-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click(); URL.revokeObjectURL(u);
}

function importData(e){
  let f = e.target.files?.[0]; if (!f) return;
  let r = new FileReader();
  r.onload = () => {
    try {
      let p = JSON.parse(r.result), d = p.data || p;
      if (!Array.isArray(d.assets)) throw 0;
      if (confirm("Khôi phục toàn bộ dữ liệu? Dữ liệu hiện tại sẽ bị thay thế.")) {
        S = d; S.tab = "dashboard"; save(); render();
        alert("Khôi phục dữ liệu thành công!");
      }
    } catch { alert("File backup không hợp lệ."); }
  };
  r.readAsText(f);
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
save(); render();