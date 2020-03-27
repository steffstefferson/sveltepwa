var cacheName = 'sgtoilet-cache-' + Date.now()
var filesToCache = [
  '/',
  '/index.html',
  '/main.css',
  '/main.js',
  '/components.css',
  'https://fonts.googleapis.com/css?family=Oswald|Roboto&display=swap',
]
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache)
    })
  )
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (thisCacheName) {
          if (thisCacheName !== cacheName) {
            return caches.delete(thisCacheName)
          }
        })
      )
    })
  )
})
self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async function () {
      const response = await caches.match(e.request)
      return response || fetch(e.request)
    })()
  )
})

self.addEventListener('push', function (event) {
  if (event.data) {
    console.log('This push event has data: ', event.data.text())
  } else {
    console.log('This push event has no data.')
  }

  var pushMsg = convertMessage(event.data)
  if (pushMsg.type) {
    event.waitUntil(handlePushMessage(pushMsg))
  } else {
    console.log('This push event has no pushType.')
  }
})

function convertMessage(data) {
  try {
    return data.json()
  } catch (err) {
    console.log('could not jsonize ' + data.text(), err)
  }
  //return test message!
  return {
    type: 'message',
    title: 'Lurin just like to say that he is watching you!',
    message: '',
    timestamp: new Date(),
  }
}

function handlePushMessage(pushMsg) {
  console.log('handle push msg:' + pushMsg.type)
  var data = { url: '/home' }
  if (
    (pushMsg.itemKey && pushMsg.type == 'newfact') ||
    pushMsg.type == 'randomfact'
  ) {
    data = { url: '/facts?key=' + pushMsg.itemKey }
  }
  if (
    (pushMsg.itemKey && pushMsg.type == 'newimage') ||
    pushMsg.type == 'randomimage'
  ) {
    data = { url: '/images/slideShow?key= + pushMsg.itemKey }
  }

  const options = {
    badge: '/images/logo192m.png',
    icon: '/images/logo192m.png',
    body: pushMsg.message,
    data: data,
    vibrate: [500, 110, 500],
    timestamp: pushMsg.timestamp,
  }

  return self.registration.showNotification(pushMsg.title, options)
}
