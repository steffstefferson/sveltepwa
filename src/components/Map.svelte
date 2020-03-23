<script>
import { onMount } from 'svelte';
import { getPositionByCoords,getPositionByAddress } from './../services/geoLocationService.js';
import Button, {Label} from '@smui/button';
import Textfield from '@smui/textfield';
import HelperText from '@smui/textfield/helper-text/index';
import Radio from '@smui/radio';
import FormField from '@smui/form-field';
  import {Icon} from '@smui/icon-button';

let map;
let mapElement;
let marker =  {};
let markerPosition = {}
let selectedOption = 'map';
export let location = {};
let addressSearch = '';
function initMap() {
    if(!googleMapsLoaded){
        return;
    };
    let initialCoords =  {lat: 46.65, lng: 7.709}
    
    if(location && location.latitude){
        initialCoords = {lat: location.latitude , lng: location.longitude };
    }else{
        updateLocationByCoords(initialCoords.lat,initialCoords.lng);
    }
    map = new google.maps.Map(mapElement, {
        center: initialCoords,
        zoom: 8
    });
    marker = new google.maps.Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: initialCoords,
    });
    marker.addListener('dragend',function(){
        console.log(marker);
        markerPosition = { latitude : marker.position.lat(), longitude : marker.position.lng()};
        updateLocationByCoords(markerPosition.latitude,markerPosition.longitude);
    })
}

async function updateLocationByCoords(lat,lng) {
    try{
        location = await getPositionByCoords(lat, lng);
    }catch(e){
        console.log('updateLocationByCoords: error while looking up coords',e);
    }
};
async function getByAddress() {

    try{
        location = await getPositionByAddress(addressSearch);
        var coords = {
            lat: location.latitude,
            lng: location.longitude
        };
        marker.setPosition(coords);
        map.setCenter(coords);
    }catch(e){
        console.log('getByAddress: error while looking up coords',e);
    }
};

onMount(async () => {
    optionChanged();
});

let locationOfDevice = {};
function optionChanged(){
    if(selectedOption == 'map'){
        initMap();
    }else if(selectedOption == 'device'){
        locationOfDevice = {msg:  "Locate your device postion.....", icon: "phonelink_ring"};
        if (!navigator.geolocation) {
            locationOfDevice = {msg:  "Looks like your phone does not support gelocation", icon: "local_phone"};
            return;
        }

            navigator.geolocation.getCurrentPosition((position) => {
                location = {latitude :position.coords.latitude,longitude :position.coords.longitude};
                locationOfDevice = {msg:  "Location found", icon: "done"};
                updateLocationByCoords(position.coords.latitude,position.coords.longitude);
            },(error) => {
                if(error.code == 1){
                locationOfDevice ={msg:   "Error on fetching the device's locaction", icon: "phonelink_erase"};
                }else{
                locationOfDevice = {msg:  "Lurin has no rights to access your device's location 💩", icon: "phonelink_lock"};
                }
            });
    }
}
</script>

<style type="text/postcss">
#map {
    height: 300px;
    width: 100%;
}
</style>
<div>
<h2>Add location</h2>
  <div>
      <FormField>
        <Radio bind:group={selectedOption} value=address on:change="{optionChanged}"  />
        <span slot="label">By address</span>
      </FormField>
            <FormField>
        <Radio bind:group={selectedOption} value=map on:change="{optionChanged}" />
        <span slot="label">By map location</span>
      </FormField>
            <FormField>
        <Radio bind:group={selectedOption} value=device on:change="{optionChanged}"  />
        <span slot="label">Device location</span>
      </FormField>
  </div>


{#if selectedOption=='address'}
<div>
    <h3>Choose by address</h3>
    <div>
        <Textfield class="shaped-outlined" variant="outlined" bind:value={addressSearch} label="Address"
        style="width: 100%;"
        input$required
        input$min-length=5
        input$max-length=240
        input$aria-controls="helper-text-shaped-outlined-a" 
        input$aria-describedby="helper-text-shaped-outlined-a" />
        <HelperText id="helper-text-shaped-outlined-a">Where have you been? Enter a address, Lurin will guess the coordinates.</HelperText>
    </div>
    <div style="width: 100%;height: 80px;">
        <Button  on:click="{getByAddress}"
        variant="raised"
        class="formButton">
        <Label>Get coords by address</Label>
        </Button>
    </div>
</div>
{:else if selectedOption=='device'}
<div>
    <h3>Choose by device</h3>
    <Icon class="material-icons" style="vertical-align: text-bottom">{locationOfDevice.icon}</Icon><span>{locationOfDevice.msg}</span>
</div>
  {:else if selectedOption=='map'}
<div> 
    <h3>Choose by map</h3>
    <div id="map" bind:this={mapElement}></div>
</div>
{/if}

{#if location.address}
<h3>Choosen location</h3>
Latitdude: {location.latitude}<br/>
Longitude: {location.longitude}<br/>
Address: {location.address}<br/>
Country: {location.country}<br/>
{/if}
</div>