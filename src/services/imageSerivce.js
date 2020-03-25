import { storage, db } from './customfirebase'
import { writable } from 'svelte/store'

const storageRef = storage.ref()
let imagesArray = []

const svelteImageStore = writable([])

const imgFromStore = JSON.parse(localStorage.getItem('images'))

if (imgFromStore.length) {
  addImage(imgFromStore)
} else {
  console.log('load image from firebase')
  var metaRef = db.ref('imageMetaData')
  metaRef.on('child_added', function (snapshot) {
    var image = snapshot.val()
    image.key = snapshot.key
    addImage([image])
  })
  metaRef.on('child_removed', function (snapshot) {
    imagesArray = imagesArray.filter((p) => p.key !== snapshot.key)
    svelteImageStore.set(imagesArray)
  })
}

function addImage(imageArray) {
  imagesArray.push(...imageArray)
  imagesArray.sort((x, y) => y.insertTime - x.insertTime)
  svelteImageStore.set(imagesArray)
  localStorage.setItem('images', JSON.stringify(imagesArray))
}

export function getImages() {
  return svelteImageStore
}

function preloadImage(imageKey, offset) {
  const i = getImage(imageKey, offset, false)
  if (i.fullImageIsPreloaded) {
    return
  }
  i.loadFullSizeImage().then(() => {
    i.fullImageIsPreloaded = true
  })
}

function getDownloadUrl() {
  if (this.fullImageSizeUrl) {
    return Promise.resolve(this.fullImageSizeUrl)
  }

  var tangRef = storageRef.child('locations/' + this.imageKey + '.jpg')
  return tangRef.getDownloadURL().then((url) => {
    this.fullImageSizeUrl = url
    return url
  })
}

export function getImage(imageKey, offSet, preload = true) {
  var idx = imagesArray.findIndex((i) => i.imageKey == imageKey)
  idx += offSet
  if (idx < 0) {
    idx = imagesArray.length - 1
  }
  if (imagesArray.length <= idx) {
    idx = 0
  }

  var image = imagesArray[idx]

  if (preload) {
    preloadImage(image.imageKey, idx + offSet)
    preloadImage(image.imageKey, idx + offSet * 2)
  }

  image.getDownloadUrl = getDownloadUrl
  image.loadFullSizeImage = loadFullSizeImage
  return image
}

function loadFullSizeImage() {
  return this.getDownloadUrl().then((url) => {
    const p1 = new Promise(function (resolve, reject) {
      var newImg = new Image()
      newImg.onload = function () {
        resolve(url)
      }
      newImg.onerror = function () {
        reject()
      }
      newImg.src = url
    })
    return p1
  })
}
