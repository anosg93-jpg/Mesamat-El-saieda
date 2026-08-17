const CACHE_NAME = 'sayyida-zeinab-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './images/logotempo.png',
  './images/default.jpg'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting(); // التفعيل الفوري لإلغاء النسخ القديمة
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// تفعيل النسخة الجديدة وإزالة الكاش القديم فوراً لدى الزبائن
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية لجلب أحدث التعديلات فوراً وتحديث الصفحة تلقائياً
self.addEventListener('fetch', (event) => {
  // للطلبات الرئيسية مثل index.html نستخدم استراتيجية Network First
  if (event.request.mode === 'navigate' || event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // باقي الملفات والصور
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // إرجاع الملف من الكاش وتحديثه في الخلفية
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* التكيف في حال عدم وجود شبكة */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
