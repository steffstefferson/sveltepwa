<script>
  import IconButton, { Icon } from "@smui/icon-button";
  import { getDisplayTime } from "../services/displayTime.js";
  import { createEventDispatcher } from "svelte";
  import page from "page";

  export let image;
  export let backUrl;
  export let imageRatioContain = false;

  let showTextContainer = true;
  let backgroundSize = "background-size: cover;";
  let dispatcher = createEventDispatcher();
  const canShare = "canShare" in navigator;

  function toggleText() {
    showTextContainer = !showTextContainer;
  }

  async function shareImage(e) {
    let response = await fetch(image.fullImageSizeUrl);
    let data = await response.blob();
    let metadata = {
      type: "image/jpeg"
    };
    let file = new File([data], image.key + ".jpg", metadata);
    const files = [file];
    if (canShare && navigator.canShare({ files })) {
      try {
        navigator.share({ files });
      } catch (ex) {
        console.log("sharerror", ex);
      }
    }
  }

  function toggleZoom() {
    imageRatioContain = !imageRatioContain;
    if (imageRatioContain) {
      backgroundSize = "background-size: contain;";
    } else {
      backgroundSize = "background-size: cover;";
    }
    dispatcher("imageratiochanged", {
      imageRatioContain: imageRatioContain
    });
  }
</script>

<style>
  :global(.lurinsnavicons) {
    font-size: 25px !important;
    padding: 0px;
    margin: 0px !important;
    width: 25px;
    height: 30px;
  }

  .container {
    height: 100%;
    background-position: center;
    background-repeat: no-repeat;
    width: 100%;
    grid-template-rows: auto min-content;
    display: inline-grid;
  }

  .textContainer {
    background-color: var(--mdc-theme-primary, black);
    border: 1px black solid;
    padding: 10px;
    display: grid;
    grid-template-columns: auto 115px;
    align-items: center;
    bottom: 0px;
  }

  .textContainer div {
    width: 100%;
  }

  .showHideInfoArea {
    height: 80%;
    bottom: 20%;
    border: none;
    width: 100%;
  }

  .title {
    font-size: 20px;
  }
  .text {
    font-size: 14px;
  }
</style>

<div
  class="container"
  style="background-image: url('{image.url}'); {backgroundSize}">
  <div
    class="showHideInfoArea"
    on:mousedown={toggleText}
    on:touchstart={toggleText}
    on:touchend={toggleText}
    on:mouseup={toggleText} />
  <div
    class="textContainer"
    style="visibility: {showTextContainer ? 'inherit' : 'hidden'}">
    <div>
      <div>
        <span class="title">{image.imageTitle}</span>
      </div>
      <div class="text">{image.funFact}</div>
      <div class="text">{getDisplayTime(image.insertTime)}</div>
    </div>
    <div>
      <IconButton
        on:click={() => page('/' + backUrl + '#:~:text=' + encodeURIComponent(image.imageTitle))}
        class="lurinsnavicons material-icons"
        aria-label="Open map">
        close
      </IconButton>

      <IconButton
        on:click={() => page('/map?key=' + image.key)}
        class="lurinsnavicons material-icons"
        aria-label="Open map">
        place
      </IconButton>
      <IconButton
        on:click={toggleZoom}
        class="lurinsnavicons material-icons"
        aria-label="Toggle zoom">
        aspect_ratio
      </IconButton>

      {#if canShare}
        <IconButton
          on:click={shareImage}
          class="lurinsnavicons material-icons"
          aria-label="Back">
          share
        </IconButton>
      {:else}
        <IconButton
          class="lurinsnavicons material-icons"
          aria-label="placeholder">
          _
        </IconButton>
      {/if}
    </div>
  </div>
</div>
