/* ===================================================
   ỨNG DỤNG QUẢN LÝ THÁP TÀI SẢN (FINANCIAL TOWER APP)
   =================================================== */

// Config cấu trúc các tầng tháp tài sản
const LAYERS_CONFIG = [
  { id: 1, name: "1. Nền tảng năng lực cá nhân", minPct: 0, maxPct: 0, color: "#1e3a8a", desc: "Sức khỏe, kiến thức, kỹ năng, mối quan hệ" },
  { id: 2, name: "2. Tài sản phải có (Bảo vệ & Dự phòng)", minPct: 10, maxPct: 15, color: "#2563eb", desc: "Quỹ dự phòng 6-18 tháng chi phí, bảo hiểm" },
  { id: 3, name: "3. Tài sản thu nhập (Tạo dòng tiền)", minPct: 20, maxPct: 35, color: "#d97706", desc: "BĐS cho thuê, cổ tức, tiền gửi, trái phiếu" },
  { id: 4, name: "4. Tài sản tăng trưởng", minPct: 45, maxPct: 60, color: "#16a34a", desc: "Cổ phiếu, Quỹ ETF, BĐS tăng giá dài hạn" },
  { id: 5, name: "5. Tài sản đầu cơ", minPct: 0, maxPct: 10, color: "#059669", desc: "Crypto, cổ phiếu lướt sóng, rủi ro cao" }
];

// Local Storage Helper
const STORAGE_KEY = "FINANCIAL_TOWER_DATA_V1";

let S = {
  assets: [],
  expenses: 400000000, // Chi tiêu mặc định ~400tr/năm
  targetPassiveIncome: 1200000000 // Mục tiêu thụ động ~1.2tỷ/năm
};

// Khởi tạo và đọc dữ liệu cũ
function initData() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      S = JSON.parse(localData);
    } catch (e) {
      console.error("Lỗi đọc dữ liệu cũ, dùng mặc định", e);
    }
  } else {
    // Dữ liệu mẫu ban đầu nếu chưa có dữ liệu
    S.assets = [
      { id: 1, name: "Quỹ dự phòng khẩn cấp", value: 470000000, layer: 2 },
      { id: 2, name: "Bất động sản cho thuê", value: 4000000000, layer: 3 },
      { id: 3, name: "Danh mục Cổ phiếu & ETF", value: 4500000000, layer: 4 },
      { id: 4, name: "Tài khoản Crypto & Đầu cơ", value: 400000000, layer: 5 }
    ];
    saveData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
}

// Formatters
const money = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
const pct = (val) => (val || 0).toFixed(1) + '%';

// ===================================================
// HÀM RENDER DASHBOARD (CÓ TÍCH HỢP THÁP SVG TỰ ĐỘNG)
// ===================================================
function dashboard() {
  const totalVal = S.assets.reduce((sum, a) => sum + (+a.value || 0), 0) || 1;

  // Lấy giá trị thực tế từng tầng (1 -> 5)
  const l1 = S.assets.filter(a => +a.layer === 1).reduce((s, a) => s + (+a.value || 0), 0);
  const l2 = S.assets.filter(a => +a.layer === 2).reduce((s, a) => s + (+a.value || 0), 0);
  const l3 = S.assets.filter(a => +a.layer === 3).reduce((s, a) => s + (+a.value || 0), 0);
  const l4 = S.assets.filter(a => +a.layer === 4).reduce((s, a) => s + (+a.value || 0), 0);
  const l5 = S.assets.filter(a => +a.layer === 5).reduce((s, a) => s + (+a.value || 0), 0);

  // Phần trăm thực tế
  const p1 = (l1 / totalVal) * 100;
  const p2 = (l2 / totalVal) * 100;
  const p3 = (l3 / totalVal) * 100;
  const p4 = (l4 / totalVal) * 100;
  const p5 = (l5 / totalVal) * 100;

  return `
    <!-- Styles CSS Trực Quan Hóa Tháp Tài Sản -->
    <style>
      .pyramid-card { background: #ffffff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
      .pyramid-container { width: 100%; max-width: 420px; margin: 16px auto 24px; }
      .pyramid-svg { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.12)); }
      .pyramid-layer { transition: transform 0.2s ease, opacity 0.2s ease; cursor: pointer; }
      .pyramid-layer:hover { opacity: 0.95; transform: translateY(-2px); }
      .pyramid-label { fill: #ffffff; font-size: 11px; font-weight: 800; text-anchor: middle; font-family: -apple-system, sans-serif; pointer-events: none; }
      .pyramid-sub { fill: rgba(255, 255, 255, 0.9); font-size: 9.5px; font-weight: 600; text-anchor: middle; font-family: -apple-system, sans-serif; pointer-events: none; }
      .tower-analysis { display: flex; flex-direction: column; gap: 16px; margin-top: 12px; }
      .tower-row { border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
      .tower-row:last-child { border-bottom: none; }
      .tower-row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 14px; }
      .layer-title { font-weight: 700; color: #1e293b; }
      .layer-stat { color: #64748b; }
      .bar-bg { height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 6px 0; }
      .bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
      .bar-fill.good { background-color: #10b981; }
      .bar-fill.warn { background-color: #f59e0b; }
      .bar-fill.bad  { background-color: #ef4444; }
      .row-sub { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
      .text-good { color: #10b981; font-weight: 600; }
      .text-warn { color: #d97706; font-weight: 600; }
      .text-bad  { color: #ef4444; font-weight: 600; }
    </style>

    <div class="card pyramid-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="margin:0; font-size:18px;">Tỷ lệ Tháp Tài Sản</h3>
          <p style="margin:2px 0 0; font-size:12px; color:#64748b;">Mô hình phân bổ tài sản chuẩn hóa</p>
        </div>
        <span style="font-size:12px; color:#94a3b8; font-weight:500;">Thực tế vs Chuẩn</span>
      </div>

      <!-- Trực Quan Hóa Kim Tự Tháp SVG Sharp & Vector -->
      <div class="pyramid-container">
        <svg viewBox="0 0 400 250" class="pyramid-svg">
          <defs>
            <linearGradient id="g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>
            <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4ade80"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient>
          </defs>

          <!-- Tầng 5: Đầu Cơ -->
          <g class="pyramid-layer">
            <polygon points="200,10 162,54 238,54" fill="url(#g5)"/>
            <text x="200" y="34" class="pyramid-label">5. Đầu cơ</text>
            <text x="200" y="46" class="pyramid-sub">${pct(p5)}</text>
          </g>

          <!-- Tầng 4: Tăng Trưởng -->
          <g class="pyramid-layer">
            <polygon points="159,58 241,58 277,102 123,102" fill="url(#g4)"/>
            <text x="200" y="78" class="pyramid-label">4. Tăng trưởng</text>
            <text x="200" y="92" class="pyramid-sub">${pct(p4)} (Chuẩn 45-60%)</text>
          </g>

          <!-- Tầng 3: Thu Nhập -->
          <g class="pyramid-layer">
            <polygon points="120,106 280,106 316,150 84,150" fill="url(#g3)"/>
            <text x="200" y="126" class="pyramid-label">3. Tài sản thu nhập</text>
            <text x="200" y="140" class="pyramid-sub">${pct(p3)} (Chuẩn 20-35%)</text>
          </g>

          <!-- Tầng 2: Bảo Vệ & Dự Phòng -->
          <g class="pyramid-layer">
            <polygon points="81,154 319,154 355,198 45,198" fill="url(#g2)"/>
            <text x="200" y="174" class="pyramid-label">2. Tài sản phải có</text>
            <text x="200" y="188" class="pyramid-sub">${pct(p2)} (Chuẩn 10-15%)</text>
          </g>

          <!-- Tầng 1: Nền Tảng -->
          <g class="pyramid-layer">
            <polygon points="42,202 358,202 394,246 6,246" fill="url(#g1)"/>
            <text x="200" y="222" class="pyramid-label">1. Nền tảng năng lực cá nhân</text>
            <text x="200" y="236" class="pyramid-sub">Sức khỏe • Kỹ năng • Mối quan hệ</text>
          </g>
        </svg>
      </div>

      <!-- Danh Sách Tiến Độ & Chỉ Số Chi Tiết -->
      <div class="tower-analysis">
        ${LAYERS_CONFIG.slice(1).map(cfg => {
          let layerVal = S.assets.filter(a => +a.layer === cfg.id).reduce((s, a) => s + (+a.value || 0), 0);
          let realPct = (layerVal / totalVal) * 100;
          let statusClass = "good";
          let statusText = "Đạt chuẩn";

          if (realPct < cfg.minPct) {
            statusClass = "warn";
            statusText = `Thiếu (Cần ${cfg.minPct}%)`;
          } else if (cfg.maxPct > 0 && realPct > cfg.maxPct) {
            statusClass = "bad";
            statusText = `Thừa (Tối đa ${cfg.maxPct}%)`;
          }

          return `
            <div class="tower-row">
              <div class="tower-row-header">
                <span class="layer-title">${cfg.name}</span>
                <span class="layer-stat"><b>${pct(realPct)}</b> <small>(${cfg.minPct}-${cfg.maxPct}%)</small></span>
              </div>
              <div class="bar-bg">
                <div class="bar-fill ${statusClass}" style="width: ${Math.min(100, realPct)}%"></div>
              </div>
              <div class="row-sub">
                <span>Giá trị: <b>${money(layerVal)}</b></span>
                <span class="text-${statusClass}">${statusText}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Khởi tạo chạy ứng dụng khi DOM tải xong
document.addEventListener("DOMContentLoaded", () => {
  initData();
  const mainApp = document.getElementById("app");
  if (mainApp) {
    mainApp.innerHTML = dashboard();
  }
});