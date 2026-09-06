/* ===================================================
   ỨNG DỤNG QUẢN LÝ THÁP TÀI SẢN (FINANCIAL TOWER APP - v7.1 FINAL)
   =================================================== */

const KEY = "thap-tai-san-v7";

const LAYERS_CONFIG = [
  { id: 1, name: "1. Nền tảng năng lực cá nhân", desc: "Sức khỏe, kiến thức, kỹ năng, mối quan hệ", targetPct: 0, minPct: 0, maxPct: 0 },
  { id: 2, name: "2. Tài sản phải có", desc: "Quỹ dự phòng, tiền mặt, vàng", targetPct: 12.5, minPct: 10, maxPct: 15 },
  { id: 3, name: "3. Tài sản thu nhập", desc: "BĐS cho thuê, cổ tức, trái phiếu, tiết kiệm", targetPct: 27.5, minPct: 20, maxPct: 35 },
  { id: 4, name: "4. Tài sản tăng trưởng", desc: "Cổ phiếu, ETF, BĐS tăng giá", targetPct: 52.5, minPct: 45, maxPct: 60 },
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
  income: 100000000, expense: 35000000, monthlyInvest: 50000000, bonus: 0, annualReturn: 10,
  loans: [{ id: "l1", name: "Vay mua nhà", balance: 800000000, rate: 8, principal: 10000000 }],
  goals: [{ id: "g1", name: "Tự do tài chính 15 tỷ", target: 15000000000, deadline: "2033-09-01", assignedAssetIds: ["a3", "a5"], externalCapital: 1000000000 }],
  history: [
    { date: "2025-03-31", netAssets: 7800000000, grossIncome: 110000000, totalExpense: 42000000, interestPaid: 6000000 },
    { date: "2025-06-30", netAssets: 8100000000, grossIncome: 115000000, totalExpense: 43000000, interestPaid: 5800000 },
    { date: "2025-09-30", netAssets: 8350000000, grossIncome: 112000000, totalExpense: 41000000, interestPaid: 5500000 },
    { date: "2025-12-31", netAssets: 8600000000, grossIncome: 120000000, totalExpense: 45000000, interestPaid: 5300000 },
    { date: "2026-03-31", netAssets: 8900000000, grossIncome: 118000000, totalExpense: 44000000, interestPaid: 5100000 },
    { date: "2026-06-30", netAssets: 9200000000, grossIncome: 125000000, totalExpense: 46000000, interestPaid: 4900000 }
  ],
  tab: "dashboard", assetPeriod: "1Y", cashPeriod: "1Y", lastCalc: new Date().toISOString()
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
  const debtToIncomeRatio = totalIncomeMonthly > 0 ? (totalDebtPaymentMonthly / totalIncomeMonthly) * 100 : 0;
  const expenseToIncomeRatio = totalIncomeMonthly > 0 ? (totalExpenseMonthly / totalIncomeMonthly) * 100 : 0;

  return {
    assets, debt, net: assets - debt, passive,
    totalLoanInterest, totalPrincipal, totalDebtPaymentMonthly,
    totalIncomeMonthly, totalLivingExpense, totalExpenseMonthly, surplus,
    debtToIncomeRatio, expenseToIncomeRatio
  };
}

function getLatestRecordBefore(dateStr) {
  let targetTime = new Date(dateStr + "T00:00:00").getTime();
  let sorted = [...S.history].sort((a,b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime());
  
  let match = null;
  for (let item of sorted) {
    if (new Date(item.date + "T00:00:00").getTime() <= targetTime) {
      match = item;
    } else break;
  }
  
  if (!match) {
    let t = totals();
    return {
      date: dateStr,
      netAssets: t.net,
      grossIncome: t.totalIncomeMonthly,
      totalExpense: t.totalExpenseMonthly,
      interestPaid: t.totalLoanInterest
    };
  }
  return match;
}

function getReportingMilestones(periodKey) {
  let now = new Date();
  let currentYear = now.getFullYear();
  let milestones = [];

  if (periodKey === "3M") {
    milestones = [
      { label: `Q1/${currentYear-1}`, date: `${currentYear-1}-03-31` },
      { label: `Q2/${currentYear-1}`, date: `${currentYear-1}-06-30` },
      { label: `Q3/${currentYear-1}`, date: `${currentYear-1}-09-30` },
      { label: `Q4/${currentYear-1}`, date: `${currentYear-1}-12-31` },
      { label: `Q1/${currentYear}`, date: `${currentYear}-03-31` },
      { label: `Q2/${currentYear}`, date: `${currentYear}-06-30` }
    ];
  } else if (periodKey === "6M") {
    milestones = [
      { label: `T6/${currentYear-2}`, date: `${currentYear-2}-06-30` },
      { label: `T12/${currentYear-2}`, date: `${currentYear-2}-12-31` },
      { label: `T6/${currentYear-1}`, date: `${currentYear-1}-06-30` },
      { label: `T12/${currentYear-1}`, date: `${currentYear-1}-12-31` },
      { label: `T6/${currentYear}`, date: `${currentYear}-06-30` },
      { label: `Hiện tại`, date: now.toISOString().slice(0,10) }
    ];
  } else if (periodKey === "1Y") {
    for (let i = 4; i >= 0; i--) {
      let y = currentYear - i;
      milestones.push({ label: `${y}`, date: `${y}-12-31` });
    }
    milestones.push({ label: "Hiện tại", date: now.toISOString().slice(0,10) });
  } else if (periodKey === "3Y" || periodKey === "5Y" || periodKey === "10Y") {
    let count = periodKey === "3Y" ? 3 : (periodKey === "5Y" ? 5 : 10);
    for (let i = count; i >= 0; i--) {
      let y = currentYear - i;
      milestones.push({ label: `${y}`, date: `${y}-12-31` });
    }
  }

  return milestones;
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

  let currentAssetPeriod = S.assetPeriod || "1Y";
  let currentCashPeriod = S.cashPeriod || "1Y";

  document.getElementById("app").innerHTML = `
    <style>
      .pyramid-container { width: 100%; max-width: 440px; margin: 10px auto 20px; }
      .pyramid-svg { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.08)); }
      .pyramid-layer { transition: transform 0.2s ease, opacity 0.2s ease; cursor: pointer; }
      .pyramid-layer:hover { opacity: 0.92; transform: translateY(-1px); }
      .pyramid-label { fill: #ffffff; font-size: 11px; font-weight: 800; text-anchor: middle; font-family: -apple-system, sans-serif; pointer-events: none; }
      .pyramid-sub { fill: rgba(255, 255, 255, 0.95); font-size: 9.5px; font-weight: 600; text-anchor: middle; font-family: -apple-system, sans-serif; pointer-events: none; }
      
      .period-selector { display: flex; gap: 3px; background: #f1f5f9; padding: 3px; border-radius: 8px; flex-wrap: wrap; }
      .period-btn { border: 0; background: transparent; color: #64748b; font-size: 10px; padding: 3px 6px; border-radius: 6px; font-weight: 700; cursor: pointer; }
      .period-btn.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      
      .chart-legend { display: flex; gap: 12px; justify-content: center; margin-top: 10px; font-size: 11px; font-weight: 600; flex-wrap: wrap; }
      .legend-item { display: flex; align-items: center; gap: 5px; }
      .legend-color { width: 12px; height: 3px; border-radius: 2px; }
      .legend-bar-color { width: 10px; height: 10px; border-radius: 2px; }
      canvas { width: 100% !important; height: 200px !important; display: block; }
    </style>

    <div class="card hero">
      <div class="small">TÀI SẢN RÒNG THỰC TẾ</div>
      <div style="font-size:28px;font-weight:900;margin:4px 0 10px">${money(t.net)}</div>
      <div class="grid2">
        <div class="metric dark"><div class="label">Tổng tài sản</div><div class="v">${money(t.assets)}</div></div>
        <div class="metric dark"><div class="label">Tổng nợ</div><div class="v">${money(t.debt)}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead">
        <div>
          <h3>Tài sản Ròng Thực tế</h3>
          <div class="small muted">Biểu đồ Cột theo Mốc Báo cáo</div>
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
        <div class="legend-item"><div class="legend-bar-color" style="background:#3b82f6"></div><span style="color:#1e40af">Tài sản ròng thực tế (Tỷ VNĐ)</span></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead">
        <div>
          <h3>Dòng tiền Thực tế</h3>
          <div class="small muted">Biểu đồ Dây 3 Thuộc tính</div>
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
        <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span style="color:#065f46">🟢 Tổng thu chưa trừ</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span style="color:#991b1b">🔴 Tổng chi bao gồm các loại</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#f59e0b"></div><span style="color:#92400e">🟡 Dòng tiền nợ lãi phải trả</span></div>
      </div>
    </div>

    <div class="card">
      <div class="sectionhead">
        <h3>Tỷ lệ Tháp Tài Sản</h3>
        <span class="small muted">Thực tế vs Chuẩn</span>
      </div>

      <div class="pyramid-container">
        <svg viewBox="0 0 400 280" class="pyramid-svg">
          <defs>
            <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></linearGradient>
            <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
          </defs>

          <g class="pyramid-layer">
            <polygon points="200,12 150,65 250,65" fill="url(#g5)"/>
            <text x="200" y="38" class="pyramid-label">5. Đầu cơ</text>
            <text x="200" y="52" class="pyramid-sub">${pct(p5)}</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="146,69 254,69 292,118 108,118" fill="url(#g4)"/>
            <text x="200" y="92" class="pyramid-label">4. Tăng trưởng</text>
            <text x="200" y="106" class="pyramid-sub">${pct(p4)} (Chuẩn 45-60%)</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="104,122 296,122 334,171 66,171" fill="url(#g3)"/>
            <text x="200" y="144" class="pyramid-label">3. Tài sản thu nhập</text>
            <text x="200" y="158" class="pyramid-sub">${pct(p3)} (Chuẩn 20-35%)</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="62,175 338,175 376,224 24,224" fill="url(#g2)"/>
            <text x="200" y="197" class="pyramid-label">2. Tài sản phải có</text>
            <text x="200" y="211" class="pyramid-sub">${pct(p2)} (Chuẩn 10-15%)</text>
          </g>

          <g class="pyramid-layer">
            <polygon points="20,228 380,228 400,270 0,270" fill="url(#g1)"/>
            <text x="200" y="247" class="pyramid-label">1. Nền tảng năng lực cá nhân</text>
            <text x="200" y="261" class="pyramid-sub">Sức khỏe • Kỹ năng • Mối quan hệ</text>
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

  drawAssetBarChart("assetBarChart", currentAssetPeriod);
  drawCashLineChart("cashLineChart", currentCashPeriod);
}

function setAssetPeriod(p) { S.assetPeriod = p; save(); render(); }
function setCashPeriod(p) { S.cashPeriod = p; save(); render(); }

function drawAssetBarChart(id, periodKey = "1Y") {
  let canvas = document.getElementById(id);
  if (!canvas) return;

  let milestones = getReportingMilestones(periodKey);
  let pts = milestones.map(m => {
    let rec = getLatestRecordBefore(m.date);
    return { label: m.label, val: rec.netAssets / 1e9 };
  });

  let d = window.devicePixelRatio || 1;
  let w = canvas.clientWidth || 300;
  let h = 200;
  canvas.width = w * d;
  canvas.height = h * d;
  let ctx = canvas.getContext("2d");
  ctx.scale(d, d);

  let pLeft = 35, pRight = 15, pTop = 25, pBottom = 25;
  let plotW = w - pLeft - pRight;
  let plotH = h - pTop - pBottom;

  let maxVal = Math.max(...pts.map(p => p.val), 0.1);
  let minVal = Math.min(0, ...pts.map(p => p.val));

  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    let y = pTop + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pLeft, y); ctx.lineTo(w - pRight, y); ctx.stroke();
  }

  let steps = pts.length;
  let barWidth = (plotW / steps) * 0.45;
  pts.forEach((p, i) => {
    let x = pLeft + (i + 0.5) * (plotW / steps);
    let yVal = pTop + plotH - ((p.val - minVal) / (maxVal - minVal || 1)) * plotH;
    let yZero = pTop + plotH - ((0 - minVal) / (maxVal - minVal || 1)) * plotH;
    
    let barH = Math.abs(yVal - yZero);
    let barY = p.val >= 0 ? yVal : yZero;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x - barWidth / 2, barY, barWidth, barH);

    ctx.font = "9px -apple-system, sans-serif";
    ctx.fillStyle = "#1e40af";
    ctx.textAlign = "center";
    ctx.fillText(p.val.toFixed(2) + " tỷ", x, barY - 4);

    ctx.fillStyle = "#64748b";
    ctx.fillText(p.label, x, h - 6);
  });
}

function drawCashLineChart(id, periodKey = "1Y") {
  let canvas = document.getElementById(id);
  if (!canvas) return;

  let milestones = getReportingMilestones(periodKey);
  let incPts = [], expPts = [], interestPts = [];

  milestones.forEach(m => {
    let rec = getLatestRecordBefore(m.date);
    incPts.push(rec.grossIncome / 1e6);
    expPts.push(rec.totalExpense / 1e6);
    interestPts.push(rec.interestPaid / 1e6);
  });

  let d = window.devicePixelRatio || 1;
  let w = canvas.clientWidth || 300;
  let h = 200;
  canvas.width = w * d;
  canvas.height = h * d;
  let ctx = canvas.getContext("2d");
  ctx.scale(d, d);

  let pLeft = 35, pRight = 15, pTop = 20, pBottom = 25;
  let plotW = w - pLeft - pRight;
  let plotH = h - pTop - pBottom;

  let maxVal = Math.max(...incPts, ...expPts, ...interestPts, 1);
  let steps = milestones.length - 1;

  const getY = (v) => pTop + plotH - (v / maxVal) * plotH;

  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    let y = pTop + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pLeft, y); ctx.lineTo(w - pRight, y); ctx.stroke();
  }

  const drawLine = (pts, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    pts.forEach((v, i) => {
      let x = pLeft + (steps > 0 ? i * (plotW / steps) : plotW / 2);
      let y = getY(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    pts.forEach((v, i) => {
      let x = pLeft + (steps > 0 ? i * (plotW / steps) : plotW / 2);
      let y = getY(v);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
  };

  drawLine(incPts, "#10b981");
  drawLine(expPts, "#ef4444");
  drawLine(interestPts, "#f59e0b");

  ctx.font = "9px -apple-system, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "left";
  ctx.fillText(maxVal.toFixed(0) + "M", 2, pTop + 8);

  ctx.textAlign = "center";
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
      <label>Ngày báo cáo (Cuối Quý/Năm hoặc ngày chốt)</label>
      <input id="hdate" type="date" value="${nowStr}">

      <label>Tài sản ròng thực tế (VNĐ)</label>
      <input id="hnet" class="money-input" value="${formatNumberInput(t.net)}">

      <label>Tổng thu nhập thực tế (VNĐ)</label>
      <input id="hinc" class="money-input" value="${formatNumberInput(t.totalIncomeMonthly)}">

      <label>Tổng chi phí thực tế (Chi sinh hoạt + Gốc Lãi) (VNĐ)</label>
      <input id="hexp" class="money-input" value="${formatNumberInput(t.totalExpenseMonthly)}">

      <label>Dòng tiền nợ lãi thực tế phải trả (VNĐ)</label>
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

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
save(); render();