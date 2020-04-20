export function resizeImage(src, size) {
  return loadImage(src).then((img) => {
    return resizeLoadedImage(img, size);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function onload() {
      resolve(img);
    };
    img.onerror = function onerror(e) {
      reject(e);
    };
    img.src = src;
  });
}

var resizeLoadedImage = function (image, size) {
  var mainCanvas = document.createElement("canvas");
  //portrait or landscape image?
  mainCanvas.width = image.width;
  mainCanvas.height = image.height;
  var ctx = mainCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0, mainCanvas.width, mainCanvas.height);
  //size = parseInt($('#size').get(0).value, 10);
  while (mainCanvas.width > size || mainCanvas.height > size) {
    mainCanvas = halfSize(mainCanvas);
  }
  return mainCanvas.toDataURL("image/jpeg");
};

/*
 * Draw initial canvas on new canvas and half it's size
 */
var halfSize = function (i) {
  var canvas = document.createElement("canvas");
  canvas.width = i.width / 2;
  canvas.height = i.height / 2;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(i, 0, 0, canvas.width, canvas.height);
  return canvas;
};

function getOrientationFromArrayBuffer(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0, false) !== 0xffd8) {
    return -2;
  }
  const length = view.byteLength;
  let offset = 2;
  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return -1;
    const marker = view.getUint16(offset, false);
    offset += 2;
    if (marker === 0xffe1) {
      offset += 2;
      if (view.getUint32(offset, false) !== 0x45786966) {
        return -1;
      }

      const little = view.getUint16((offset += 6), false) === 0x4949;
      offset += view.getUint32(offset + 4, little);
      const tags = view.getUint16(offset, little);
      offset += 2;
      for (let i = 0; i < tags; i += 1) {
        if (view.getUint16(offset + i * 12, little) === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, little);
        }
      }
      // eslint-disable-next-line no-bitwise
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }
  return -1;
}

function getOrientationNumber(fileBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function loaded(e) {
      resolve(getOrientationFromArrayBuffer(e.target.result));
    };
    reader.onerror = function error(e) {
      reject(e);
    };
    reader.readAsArrayBuffer(fileBlob);
  });
}

export function getOrientation(fileBlob) {
  return getOrientationNumber(fileBlob).then((orientation) => {
    let degree = 0;
    switch (orientation) {
      case 1:
      case 2:
        degree = 0;
        break;
      case 3:
      case 4:
        degree = 180;
        break;
      case 5:
      case 6:
        degree = 90;
        break;
      case 7:
      case 8:
        degree = 270;
        break;
      default:
        degree = 0;
        break;
    }
    return { degree, orientation };
  });
}

export function rotatePhoto(file, degree) {
  return loadImage(file).then((image) => {
    const canvas = document.createElement("canvas");
    const canvasContext = canvas.getContext("2d");

    switch (degree) {
      default:
      case 0:
        canvas.setAttribute("width", image.width);
        canvas.setAttribute("height", image.height);
        canvasContext.rotate((degree * Math.PI) / 180);
        canvasContext.drawImage(image, 0, 0);
        break;
      case 90:
        canvas.setAttribute("width", image.height);
        canvas.setAttribute("height", image.width);
        canvasContext.rotate((degree * Math.PI) / 180);
        canvasContext.drawImage(image, 0, -image.height);
        break;
      case 180:
        canvas.setAttribute("width", image.width);
        canvas.setAttribute("height", image.height);
        canvasContext.rotate((degree * Math.PI) / 180);
        canvasContext.drawImage(image, -image.width, -image.height);
        break;
      case 270:
      case -90:
        canvas.setAttribute("width", image.height);
        canvas.setAttribute("height", image.width);
        canvasContext.rotate((degree * Math.PI) / 180);
        canvasContext.drawImage(image, -image.width, 0);
        break;
    }
    return canvas.toDataURL("image/jpeg");
  });
}
