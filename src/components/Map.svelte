<script>
  import { onMount } from "svelte";
  import { Icon } from "@smui/icon-button";
  import { tick } from "svelte";
  import { subscribeToImages } from "./../services/imagesWrapperService.js";
  import page from "page";
  export let params;
  let map;
  let mapElement;
  let markers = [];
  let online = window.navigator.onLine;
  var loadState = "";
  let addedImagesKeys = [];

  function initMap() {
    if (!window.googleMapsLoaded) {
      return;
    }
    let initialCoords = { lat: 46.65, lng: 7.709 };

    map = new google.maps.Map(mapElement, {
      center: initialCoords,
      zoom: 3
    });
  }

  function addImageToMap(image) {
    if (markers.some(x => x.key == image.key)) {
      return;
    }

    var marker = new google.maps.Marker({
      position: { lat: image.location.latitude, lng: image.location.longitude },
      title: image.imageTitle,
      map: map,
      animation: google.maps.Animation.DROP
    });
    marker.key = image.key;
    marker.addListener("click", function() {
      createInfoWindow(image, marker);
    });
    marker.addListener("mouseover", function() {
      createInfoWindow(image, marker);
    });
    markers.push(marker);

    if (params.key == image.key) {
      createInfoWindow(image, marker);
    }
  }

  async function addImagesToMap(images) {
    while (images.length > 0) {
      let i = 0;
      while (images.length > 0 && i++ < 10) {
        var img = images.pop();
        if (!addedImagesKeys.find(x => x.key == img.key)) {
          delayedAdd(img);
          addedImagesKeys.push(img.key);
        }
      }
    }
  }

  function delayedAdd(img) {
    window.setTimeout(function() {
      addImageToMap(img);
    }, 1000 + Math.random() * 7000);
  }

  onMount(async () => {
    if (!online) {
      loadState = "offline";
      return;
    }
    (await subscribeToImages()).subscribe(addImagesToMap);
    loadState = "loading";
    waitForMapToLoaded();
  });

  function waitForMapToLoaded() {
    if (window.googleMapsLoaded) {
      loadState = "loaded";
      initMap();
    } else {
      setTimeout(waitForMapToLoaded, 500);
    }
  }

  function getTemplate(image) {
    return `<div id="content" class="markerPopUp">
    <h2>${image.imageTitle}</h2>
    <div>
    <img src="${image.thumbnail}" alt="${image.imageTitle}" />
    <p>${image.funFact}</p>
    </div></div>`;
  }
  let infowindow = null;
  function createInfoWindow(image, marker) {
    if (infowindow) {
      infowindow.close();
    }
    infowindow = new google.maps.InfoWindow({
      content: getTemplate(image)
    });
    infowindow.open(map, marker);
    page("/map?key=" + marker.key);
  }

  window.mapsLoaded = function() {
    window.googleMapsLoaded = true;
    console.log("maps loaded");
  };
</script>

<style type="text/postcss">
  .mapContainer {
    height: calc(100% - 50px);
    width: 100%;
    position: absolute;
    left: 0px;
  }

  #map {
    height: 100%;
    width: 100%;
  }

  :global(.markerPopUp) {
    padding: 10px;

    text-align: center;
    max-width: 210px;
  }

  @media (prefers-color-scheme: dark) {
    :global(.gm-style-iw-d) {
      background-color: black !important;
      overflow: hidden !important;
    }
    :global(.gm-style-iw) {
      background-color: black !important;
    }
    :global(.gm-style-iw-t::after) {
      background: black !important;
    }
  }
  :global(.markerPopUp img) {
    max-height: 150px;
  }
</style>

<svelte:head>
  <script
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCkg9lEDwpI3a_YteembM0t_iOmR3jdOD8&callback=mapsLoaded"
    defer>

  </script>
</svelte:head>
{#if loadState == 'loading'}
  <h1>Waiting for google maps to load....</h1>
{:else if loadState == 'offline'}
  <h1>Sorry, Google Maps only work when online!</h1>
  Go to
  <a href="/images">Images</a>
  instead.
{/if}

<div class="mapContainer">
  <div id="map" bind:this={mapElement} />
</div>
