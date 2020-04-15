<script>
  import { saveImageAndMetadata } from "./../services/imageUploadService.js";
  import {
    resizeImage,
    getOrientation,
    rotatePhoto
  } from "./../services/imageResizeService.js";
  import IconButton, { Icon } from "@smui/icon-button";
  import { notify } from "./../services/notifyService.js";
  import Button, { Label } from "@smui/button";
  import { onMount } from "svelte";
  import LocationSelector from "./LocationSelector.svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  let uploadedFiles = [];
  let thumbnailImage = null;
  let fullsizeImage = null;

  function handleFiles(e) {
    readFile(e.target.files[0]).then(([thumb, fullSize]) => {
      thumbnailImage = thumb;
      fullsizeImage = fullSize;
      dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
    });
  }

  async function readFile(f) {
    return new Promise((resolve, reject) => {
      let thumbImage;
      let fullsizeImage;
      var reader = new FileReader();
      reader.onload = async function(e) {
        let orientation = await getOrientation(f);
        console.log(`orientation of photo is: ${orientation.degree}`);
        var rotatedResult = await rotatePhoto(
          e.target.result,
          orientation.degree
        );
        var promiseThumb = resizeImage(rotatedResult, 200);
        var promise = resizeImage(rotatedResult, 1024);
        Promise.all([promiseThumb, promise])
          .then(r => {
            resolve(r);
          })
          .catch(e => {
            console.log(e);
            reject(e);
          });
      };
      reader.readAsDataURL(f);
    });
  }

  function deleteImages() {
    thumbnailImage = null;
    fullsizeImage = null;
    dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
  }
</script>

<style type="text/postcss">
  .dropZoneOverlay,
  .FileUpload,
  .dropZoneContainer {
    width: 100%;
    height: 71px;
    cursor: pointer;
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

  .flex-grid-imageOk {
    display: flex;
    min-height: 70px;
  }
  .col {
    flex: auto;
  }
</style>

<div>
  <h2>Select image</h2>
  <div class="dropZoneContainer">
    <input
      type="file"
      id="drop_zone"
      bind:value={uploadedFiles}
      class="FileUpload"
      accept=".jpg,.png,.gif"
      on:change={handleFiles} />
    <div class="dropZoneOverlay">
      Drag and drop your image
      <br />
      or
      <br />
      Click to add
    </div>
  </div>
  {#if thumbnailImage}
    <div class="flex-grid-imageOk">
      <div class="col" style="padding: 4px;">
        <img
          src={thumbnailImage}
          style="max-height:60px;height:100%"
          alt="thmbnail" />
      </div>
      <div class="col" style="padding-top: 12px;">
        <Icon class="material-icons" style="vertical-align: text-bottom;">
          done
        </Icon>
        Thumbnail is ready!
        {#if fullsizeImage}
          <br />
          <Icon class="material-icons" style="vertical-align: text-bottom;">
            done
          </Icon>
          Fullsize is ready!
        {/if}
      </div>
      <div class="col">
        <Button
          on:click={deleteImages}
          disabled={!thumbnailImage}
          variant="raised"
          class="formButton">
          <Label>Delete</Label>
        </Button>
      </div>
    </div>
  {/if}
</div>
