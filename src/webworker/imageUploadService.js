import { db, storage } from "./customfirebase";
import { triggerPush } from "./pushService";
const firebaseMetaData = db.ref().child("imageMetaData");
const storageRef = storage.ref();
export function saveImageAndMetadata(metaData, image, thumbnail) {
  return saveImage(image).then((imageKey) => {
    metaData.imageKey = imageKey;
    metaData.thumbnail = thumbnail;
    var ok = saveMetaData(metaData);
    if (ok) {
      triggerPush();
    }
    return ok;
  });
}

function saveImage(image) {
  var imageKey = +new Date();
  var ref = storageRef.child(toImageUrl(imageKey));
  return ref.putString(image, "data_url").then(function () {
    return imageKey;
  });
}

function saveMetaData(metaData) {
  var firebaseMetaDataRef = firebaseMetaData.push();
  return firebaseMetaDataRef.set(metaData).then((error) => {
    if (error) {
      return false;
    } else {
      console.log("metadata uploaded under hash:" + firebaseMetaDataRef.key);
      return true;
    }
  });
}

function toImageUrl(imageKey) {
  return "locations/" + imageKey + ".jpg";
}

export function deleteImageAndMetadata(metaData) {
  return Promise.all([
    deleteMetadata(metaData),
    deleteImage(metaData.imageKey),
  ]);
}

var deleteMetadata = function (metaData) {
  return firebaseMetaData.child(metaData.key).remove();
};

var deleteImage = function (imageKey) {
  var deleteRef = storageRef.child(toImageUrl(imageKey));
  return deleteRef.delete();
};
