import { db, storage } from "./customfirebase";
let imagesArray = [];
const storageRef = storage.ref();
export function subscribeToImages(callback) {
  const imgFromStore = ""; // JSON.parse(localStorage.getItem("images"));

  if (imgFromStore && imgFromStore.length) {
    addImage(imgFromStore);
  } else {
    console.log("load image from firebase");
    let metaRef = db.ref("imageMetaData");
    metaRef.on("child_added", function (snapshot) {
      let image = snapshot.val();
      image.key = snapshot.key;
      addImage([image]);
      callback(image);
    });
    metaRef.on("child_removed", function (snapshot) {
      imagesArray = imagesArray.filter((p) => p.key !== snapshot.key);
      svelteImageStore.set([...imagesArray]);
      localStorage.setItem("images", JSON.stringify(imagesArray));
      callback(imagesArray);
    });
  }
}

function addImage(images) {
  let onlyNewOnes = images.filter(
    (img) => !imagesArray.some((x) => x.key == img.key)
  );
  imagesArray.push(...onlyNewOnes);
  imagesArray.sort((x, y) => y.insertTime - x.insertTime);
  // svelteImageStore.set([...imagesArray]);
  //localStorage.setItem("images", JSON.stringify(imagesArray));
}

export function getDownloadUrl(imageKey, callback) {
  let tangRef = storageRef.child("locations/" + imageKey + ".jpg");
  tangRef.getDownloadURL().then((url) => {
    callback(url);
  });
}
