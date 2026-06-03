// Mock service worker placeholder to prevent localhost service worker cache 404 spams
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Take control of all clients immediately
});
