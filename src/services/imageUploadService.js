import { db, storage } from "./customfirebase";
import { writable } from "svelte/store";
var firebaseMetaData = db.ref().child("imageMetaData");

export function saveImageAndMetadata(metaData, image, thumbnail) {
  return saveImage(image).then(imageKey => {
    metaData.imageKey = imageKey;
    metaData.thumbnail = thumbnail;
    return saveMetaData(metaData);
  });
}

function saveImage(image) {
  var imageKey = +new Date();
  var ref = storageRef.child(toImageUrl(imageKey));
  return ref.putString(image, "data_url").then(function() {
    return imageKey;
  });
}

function saveMetaData(metaData) {
  var firebaseMetaDataRef = firebaseMetaData.push();
  return firebaseMetaDataRef.set(metaData).then(error => {
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

var getDownloadUrl = function(imageKey) {
  if (tempDownloadUrl[imageKey]) {
    return $q.resolve(tempDownloadUrl[imageKey]);
  }

  var tangRef = storageRef.child("locations/" + imageKey + ".jpg");
  return tangRef.getDownloadURL().then(function(url) {
    tempDownloadUrl[imageKey] = url;
    return url;
  });
};
