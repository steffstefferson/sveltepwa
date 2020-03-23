<script>
  import { saveImageAndMetadata } from './../services/imageUploadService.js';
  import {resizeImage,getOrientation, rotatePhoto } from './../services/imageResizeService.js'
  import IconButton, {Icon} from '@smui/icon-button';
  import { notify } from './../services/notifyService.js';
  import { form } from 'svelte-forms';
  import Button, {Label} from '@smui/button';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text/index';
  import { onMount } from 'svelte';
  import LocationSelector from './LocationSelector.svelte';
  import ImageSelector from './ImageSelector.svelte';
 
let imageObj = { imageTitle : "", funFact: "",imageKey : "",location: {}, thumbnail: ""};
let thumbnailImage = null;
let fullsizeImage = null;

function updateImage(event){
    fullsizeImage = event.detail.fullsizeImage;
    thumbnailImage = event.detail.thumbnailImage;
}

function updateLocation(event){
    imageObj.location = event.detail;
}

  const imageForm = form(() => ({
    title: { value: imageObj.imageTitle, validators: ["required", "min:5","max:80"]},
    funFact: { value: imageObj.funFact, validators: ["required", "min:5","max:240"]},
  }));

function saveData(e) {
   e.preventDefault();
  imageObj.insertTime = new Date().getTime();

}

function handleFiles(e){
    readFile(e.target.files[0]).then(([thumb,fullSize]) =>{
        thumbnailImage = thumb;
        fullsizeImage = fullSize;
        console.log('all good');
    })
}

async function  readFile(f){
    return new Promise((resolve,reject) => {
    let thumbImage;
    let fullsizeImage;
    var reader = new FileReader();
    reader.onload = async function(e) {
        let orientation = await getOrientation(f);
        console.log(`orientation of photo is: ${orientation.degree}`);
        var rotatedResult = await rotatePhoto(e.target.result, orientation.degree);
        var promiseThumb = resizeImage(rotatedResult, 200);
        var promise = resizeImage(rotatedResult, 1024);
        Promise.all([promiseThumb,promise])
        .then((r)=>{
            resolve(r);
        })
        .catch(e => {
            console.log(e); 
            reject(e);
        });
    }
    reader.readAsDataURL(f);
    });
}

function allInputValid(){
    return $imageForm.valid && imageObj.funFact.length > 0 && fullsizeImage && thumbnailImage && location;
}

</script>

<style type="text/postcss">
.dropZoneOverlay, .FileUpload, .dropZoneContainer {
        width: 100%;
        height: 71px;
    }

.dropZoneOverlay {
    border: dotted 1px;
    font-family: cursive;
    color: gray;
    border-radius: 4px 4px 0 0;
    position: relative;
    top: -71px;
    text-align: center;
}

.FileUpload {
    opacity: 0;
    position: relative;
    z-index: 1;
}

</style>
<div>
<h1>Add place to be</h1>
<form style="max-width: 400px;" on:submit={saveData}>
    <div>
        <Textfield class="shaped-outlined" variant="outlined" bind:value={imageObj.imageTitle} label="Location, Country"
        style="width: 100%;"
        input$required
        input$min-length=5
        input$max-length=80
        input$aria-controls="helper-text-shaped-outlined-a" 
        input$aria-describedby="helper-text-shaped-outlined-a" />
        <HelperText id="helper-text-shaped-outlined-a">Where have you been?</HelperText>
    </div>
    <br/>
    <div>
        <Textfield class="shaped-outlined" variant="outlined" bind:value={imageObj.funFact} label="FunFact"
        style="width: 100%;"
        input$required
        input$min-length=5
        input$max-length=240
        input$aria-controls="helper-text-shaped-outlined-a" 
        input$aria-describedby="helper-text-shaped-outlined-a" />
        <HelperText id="helper-text-shaped-outlined-a">How was it?</HelperText>
    </div>
    <br/>

    <ImageSelector on:imageChoosen={updateImage}></ImageSelector>

    <LocationSelector on:locationChoosen={updateLocation}></LocationSelector>
    <Button 
    disabled={!($imageForm.valid && imageObj.funFact.length > 0 && fullsizeImage && thumbnailImage && location)}  
    variant="raised"
    class="formButton">
        <Label>Send</Label>
    </Button>
</form>
</div>
