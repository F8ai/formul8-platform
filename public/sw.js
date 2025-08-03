const CACHE_NAME = 'formul8-workspace-v1';
const urlsToCache = [
  '/',
  '/workspace',
  '/manifest.json',
  '/images/icon-192.svg',
  '/images/icon-512.svg',
  '/images/icon.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle shared files and URLs
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHARE_DATA') {
    // Handle shared data
    const { title, text, url, files } = event.data.data;
    
    // Store shared data for the app to pick up
    self.registration.active.postMessage({
      type: 'SHARED_DATA',
      data: { title, text, url, files }
    });
  }
});

// Background sync for file uploads when connectivity returns
self.addEventListener('sync', event => {
  if (event.tag === 'upload-files') {
    event.waitUntil(
      // Handle queued file uploads
      handleQueuedUploads()
    );
  }
});

async function handleQueuedUploads() {
  // Implementation for handling queued uploads when back online
  console.log('Handling queued uploads...');
}

// Push notifications support
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/images/icon-192.png',
    badge: '/images/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Workspace',
        icon: '/images/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Formul8 Workspace', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/workspace')
    );
  }
});