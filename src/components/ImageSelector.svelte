<script>
  import {
    readFile,
    getImageFormUrl
  } from "./../services/imageReaderService.js";
  import LinearProgress from "@smui/linear-progress";
  import { Icon } from "@smui/icon-button";
  import Button, { Label } from "@smui/button";
  import { createEventDispatcher } from "svelte";
  import {
    getCachedMediaMetadata,
    deleteCachedMediaMetadata
  } from "./../services/imageMediaDataCache.js";
  import { tick } from "svelte";
  import { onMount } from "svelte";

  const dispatch = createEventDispatcher();

  let uploadedFiles = [];
  let thumbnailImage = null;
  let fullsizeImage = null;
  let cachedImage = {};
  let cachedImageLoading = true; //!!new URLSearchParams(window.location.search).get("shareTarget");
  onMount(async () => {
    if (cachedImageLoading) {
      loadCachedImage();
    }
  });

  async function loadCachedImage() {
    const images = await getCachedMediaMetadata("image");
    let img = images ? images[0] : null;
    if (img) {
      let [thumb, fullSize] = await getImageFormUrl(img.src);
      cachedImage = img;
      cachedImage.thumbnailImage = thumb;
      cachedImage.fullsizeImage = fullSize;
    }
    cachedImageLoading = false;
  }

  async function useCachedImage(e) {
    e.preventDefault();
    thumbnailImage = cachedImage.thumbnailImage;
    fullsizeImage = cachedImage.fullsizeImage;
    dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
    deleteCachedMediaMetadata(cachedImage.src).then(
      result => (cachedImage = {})
    );
  }

  async function deleteCachedImage(e) {
    e.preventDefault();
    await deleteCachedMediaMetadata(cachedImage.src);
    cachedImage = null;
    cachedImageLoading = true;
    loadCachedImage();
    return false;
  }

  function readUploadedFiles(e) {
    readFile(e.target.files[0]).then(([thumb, fullSize]) => {
      thumbnailImage = thumb;
      fullsizeImage = fullSize;
      dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
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
    padding: 0px;
    margin: 0px;
  }

  .dropZoneOverlay {
    border: dotted 1px;
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
  {#if cachedImageLoading}
    <LinearProgress indeterminate />
  {:else if cachedImage.src}
    <div class="col">
      <img
        src={cachedImage.thumbnailImage}
        alt="shared image"
        style="max-height:100px;height:auto" />
    </div>
    <div class="col">
      <Button on:click={useCachedImage} variant="raised" class="formButton">
        <Label>Use this image</Label>
      </Button>
      <Button on:click={deleteCachedImage} variant="raised" class="formButton">
        <Label>Choose other image</Label>
      </Button>
    </div>
  {/if}
  {#if !cachedImageLoading && !cachedImage.src && !thumbnailImage}
    <div class="dropZoneContainer">
      <input
        type="file"
        id="drop_zone"
        bind:value={uploadedFiles}
        class="FileUpload"
        accept=".jpg,.png,.gif"
        on:change={readUploadedFiles} />
      <div class="dropZoneOverlay">
        Drag and drop your image
        <br />
        or
        <br />
        Click to add
      </div>
    </div>
  {/if}
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
      <div class="col" style="height:100px">
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
