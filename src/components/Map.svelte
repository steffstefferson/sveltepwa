<script>
import { onMount } from 'svelte';
import {Icon} from '@smui/icon-button';
import { getImages } from "../services/imageSerivce.js"
import { tick } from 'svelte';

export let params
let map;
let mapElement;
let markers =  [];

function initMap() {
    if(!googleMapsLoaded){
        return;
    };
    let initialCoords =  {lat: 46.65, lng: 7.709}
    
    map = new google.maps.Map(mapElement, {
        center: initialCoords,
        zoom: 3
    });
}

function addImageToMap(image){
    if(markers.some(x => x.key == image.key)){
        return;
    }

    var marker = new google.maps.Marker({
        position: {lat: image.location.latitude,lng: image.location.longitude},
        title:image.imageTitle,
        map: map,
        animation: google.maps.Animation.DROP,
    });
    marker.key = image.key;
    marker.addListener('click', function() {
        createInfoWindow(image,marker);
    });
     marker.addListener('mouseover', function() {
        createInfoWindow(image,marker);
    });
    markers.push(marker);

    if(params.key == image.key){
        createInfoWindow(image,marker);
    }
}

// To add the marker to the map, call setMap();

async function addImagesToMap(images){
    while(images.length > 0){
        let i = 0;
    while(images.length > 0 && i++ < 10){
        addImageToMap(images.pop());
    }
    await tick();
    }
}

onMount(async () => {
    initMap();
    getImages().subscribe(addImagesToMap);
});

function getTemplate(image){ 
    return `<div id="content" class="markerPopUp">
    <h2>${image.imageTitle}</h2>
    <div>
    <img src="${image.thumbnail}" alt="${image.imageTitle}" />
    <p>${image.funFact}</p>
    </div></div>`;
};
let infowindow = null;
function createInfoWindow(image,marker){
  if(infowindow){
      infowindow.close();
  }
  infowindow = new google.maps.InfoWindow({
    content:  getTemplate(image)
  });
    infowindow.open(map, marker);
}

</script>

<style type="text/postcss">
#map {
    height: 100%;
    width: 100%;
}
.mapContainer {
    height: 100%;
    width: 100%;
    position: absolute;
}

:global(.markerPopUp) {
    padding: 10px;
    background-color: #fff;
    text-align: center;
    max-width: 210px;
}
:global(.markerPopUp img) {
    max-height: 150px;
}
</style>
<div class="mapContainer">
    <div id="map" bind:this={mapElement}></div>
</div>