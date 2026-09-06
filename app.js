function updatePyramidStats(totalAsset, level2Amount, level3Amount, level4Amount, level5Amount) {
  const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  
  const getPercent = (amount) => totalAsset > 0 ? ((amount / totalAsset) * 100).toFixed(1) + '%' : '0%';

  document.getElementById('val-level-2').innerText = `${formatVND(level2Amount)} (${getPercent(level2Amount)})`;
  document.getElementById('val-level-3').innerText = `${formatVND(level3Amount)} (${getPercent(level3Amount)})`;
  document.getElementById('val-level-4').innerText = `${formatVND(level4Amount)} (${getPercent(level4Amount)})`;
  document.getElementById('val-level-5').innerText = `${formatVND(level5Amount)} (${getPercent(level5Amount)})`;
}