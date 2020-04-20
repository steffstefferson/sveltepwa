import { CacheFirst, CacheOnly } from "workbox-strategies";
import { clientsClaim, skipWaiting } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { preparePushMessage } from "./pushMessageHandler.js";
import { registerRoute } from "workbox-routing";
import { RangeRequestsPlugin } from "workbox-range-requests";
import {
  addMediaToCache,
  webShareMediaCache,
} from "./../services/imageMediaDataCache";

const shareTargetHandler = async ({ event }) => {
  console.log("Saving media locally...");
  const formData = await event.request.formData();
  const mediaFiles = formData.getAll("media");

  for (const mediaFile of mediaFiles) {
    // TODO: Instead of bailing, come up with a
    // default name for each possible MIME type.
    if (!mediaFile.name) {
      console.log("Sorry! No name found on incoming media.");
      continue;
    }
    await addMediaToCache("image", mediaFile);
  }

  // After the POST succeeds, redirect to the main page.
  return Response.redirect("/addImage?shareTarget", 303);
};

const cachedMediaHandler = new CacheOnly({
  cacheName: webShareMediaCache,
  plugins: [
    // Support for cache requests that include a Range: header.
    new RangeRequestsPlugin(),
  ],
});

skipWaiting();
clientsClaim();

// This will be replaced by the list of files to precache by
// the `workbox injectManifest` build step.
precacheAndRoute(self.__WB_MANIFEST);

registerRoute("/_share-target", shareTargetHandler, "POST");

registerRoute(new RegExp("/_media/"), cachedMediaHandler);

registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: "my-image-cache",
  })
);

// test content: {"type":"newfact","itemKey":"-Ldehm5uG6-Aij15awKw","message":"newfact!!","title":"pushTitle"}
self.addEventListener("push", function (event) {
  var msg = preparePushMessage(event);
  event.waitUntil(self.registration.showNotification(msg.title, msg.options));
});
