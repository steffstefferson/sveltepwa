<script>
  import ImageFullScreen from "./ImageFullScreen.svelte";
  import {
    subscribeToImages,
    loadFullSizeImage
  } from "./../services/imagesWrapperService.js";

  import { tick, onMount } from "svelte";
  import { notify } from "./../services/notifyService.js";

  import page from "page";
  export let params;

  let images = [];
  let imageRatioContain = false;
  let slider;
  let defaultIndex;

  onMount(async function() {
    let imageObservable = await subscribeToImages();
    imageObservable.subscribe(x => {
      defaultIndex = x.findIndex(y => y.key == params.key);
      console.log("default index is:", defaultIndex);
      images = x.map(x => {
        x.url = x.url || x.thumbnail;
        return x;
      });
      if (defaultIndex == -1) {
        defaultIndex = 0;
      } else {
        preloadImage(defaultIndex);
        preloadImage(defaultIndex + 1);
        preloadImage(defaultIndex - 1);
      }
    });

    notify("use arrow keys or swipe to navigate between images.");
    await tick();
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

  function preloadImage(idx) {
    idx = getIndex(idx);
    let i = images[idx];
    if (!i || i.fullImageIsPreloaded) {
      i.url = i.fullImageSizeUrl;
      //console.log(i.imageTitle + "is already preloaded");
      return;
    }

    loadFullSizeImage(i).then(url => {
      i.fullImageIsPreloaded = true;
      i.url = url;
      console.log("preload ok for: " + i.imageTitle, idx);
      images[idx] = Object.assign({}, i);
    });
  }

  function sliderScrolled(e) {
    let width = e.target.scrollWidth / images.length;
    let idx = Math.round(e.target.scrollLeft / width, 0);
    if (idx != defaultIndex) {
      activeChanged(idx);
    }
  }

  function imageRatioChanged(e) {
    imageRatioContain = e.detail.imageRatioContain;
  }

  function activeChanged(idx) {
    defaultIndex = idx;
    console.log("activechange to:", images[idx].imageTitle, idx);
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
    height: calc(100vh - 50px);
    display: flex;
    overflow-x: hidden;
    scroll-snap-type: x mandatory;
  }
  .slide {
    flex-shrink: 0;
    width: 100vw;
    height: calc(100vh - 50px);
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
