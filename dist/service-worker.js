(function (workboxStrategies, workboxCore, workboxPrecaching, workboxRouting, workboxRangeRequests) {
  'use strict';

  function preparePushMessage(event) {
    if (event.data) {
      console.log('This push event has data: ', event.data.text());
    } else {
      console.log('This push event has no data.');
    }

    var pushMsg = convertMessage(event.data);
    if (pushMsg.type) {
      var options = prepareOptions(pushMsg);
      return { title: pushMsg.title, options }
    } else {
      console.log('This push event has no pushType.');
    }
  }

  function convertMessage(data) {
    try {
      return data.json()
    } catch (err) {
      console.log('could not jsonize ' + data.text(), err);
    }
    //return test message!
    return {
      type: 'message',
      title: 'Lurin just like to say that he is watching you!',
      message: '',
      timestamp: new Date(),
    }
  }

  function prepareOptions(pushMsg) {
    console.log('handle push msg:' + pushMsg.type);
    var data = { url: '/home' };

    if (pushMsg.type == 'newfact' || pushMsg.type == 'randomfact') {
      data = { url: '/facts?key=' + pushMsg.itemKey };
    }
    if (pushMsg.type == 'newimage' || pushMsg.type == 'randomimage') {
      data = { url: '/images/slideShow?key=' + pushMsg.itemKey };
    }

    const options = {
      badge: '/images/logo192m.png',
      icon: '/images/logo192m.png',
      body: pushMsg.message,
      data: data,
      vibrate: [500, 110, 500],
      timestamp: pushMsg.timestamp,
    };

    return options
  }

  const cacheName = 'webShareMediaCache';

  workboxRouting.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif)$/,
    new workboxStrategies.CacheFirst({
      cacheName: 'my-image-cache',
    })
  );

  const shareTargetHandler = async ({ event }) => {
    if (broadcastChannel) {
      broadcastChannel.postMessage('Saving media locally...');
    }
    const formData = await event.request.formData();
    const mediaFiles = formData.getAll('media');
    const cache = await caches.open(cacheName);

    for (const mediaFile of mediaFiles) {
      // TODO: Instead of bailing, come up with a
      // default name for each possible MIME type.
      if (!mediaFile.name) {
        if (broadcastChannel) {
          broadcastChannel.postMessage('Sorry! No name found on incoming media.');
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
      );
    }

    // After the POST succeeds, redirect to the main page.
    return Response.redirect('/images?shareTarget', 303)
  };

  const cachedMediaHandler = new workboxStrategies.CacheOnly({
    cacheName,
    plugins: [
      // Support for cache requests that include a Range: header.
      new workboxRangeRequests.RangeRequestsPlugin(),
    ],
  });

  workboxCore.skipWaiting();
  workboxCore.clientsClaim();

  // This will be replaced by the list of files to precache by
  // the `workbox injectManifest` build step.
  workboxPrecaching.precacheAndRoute([{"revision":"39480226559f5b8246f69f85b7e5c607","url":"components.css"},{"revision":"d505a2890daadfa4a5e9cf3ff1f5f587","url":"index.html"},{"revision":"2b083900296de0a3d197befc93103594","url":"main.css"}]);

  workboxRouting.registerRoute('/_share-target', shareTargetHandler, 'POST');

  workboxRouting.registerRoute(new RegExp('/_media/'), cachedMediaHandler);

  self.addEventListener('push', function (event) {
    var msg = preparePushMessage(event);
    event.waitUntil(self.registration.showNotification(msg.title, msg.options));
  });

}(workboxStrategies, workboxCore, workboxPrecaching, workboxRouting, workboxRangeRequests));
//# sourceMappingURL=service-worker_temp.js.map
