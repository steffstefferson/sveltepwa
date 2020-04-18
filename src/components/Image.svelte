<script>
  import { getDisplayTime } from "../services/displayTime.js";
  import { createEventDispatcher } from "svelte";
  import Button, { Label } from "@smui/button";
  import page from "page";

  export let image;
  export let hasDeleteButton;

  let landscapeClass = "portrait";

  const dispatch = createEventDispatcher();

  function deleteLocation() {
    dispatch("delete", image);
  }

  function imageLoaded(e) {
    if (e.target.width > e.target.height) {
      landscapeClass = "landscape";
    }
  }
</script>

<style>
  .imageContainer {
    margin: 5px;
    padding: 15px 15px;
    background-color: #ffff65;
    font-size: 18px;
    border: 2px solid #b7b3b3;
    border-radius: 6px;
  }
  @media (prefers-color-scheme: dark) {
    .imageContainer {
      color: black;
    }
  }
  .imageText {
    width: 100%;
  }
  .imageSubtitle {
    font-size: 12px;
    float: right;
  }

  .square {
    position: relative;
    width: 200px;
    height: 200px;
    overflow: hidden;
    margin: 6px auto;
  }
  img {
    position: absolute;
    max-width: 100%;
    width: 100%;
    height: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  img.landscape {
    height: 100%;
    width: auto;
    object-fit: cover;
  }
</style>

<div
  class="imageContainer"
  on:click={() => page('/images/slideShow?key=' + image.key)}>

  <div class="imageText">{image.imageTitle}</div>
  <div class="square">
    <img
      src={image.thumbnail}
      class={landscapeClass}
      on:load={imageLoaded}
      alt={image.funimage} />
  </div>
  <div class="imageText">{image.funFact}</div>
  <div class="imageSubtitle">{getDisplayTime(image.insertTime)}</div>
  {#if hasDeleteButton}
    <Button on:click={deleteLocation} variant="raised" class="formButton">
      <Label>Delete location</Label>
    </Button>
  {/if}
</div>
