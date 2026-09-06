// MỖI LẦN UP CODE MỚI: Chỉ cần đổi số này (v1 -> v2 -> v3...)
const CACHE_NAME = 'thap-tai-san-v2';

// 1. Cài đặt và bỏ qua thời gian chờ
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Kích hoạt và XÓA SẠCH cache cũ ngay lập tức
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Xóa cache cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Ưu tiên tải từ Network trước, nếu mất mạng mới dùng Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});