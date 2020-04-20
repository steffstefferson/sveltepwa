import {
  resizeImage,
  getOrientation,
  rotatePhoto,
} from "./imageResizeService.js";

export async function readFile(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = async function (e) {
      let orientation = await getOrientation(file);
      console.log(`orientation of photo is: ${orientation.degree}`);
      var rotatedResult = await rotatePhoto(
        e.target.result,
        orientation.degree
      );
      let promiseThumb = resizeImage(rotatedResult, 256);
      let promise = resizeImage(rotatedResult, 2048);
      Promise.all([promiseThumb, promise])
        .then((r) => {
          resolve(r);
        })
        .catch((e) => {
          console.log(e);
          reject(e);
        });
    };
    reader.readAsDataURL(file);
  });
}

export async function getImageFormUrl(url) {
  return new Promise(async (resolve, reject) => {
    let response = await fetch(url);
    let data = await response.blob();
    let metadata = {
      type: "image/jpeg",
    };
    let file = new File([data], "test.jpg", metadata);
    let orientation = await getOrientation(file);
    console.log(`orientation of photo is: ${orientation.degree}`);
    var rotatedResult = await rotatePhoto(url, orientation.degree);
    var promiseThumb = resizeImage(rotatedResult, 256);
    var promise = resizeImage(rotatedResult, 2048);
    Promise.all([promiseThumb, promise])
      .then((r) => {
        resolve(r);
      })
      .catch((e) => {
        console.log(e);
        reject(e);
      });
  });
}
