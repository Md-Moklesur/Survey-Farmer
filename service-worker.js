// প্রতিবার নতুন আপডেট আপলোড করলে এই ভার্সন নম্বরটা বাড়িয়ে দাও (v2 -> v3 -> v4 ...)
// এটা পুরনো ক্যাশ মুছে ফেলে নতুন ফাইল নিতে বাধ্য করবে।
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'village-info-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// নতুন সার্ভিস ওয়ার্কার ইন্সটল হওয়ার সাথে সাথেই একটিভ হয়ে যাবে
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// পুরনো ক্যাশ ভার্সন মুছে ফেলা এবং সব খোলা ট্যাব/অ্যাপে নতুন ভার্সন প্রয়োগ করা
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const isPageRequest = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isPageRequest) {
    // পেজ (index.html) খোলার সময় সবসময় আগে ইন্টারনেট থেকে সর্বশেষ ভার্সন আনার চেষ্টা করবে।
    // ইন্টারনেট না থাকলে সেভ করা (cache) ভার্সন দেখাবে, যাতে অফলাইনেও অ্যাপ কাজ করে।
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // অন্যান্য ফাইল (আইকন, manifest) আগে ক্যাশ থেকে দেখাবে, না থাকলে নেটওয়ার্ক থেকে আনবে
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
