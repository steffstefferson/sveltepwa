<script>
  import ImageFullScreen from "./ImageFullScreen.svelte";
  import {
    svelteImageStore,
    loadFullSizeImage
  } from "../services/imageSerivce.js";
  import { tick, onMount } from "svelte";
  import { notify } from "./../services/notifyService.js";
  import page from "page";
  export let params;

  let images = [];
  let imageRatioContain = false;
  let slider;
  let defaultIndex;
  svelteImageStore.subscribe(x => {
    defaultIndex = x.findIndex(y => y.key == params.key);
    images = x.filter(x => {
      x.url = x.thumbnail;
      return x;
    });
    if (defaultIndex == -1) {
      defaultIndex = 0;
    }

    preloadImage(defaultIndex);
    preloadImage(defaultIndex + 1);
    preloadImage(defaultIndex - 1);
  });

  onMount(function() {
    notify("use arrow keys or swipe to navigate between images.");
    slider.scrollLeft = (slider.scrollWidth / images.length) * defaultIndex;
  });

  function getIndex(idx) {
    if (idx < 0) {
      idx = images.length - 1;
    }
    if (images.length <= idx) {
      idx = 0;
    }
    return idx;
  }

  function preloadImage(defaultIndex) {
    let idx = getIndex(defaultIndex);
    let i = images[idx];
    if (!i || i.fullImageIsPreloaded) {
      return;
    }
    console.log("preload index", idx);
    loadFullSizeImage(i).then(url => {
      i.fullImageIsPreloaded = true;
      i.url = url;
      images[idx] = Object.assign({}, i);
    });
  }

  function sliderScrolled(e) {
    let width = e.target.scrollWidth / images.length;
    let idx = Math.round(e.target.scrollLeft / width, 0);
    activeChanged(idx);
  }

  function imageRatioChanged(e) {
    imageRatioContain = e.detail.imageRatioContain;
  }

  function activeChanged(idx) {
    console.log("activechange", idx);
    tick();
    page("/slideShow?key=" + images[idx].key);
    preloadImage(idx + 2);
    preloadImage(idx + 1);
    preloadImage(idx - 1);
    preloadImage(idx - 2);
  }
</script>

<style>
  .slider {
    width: 100vw;
    height: 100vh;
    display: flex;
    overflow-x: hidden;
    scroll-snap-type: x mandatory;
  }
  .slide {
    flex-shrink: 0;
    width: 100vw;
    height: 100vh;
    scroll-snap-align: start;
  }
</style>

<div class="slider" on:scroll={sliderScrolled} bind:this={slider}>
  {#each images as image}
    <div class="slide">
      <ImageFullScreen
        {image}
        {imageRatioContain}
        on:imageratiochanged={imageRatioChanged} />
    </div>
  {/each}

</div>
