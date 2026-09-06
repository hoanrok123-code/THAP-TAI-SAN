function goals(){
  let t = totals();
  let netMonthlyCashflow = t.totalIncomeMonthly - t.totalExpenseMonthly - t.totalLoanInterest;

  let totalGoalsCount = S.goals ? S.goals.length : 0;
  let totalTargetSum = 0;
  let totalAchievedSum = 0;

  if (totalGoalsCount > 0) {
    S.goals.forEach(g => {
      let targetVal = +g.targetValue || 0;
      let startDate = g.startDate || new Date().toISOString().slice(0, 10);
      let targetDate = g.targetDate || new Date().toISOString().slice(0, 10);
      let startMs = new Date(startDate + "T00:00:00").getTime();
      let targetMs = new Date(targetDate + "T00:00:00").getTime();
      let diffMonths = Math.max(1, Math.round((targetMs - startMs) / (1000 * 60 * 60 * 24 * 30.44)));
      let extraAmount = +g.extraAmount || 0; 
      let totalAccumulatedCashflow = netMonthlyCashflow * diffMonths;
      let totalProjectedResources = totalAccumulatedCashflow + extraAmount + t.net;

      totalTargetSum += targetVal;
      totalAchievedSum += Math.min(targetVal, Math.max(0, totalProjectedResources));
    });
  }
  let overallProgressPct = totalTargetSum > 0 ? (totalAchievedSum / totalTargetSum) * 100 : 0;

  let h = `
    <div class="card">
      <div class="sectionhead">
        <div>
          <h2>Mục Tiêu Tài Chính</h2>
          <p class="small muted">Hoạch định giá trị, thời gian và tính toán dòng tiền/tài sản cần bổ sung.</p>
        </div>
        <button onclick="goalForm()">+ Thêm mục tiêu</button>
      </div>
    </div>
  `;

  if (!S.goals || S.goals.length === 0) {
    h += `<div class="card"><div class="small muted" style="text-align:center;padding:20px 0">Chưa có mục tiêu tài chính nào được thiết lập. Hãy bấm "+ Thêm mục tiêu" để bắt đầu.</div></div>`;
  } else {
    // 🌟 BẢNG TỔNG QUAN THEO DÕI NHANH CÁC MỤC TIÊU (Đúng 4 cột tiêu chí yêu cầu)
    h += `
      <div class="card" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">📊 Tổng Quan Theo Dõi Mục Tiêu</h3>
            <p class="small muted" style="margin: 2px 0 0 0;">Tiến độ tổng thể dựa trên năng lực tài chính hệ thống</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 16px; font-weight: 900; color: #2563eb;">${pct(overallProgressPct)}</span>
            <div style="font-size: 9px; color: #64748b; font-weight: 700;">ĐẠT ĐƯỢC</div>
          </div>
        </div>

        <div style="background: #ffffff; border-radius: 8px; height: 8px; width: 100%; overflow: hidden; margin-bottom: 12px; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(90deg, #3b82f6, #10b981); height: 100%; width: ${Math.min(100, overallProgressPct)}%; border-radius: 8px;"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    S.goals.forEach((g) => {
      let targetVal = +g.targetValue || 0;
      let startDate = g.startDate || new Date().toISOString().slice(0, 10);
      let targetDate = g.targetDate || new Date().toISOString().slice(0, 10);
      let startMs = new Date(startDate + "T00:00:00").getTime();
      let targetMs = new Date(targetDate + "T00:00:00").getTime();
      let diffMonths = Math.max(1, Math.round((targetMs - startMs) / (1000 * 60 * 60 * 24 * 30.44)));
      let extraAmount = +g.extraAmount || 0; 
      let totalAccumulatedCashflow = netMonthlyCashflow * diffMonths;
      let totalProjectedResources = totalAccumulatedCashflow + extraAmount + t.net;

      let achievedVal = Math.max(0, totalProjectedResources);
      let gap = targetVal - achievedVal;
      let itemPct = targetVal > 0 ? (achievedVal / targetVal) * 100 : 0;
      let badgeColor = itemPct >= 100 ? '#059669' : '#d97706';
      let badgeBg = itemPct >= 100 ? '#d1fae5' : '#fef3c7';

      h += `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <b style="font-size: 13px; color: #0f172a;">🎯 ${g.name}</b>
            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">
              Tỉ lệ đạt: ${pct(itemPct)}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 11px; text-align: center; background: #f8fafc; padding: 6px; border-radius: 6px;">
            <div>
              <div style="color: #64748b; font-size: 9px; font-weight: 600;">GIÁ TRỊ MỤC TIÊU</div>
              <div style="font-weight: 800; color: #0f172a;">${money(targetVal)}</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 9px; font-weight: 600;">GIÁ TRỊ ĐÃ CÓ</div>
              <div style="font-weight: 800; color: #059669;">${money(achievedVal)}</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 9px; font-weight: 600;">GIÁ TRỊ CÒN THIẾU</div>
              <div style="font-weight: 800; color: ${gap > 0 ? '#dc2626' : '#059669'};">${gap > 0 ? money(gap) : '0 đ (Đã đạt)'}</div>
            </div>
          </div>
        </div>
      `;
    });

    h += `
        </div>
      </div>
    `;

    // CHI TIẾT TỪNG MỤC TIÊU
    S.goals.forEach((g) => {
      let targetVal = +g.targetValue || 0;
      let startDate = g.startDate || new Date().toISOString().slice(0, 10);
      let targetDate = g.targetDate || new Date().toISOString().slice(0, 10);
      
      let startMs = new Date(startDate + "T00:00:00").getTime();
      let targetMs = new Date(targetDate + "T00:00:00").getTime();
      let diffMonths = Math.max(1, Math.round((targetMs - startMs) / (1000 * 60 * 60 * 24 * 30.44)));

      let extraAmount = +g.extraAmount || 0; 
      let totalAccumulatedCashflow = netMonthlyCashflow * diffMonths;
      let totalProjectedResources = totalAccumulatedCashflow + extraAmount + t.net;

      let gap = targetVal - totalProjectedResources;
      let requiredAdditionalMonthlyCashflow = diffMonths > 0 ? (gap > 0 ? gap / diffMonths : 0) : 0;

      h += `
        <div class="card" style="border-left: 4px solid #3b82f6;">
          <div class="sectionhead">
            <div>
              <h3 style="font-size:16px;color:#0f172a;margin-bottom:2px">${g.name}</h3>
              <div class="small muted">Thời gian: từ ${datef(startDate)} đến ${datef(targetDate)} (~${diffMonths} tháng)</div>
            </div>
            <div>
              <button class="secondary small-btn" onclick="goalForm('${g.id}')">Sửa</button>
              <button class="danger small-btn" onclick="delGoal('${g.id}')">Xóa</button>
            </div>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin:10px 0; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div>
              <div style="font-size:11px;color:#64748b;font-weight:600">Giá trị mục tiêu</div>
              <div style="font-size:15px;font-weight:900;color:#2563eb">${money(targetVal)}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#64748b;font-weight:600">Tiền thêm / Nợ phát sinh</div>
              <div style="font-size:15px;font-weight:900;color:${extraAmount >= 0 ? '#059669' : '#dc2626'}">${money(extraAmount)}</div>
            </div>
          </div>

          <div style="font-size:12px;color:#334155;line-height:1.6;margin-bottom:12px">
            • Dòng tiền thuần hiện tại: <b style="color:${netMonthlyCashflow>=0?'#059669':'#dc2626'}">${money(netMonthlyCashflow)}/tháng</b><br>
            • Tích lũy dòng tiền trong ${diffMonths} tháng: <b>${money(totalAccumulatedCashflow)}</b><br>
            • Tổng tài sản ròng dự kiến đạt được: <b>${money(totalProjectedResources)}</b>
          </div>

          <div style="background:${gap <= 0 ? '#d1fae5' : '#fef3c7'}; border:1px solid ${gap <= 0 ? '#10b981' : '#f59e0b'}; border-radius:8px; padding:10px; text-align:center;">
            ${gap <= 0 ? 
              `<div style="font-weight:700;color:#065f46;font-size:13px">🎉 Mục tiêu khả thi! Bạn đang vượt mức dự kiến ${money(Math.abs(gap))}.</div>` : 
              `<div style="font-weight:700;color:#92400e;font-size:13px">⚠️ Còn thiếu ${money(gap)} so với mục tiêu</div>
               <div style="font-size:11px;color:#78350f;margin-top:4px">Cần nâng thêm dòng tiền thuần mỗi tháng: <b style="color:#b45309">${money(requiredAdditionalMonthlyCashflow)}/tháng</b> hoặc bổ sung tài sản ngay.</div>`
            }
          </div>
        </div>
      `;
    });
  }

  document.getElementById("app").innerHTML = h;
}

function goalForm(id = null){
  let g = id ? S.goals.find(x => x.id === id) : {
    id: "g_" + Date.now(),
    name: "",
    targetValue: 0,
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    extraAmount: 0
  };

  let h = `
    <div class="card">
      <h2>${id ? "Sửa mục tiêu tài chính" : "Thêm mục tiêu tài chính mới"}</h2>
      
      <label>Tên mục tiêu</label>
      <input id="gname" value="${g.name}" placeholder="VD: Mua nhà, Mua xe, Tự do tài chính...">

      <label>Giá trị mục tiêu cần đạt (VNĐ)</label>
      <input id="gtarget" class="money-input" value="${formatNumberInput(g.targetValue)}">

      <div class="grid2">
        <div>
          <label>Ngày bắt đầu</label>
          <input id="gstart" type="date" value="${g.startDate}">
        </div>
        <div>
          <label>Ngày cần đạt được</label>
          <input id="gend" type="date" value="${g.targetDate}">
        </div>
      </div>

      <label>Số tiền khác có thể bỏ vào / Nợ phải trả thêm (VNĐ - Không giới hạn)</label>
      <input id="gextra" class="money-input" value="${formatNumberInput(g.extraAmount)}" placeholder="Nhập số dương nếu bỏ thêm tiền, số âm nếu phát sinh thêm nợ">
      <div class="small muted" style="margin-top:2px">Hệ thống cho phép nhập giá trị âm hoặc dương không giới hạn để phản ánh chính xác nguồn vốn bổ sung hoặc đòn bẩy nợ vay.</div>

      <br><br>
      <button onclick="saveGoal('${g.id}')">Lưu mục tiêu</button>
      <button class="secondary" onclick="render()">Hủy</button>
    </div>
  `;

  document.getElementById("app").innerHTML = h;
  document.querySelectorAll(".money-input").forEach(bindMoneyInput);
}

function saveGoal(id){
  let newGoal = {
    id: id,
    name: document.getElementById("gname").value || "Mục tiêu tài chính",
    targetValue: parseNumberInput(document.getElementById("gtarget").value),
    startDate: document.getElementById("gstart").value,
    targetDate: document.getElementById("gend").value,
    extraAmount: parseNumberInput(document.getElementById("gextra").value)
  };

  if(!S.goals) S.goals = [];
  let idx = S.goals.findIndex(x => x.id === id);
  if (idx >= 0) S.goals[idx] = newGoal;
  else S.goals.push(newGoal);

  save(); S.tab = "goals"; render();
}

function parseNumberInput(val) {
  if (!val) return 0;
  let str = val.toString().trim();
  let isNegative = str.startsWith("-");
  let clean = str.replace(/[^0-9,]/g, "").replace(",", ".");
  let num = parseFloat(clean) || 0;
  return isNegative ? -num : num;
}

function formatNumberInput(val) {
  if (val === undefined || val === null || val === "") return "";
  let isNegative = val < 0;
  let str = Math.abs(val).toString().replace(/\./g, "");
  let parts = str.split(",");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  let formatted = parts.join(",");
  return isNegative ? "-" + formatted : formatted;
}