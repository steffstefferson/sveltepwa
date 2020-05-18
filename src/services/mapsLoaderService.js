import { writable } from "svelte/store";
import config from "./../config.js";

const isLoaded = writable(false);
let scriptInjected = false;

window.mapsLoaded = function () {
  window.googleMapsLoaded = true;
  console.log("maps loaded");
};

export function loadMapScript() {
  if (!scriptInjected) {
    var script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      config.secret.googleMapsApiKey +
      "&callback=mapsLoaded";
    document.head.appendChild(script);
    scriptInjected = true;
    setTimeout(checkIfMapsIsLoaded, 300);
  }
  return isLoaded;
}

function checkIfMapsIsLoaded() {
  if (window.googleMapsLoaded) {
    isLoaded.set(true);
  } else {
    setTimeout(checkIfMapsIsLoaded, 300);
  }
}
