<script>
  import { saveImageAndMetadata } from "./../services/imageUploadService.js";
  import {
    resizeImage,
    getOrientation,
    rotatePhoto
  } from "./../services/imageResizeService.js";
  import IconButton, { Icon } from "@smui/icon-button";
  import { notify } from "./../services/notifyService.js";
  import { form } from "svelte-forms";
  import Button, { Label } from "@smui/button";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text/index";
  import { onMount } from "svelte";
  import LocationSelector from "./LocationSelector.svelte";
  import ImageSelector from "./ImageSelector.svelte";
  import page from "page";

  let imageObj = {
    imageTitle: "",
    funFact: "",
    imageKey: "",
    location: {},
    thumbnail: ""
  };
  let thumbnailImage = null;

  let fullsizeImage = null;

  function updateImage(event) {
    fullsizeImage = event.detail.fullsizeImage;
    thumbnailImage = event.detail.thumbnailImage;
  }

  function updateLocation(event) {
    imageObj.location = event.detail;
  }

  const imageForm = form(() => ({
    title: {
      value: imageObj.imageTitle,
      validators: ["required", "min:5", "max:80"]
    },
    funFact: {
      value: imageObj.funFact,
      validators: ["required", "min:5", "max:240"]
    }
  }));

  async function saveData(e) {
    e.preventDefault();
    try {
      imageObj.insertTime = new Date().getTime();
      var result = await saveImageAndMetadata(
        imageObj,
        thumbnailImage,
        fullsizeImage
      );
      if (result) {
        imageObj = {
          imageTitle: "",
          funFact: "",
          imageKey: "",
          location: {},
          thumbnail: ""
        };
        thumbnailImage = null;
        fullsizeImage = null;
        notify("thanks for adding this gem.");
        page("/images");
      } else {
        notify("something went wrong :-(");
      }
    } catch (e) {
      console.log("error on save", e);
      notify("something went wrong :-(");
    }
    return false;
  }

  function handleFiles(e) {
    readFile(e.target.files[0]).then(([thumb, fullSize]) => {
      thumbnailImage = thumb;
      fullsizeImage = fullSize;
    });
  }
</script>

<style type="text/postcss">

</style>

<div>
  <h1>Add place to be</h1>
  <form style="max-width: 400px;" on:submit={saveData}>
    <div>
      <Textfield
        class="shaped-outlined"
        variant="outlined"
        bind:value={imageObj.imageTitle}
        label="Location, Country"
        style="width: 100%;"
        input$required
        input$min-length="5"
        input$max-length="80"
        input$aria-controls="helper-text-shaped-outlined-a"
        input$aria-describedby="helper-text-shaped-outlined-a" />
      <HelperText id="helper-text-shaped-outlined-a">
        Where have you been?
      </HelperText>
    </div>
    <br />
    <div>
      <Textfield
        class="shaped-outlined"
        variant="outlined"
        bind:value={imageObj.funFact}
        label="FunFact"
        style="width: 100%;"
        input$required
        input$min-length="5"
        input$max-length="240"
        input$aria-controls="helper-text-shaped-outlined-a"
        input$aria-describedby="helper-text-shaped-outlined-a" />
      <HelperText id="helper-text-shaped-outlined-a">How was it?</HelperText>
    </div>
    <br />

    <ImageSelector on:imageChoosen={updateImage} />

    <LocationSelector on:locationChoosen={updateLocation} />
    <Button
      disabled={!($imageForm.valid && imageObj.funFact.length > 0 && fullsizeImage && thumbnailImage && location)}
      variant="raised"
      class="formButton">
      <Label>Send</Label>
    </Button>
  </form>
</div>
