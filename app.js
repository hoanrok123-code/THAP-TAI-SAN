// Khởi tạo mảng tài sản từ LocalStorage
let assets = JSON.parse(localStorage.getItem('assets')) || [];

const assetForm = document.getElementById('asset-form');
const assetList = document.getElementById('asset-list');

// Định dạng tiền tệ VNĐ
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Cập nhật số liệu tính toán lên Tháp
function updatePyramidUI() {
  let totals = { 2: 0, 3: 0, 4: 0, 5: 0 };
  let grandTotal = 0;

  assets.forEach(item => {
    const amt = parseFloat(item.amount) || 0;
    if (totals[item.level] !== undefined) {
      totals[item.level] += amt;
      grandTotal += amt;
    }
  });

  const getPercent = (amt) => grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) + '%' : '0%';

  document.getElementById('val-level-2').innerText = `${formatVND(totals[2])} (${getPercent(totals[2])})`;
  document.getElementById('val-level-3').innerText = `${formatVND(totals[3])} (${getPercent(totals[3])})`;
  document.getElementById('val-level-4').innerText = `${formatVND(totals[4])} (${getPercent(totals[4])})`;
  document.getElementById('val-level-5').innerText = `${formatVND(totals[5])} (${getPercent(totals[5])})`;
}

// Render danh sách tài sản bên dưới
function renderAssetList() {
  assetList.innerHTML = '';
  
  if (assets.length === 0) {
    assetList.innerHTML = '<p style="color:#64748b; text-align:center;">Chưa có tài sản nào được ghi nhận.</p>';
    return;
  }

  assets.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'asset-item';
    div.innerHTML = `
      <div>
        <strong>${item.name}</strong> <br>
        <small style="color:#64748b;">Tầng ${item.level} - ${formatVND(item.amount)}</small>
      </div>
      <button class="btn-delete" onclick="deleteAsset(${index})">Xóa</button>
    `;
    assetList.appendChild(div);
  });
}

// Thêm tài sản mới
assetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('asset-name').value;
  const amount = parseFloat(document.getElementById('asset-amount').value);
  const level = parseInt(document.getElementById('asset-level').value);

  if (name && amount) {
    assets.push({ name, amount, level });
    localStorage.setItem('assets', JSON.stringify(assets));
    
    assetForm.reset();
    init();
  }
});

// Xóa tài sản
function deleteAsset(index) {
  assets.splice(index, 1);
  localStorage.setItem('assets', JSON.stringify(assets));
  init();
}

// Chạy khởi tạo ban đầu
function init() {
  renderAssetList();
  updatePyramidUI();
}

document.addEventListener('DOMContentLoaded', init);