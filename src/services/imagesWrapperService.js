import * as Comlink from "comlink";
import { writable } from "svelte/store";
const worker = new Worker("worker.js");

let images = writable([]);
let newestImages = writable([]);
let imageAdapter = writable([]);

let dataInterface = Comlink.wrap(worker);

export async function subscribeToImages() {
  return images;
}

export async function subscribeToNewestImages() {
  return newestImages;
}

async function loadImages() {
  var storedImages = localStorage.getItem("images") || "[]";
  const imagesArray = JSON.parse(storedImages);

  images.set(imagesArray);
  newestImages.set(getNewest(imagesArray));

  function callback(f) {
    imageAdapter.set(f);
  }
  dataInterface.subscribeToImages(Comlink.proxy(callback));

  imageAdapter.subscribe((f) => {
    // console.log("got call back from comlink", f);
    var valToAdd = Array.isArray(f) ? f : [f];

    var notYetStoredImages = valToAdd.filter(
      (x) => !imagesArray.some((a) => a.key == x.key)
    );

    if (notYetStoredImages.length == 0) {
      return;
    }

    imagesArray.push(...notYetStoredImages);

    imagesArray.sort((x, y) => y.insertTime - x.insertTime);

    let imagesForLocalStore = imagesArray.filter((x, idx) => idx < 10);
    localStorage.setItem("images", JSON.stringify(imagesForLocalStore));

    images.set(imagesArray);
    newestImages.set(getNewest(imagesArray));
  });
}

function getNewest(imagesArray) {
  return imagesArray.filter((x, idx) => idx < 1);
}

export async function deleteImageAndMetadata(...p) {
  return dataInterface.deleteImageAndMetadata(...p);
}

export async function saveImageAndMetadata(...p) {
  return dataInterface.saveImageAndMetadata(...p);
}

export async function loadFullSizeImage(image) {
  if (image.fullImageSizeUrl) {
    return Promise.resolve(image.fullImageSizeUrl);
  }
  const p1 = new Promise(async function (resolve, reject) {
    function callback(url) {
      resolve(url);
    }
    await dataInterface.preloadImageByKey(
      image.imageKey,
      Comlink.proxy(callback)
    );
  });
  return p1;
}

loadImages();
