<script>
  import { getImage } from "../services/imageSerivce.js";
  import IconButton, { Icon } from "@smui/icon-button";
  import { getDisplayTime } from "../services/displayTime.js";
  import page from "page";

  export let params;

  let showText = true;
  console.log(params);
  let imageSizeContain = false;
  let backgroundStyle = "";
  let backgroundSize = "background-size: cover;";
  let image = load(params.key, 0);
  let backUrl = "/images";
  const canShare = "canShare" in navigator;

  function toggleText() {
    showText = !showText;
  }

  function getPreviousImage(e) {
    image = load(image.key, -1);
  }

  function getNextImage(e) {
    image = load(image.key, 1);
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
    imageSizeContain = !imageSizeContain;
    if (imageSizeContain) {
      backgroundSize = "background-size: contain;";
    } else {
      backgroundSize = "background-size: cover;";
    }
  }

  function load(key, offset) {
    const img = getImage(key, offset);
    backgroundStyle =
      "background-image: url(" +
      (img.fullImageSizeUrl || img.thumbnail) +
      "); ";
    if (!img.fullImageSizeUrl) {
      img.loadFullSizeImage().then(fullSizeImageUrl => {
        backgroundStyle = "background-image: url(" + fullSizeImageUrl + "); ";
      });
    }
    page("/slideShow?key=" + key);

    return img;
  }
</script>

<style>
  :global(.lurinsnavicons) {
    font-size: 32px !important;
    padding: 0px;
    margin: 0px !important;
    width: 25px;
  }

  .container {
    height: 100%;
    background-position: center;
    background-repeat: no-repeat;
    width: 100%;
    position: absolute;
    top: 0px;
  }

  .textContainer {
    background-color: yellow;
    border: 1px black solid;
    padding: 10px;
    margin: 10px;
    display: grid;
    grid-template-columns: auto 100px;
    position: absolute;
    align-items: center;
    position: absolute;
    bottom: 0px;
    right: 10px;
  }

  .textContainer div {
    width: 100%;
  }

  .showHideInfoArea {
    height: 80%;
    position: absolute;
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

<div class="container" style="{backgroundStyle} {backgroundSize}">
  <div
    class="showHideInfoArea"
    on:mousedown={toggleText}
    on:touchstart={toggleText}
    on:touchend={toggleText}
    on:mouseup={toggleText} />
  <div
    class="textContainer"
    style="visibility: {showText ? 'inherit' : 'hidden'}">
    <div>
      <div>
        <span class="title">{image.imageTitle}</span>
      </div>
      <div class="text">{image.funFact}</div>
      <div class="text">{getDisplayTime(image.insertTime)}</div>
    </div>
    <div>
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
      <IconButton
        on:click={() => page(backUrl)}
        class="lurinsnavicons material-icons"
        aria-label="Close">
        close
      </IconButton>

      <IconButton
        on:click={getPreviousImage}
        class="lurinsnavicons material-icons"
        aria-label="Back">
        navigate_before
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
      <IconButton
        on:click={getNextImage}
        class="lurinsnavicons material-icons"
        aria-label="Next">
        navigate_next
      </IconButton>
    </div>
  </div>
</div>
