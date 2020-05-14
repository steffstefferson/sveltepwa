<script>
  import { subscribeToNewestFacts } from "./../services/factsWrapperService.js";
  import { subscribeToNewestImages } from "./../services/imagesWrapperService.js";
  import Fact from "./Fact.svelte";
  import Image from "./Image.svelte";
  import Button, { Label } from "@smui/button";
  import { onMount } from "svelte";

  let facts = [];
  let images = [];

  onMount(async function() {
    let factsObservable = await subscribeToNewestFacts();
    factsObservable.subscribe(x => {
      facts = x;
    });
    let imageObservable = await subscribeToNewestImages();
    imageObservable.subscribe(x => {
      images = x;
    });
  });
</script>

<style type="text/postcss">
  .list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }
  .list-item {
    padding: 0.5em;
    max-width: 400px;
  }

  .fact {
    margin-bottom: 20px;
  }

  #maskedLogo {
    margin-top: 20px;
    margin: auto;
    width: 256px;
    height: 115px;
    background-color: var(--mdc-theme-on-primary, black);
    -webkit-mask-image: url(./../assets/lurinfacts-header-transparent.png);
    mask-image: url(./../assets/lurinfacts-header-transparent.png);
  }
</style>

<div class="contentpadding">

  <div id="maskedLogo" />
  <div class="list">
    <div class="list-item">
      <h1>Newest facts</h1>
      {#each facts as fact}
        <div class="fact">
          <Fact {fact} hasDeleteButton={false} hasAcceptButton={false} />
        </div>
      {/each}
      <Button href="/facts" variant="raised" class="formButton">
        <Label>Show me all facts</Label>
      </Button>
    </div>
    <div class="list-item">
      <h1>Newest image</h1>
      {#each images as image}
        <Image {image} hasDeleteButton={false} />
      {/each}
      <Button href="/images" variant="raised" class="formButton">
        <Label>Show me all images</Label>
      </Button>
    </div>

  </div>
</div>
