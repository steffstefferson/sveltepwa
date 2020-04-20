export let webShareMediaCache = "webShareMediaCache";
async function getCachedMedia() {
  const cache = await caches.open(webShareMediaCache);
  const requests = await cache.keys();
  return Promise.all(
    requests.reverse().map(async (request) => {
      const response = await cache.match(request);
      return {
        contentType: response.headers.get("content-type"),
        src: request.url,
      };
    })
  );
}

export async function deleteCachedMediaMetadata(imageSrc) {
  const cache = await caches.open(webShareMediaCache);
  const requests = await cache.keys();
  var request = requests.filter((x) => x.url == imageSrc);
  return await cache.delete(request.length > 0 ? request[0] : null);
}

export async function getCachedMediaMetadata(contentTypePrefix) {
  const cachedMetadata = await getCachedMedia();
  return cachedMetadata.filter((metadata) =>
    metadata.contentType.startsWith(contentTypePrefix)
  );
}

export async function getCachedMediaMetadataForURL(url) {
  const cachedMetadata = await getCachedMedia();
  return cachedMetadata.find((metadata) => metadata.src === url);
}

export async function addMediaToCache(urlPrefix, mediaFile) {
  const cache = await caches.open(webShareMediaCache);
  await cache.put(
    `/_media/${urlPrefix}${Date.now()}-${mediaFile.name}`,
    new Response(mediaFile, {
      headers: {
        "content-length": mediaFile.size,
        "content-type": mediaFile.type,
      },
    })
  );
}
