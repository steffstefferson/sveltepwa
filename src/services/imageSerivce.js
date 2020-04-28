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

export function loadFullSizeImage(i) {
  return getDownloadUrl(i).then((url) => {
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

export function getDownloadUrl(i) {
  if (i.fullImageSizeUrl) {
    return Promise.resolve(i.fullImageSizeUrl);
  }

  let tangRef = storageRef.child("locations/" + i.imageKey + ".jpg");
  return tangRef.getDownloadURL().then((url) => {
    i.fullImageSizeUrl = url;
    return url;
  });
}
export function getImage() {}
