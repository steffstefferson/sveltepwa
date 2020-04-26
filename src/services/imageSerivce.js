import { storage, db } from "./customfirebase";
import { writable } from "svelte/store";

const storageRef = storage.ref();
let imagesArray = [];

export const svelteImageStore = writable([]);
export const svelteNewestImageStore = writable([]);

svelteImageStore.subscribe((images) => {
  const newest = images
    .sort((y, x) => x.insertTime > y.insertTime)
    .splice(0, 1);
  svelteNewestImageStore.set([...newest]);
});

const imgFromStore = JSON.parse(localStorage.getItem("images"));

if (imgFromStore && imgFromStore.length) {
  addImage(imgFromStore);
} else {
  console.log("load image from firebase");
  let metaRef = db.ref("imageMetaData");
  metaRef.on("child_added", function (snapshot) {
    let image = snapshot.val();
    image.key = snapshot.key;
    addImage([image]);
  });
  metaRef.on("child_removed", function (snapshot) {
    imagesArray = imagesArray.filter((p) => p.key !== snapshot.key);
    svelteImageStore.set([...imagesArray]);
    localStorage.setItem("images", JSON.stringify(imagesArray));
  });
}

function addImage(images) {
  let onlyNewOnes = images.filter(
    (img) => !imagesArray.some((x) => x.key == img.key)
  );
  imagesArray.push(...onlyNewOnes);
  imagesArray.sort((x, y) => y.insertTime - x.insertTime);
  svelteImageStore.set([...imagesArray]);
  localStorage.setItem("images", JSON.stringify(imagesArray));
}

function preloadImage(imageKey, offset) {
  const i = getImage(imageKey, offset, false);
  if (i.fullImageIsPreloaded) {
    return;
  }
  i.loadFullSizeImage().then(() => {
    i.fullImageIsPreloaded = true;
  });
}

function getDownloadUrl() {
  if (this.fullImageSizeUrl) {
    return Promise.resolve(this.fullImageSizeUrl);
  }

  let tangRef = storageRef.child("locations/" + this.imageKey + ".jpg");
  return tangRef.getDownloadURL().then((url) => {
    this.fullImageSizeUrl = url;
    return url;
  });
}

export function getImage(imageKey, offSet, preload = true) {
  let idx = imagesArray.findIndex((i) => i.key == imageKey);
  idx += offSet;
  if (idx < 0) {
    idx = imagesArray.length - 1;
  }
  if (imagesArray.length <= idx) {
    idx = 0;
  }

  let image = imagesArray[idx];

  if (preload) {
    preloadImage(image.key, idx + offSet);
    preloadImage(image.key, idx + offSet * 2);
  }

  image.getDownloadUrl = getDownloadUrl;
  image.loadFullSizeImage = loadFullSizeImage;
  return image;
}

function loadFullSizeImage() {
  return this.getDownloadUrl().then((url) => {
    const p1 = new Promise(function (resolve, reject) {
      let newImg = new Image();
      newImg.onload = function () {
        resolve(url);
      };
      newImg.onerror = function () {
        reject();
      };
      newImg.src = url;
    });
    return p1;
  });
}
