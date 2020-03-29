import { CacheFirst, CacheOnly } from 'workbox-strategies'
import { clientsClaim, skipWaiting } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { preparePushMessage } from './pushMessageHandler.js'
import { registerRoute } from 'workbox-routing'
import { RangeRequestsPlugin } from 'workbox-range-requests'

const cacheName = 'webShareMediaCache'

registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'my-image-cache',
  })
)

const shareTargetHandler = async ({ event }) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage('Saving media locally...')
  }
  const formData = await event.request.formData()
  const mediaFiles = formData.getAll('media')
  const cache = await caches.open(cacheName)

  for (const mediaFile of mediaFiles) {
    // TODO: Instead of bailing, come up with a
    // default name for each possible MIME type.
    if (!mediaFile.name) {
      if (broadcastChannel) {
        broadcastChannel.postMessage('Sorry! No name found on incoming media.')
      }
      continue
    }
    await cache.put(
      // TODO: Handle scenarios in which mediaFile.name isn't set,
      // or doesn't include a proper extension.
      `${urlPrefix}${Date.now()}-${mediaFile.name}`,
      new Response(mediaFile, {
        headers: {
          'content-length': mediaFile.size,
          'content-type': mediaFile.type,
        },
      })
    )
  }

  // After the POST succeeds, redirect to the main page.
  return Response.redirect('/images?shareTarget', 303)
}

const cachedMediaHandler = new CacheOnly({
  cacheName,
  plugins: [
    // Support for cache requests that include a Range: header.
    new RangeRequestsPlugin(),
  ],
})

skipWaiting()
clientsClaim()

// This will be replaced by the list of files to precache by
// the `workbox injectManifest` build step.
//precacheAndRoute([{"revision":"6dc660bfa9e712bb4919143a13dae120","url":"components.css"},{"revision":"d505a2890daadfa4a5e9cf3ff1f5f587","url":"index.html"},{"revision":"2b083900296de0a3d197befc93103594","url":"main.css"},{"revision":"1f8eb21d2bc0113c3953a5666e10945d","url":"workbox-dev.js"}])

registerRoute('/_share-target', shareTargetHandler, 'POST')

registerRoute(new RegExp('/_media/'), cachedMediaHandler)

self.addEventListener('push', function (event) {
  var msg = preparePushMessage(event)
  event.waitUntil(self.registration.showNotification(msg.title, msg.options))
})
