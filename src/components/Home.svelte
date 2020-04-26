<script>
  import { svelteNewestFactStore } from "./../services/factsService";
  import { svelteNewestImageStore } from "../services/imageSerivce.js";
  import Fact from "./Fact.svelte";
  import Image from "./Image.svelte";
  import Button, { Label } from "@smui/button";

  export let params;
</script>

<style type="text/postcss">
  .list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }
  .list-item {
    padding: 0.5em;
    width: 300px;
    flex: 1 0 auto;
  }
  .headerImage {
    padding-top: 20px;
  }

  .fact {
    margin-bottom: 20px;
  }
</style>

<div class="contentpadding">
  <img
    class="headerImage"
    src="./../assets/lurinfacts-header-transparent.png"
    alt="Lurinfacts Logo" />
  <div class="list">
    <div class="list-item">
      <h1>Newest facts</h1>
      {#each $svelteNewestFactStore as fact}
        <div class="fact" on:click={() => selectFact(fact)}>
          <Fact {fact} hasDeleteButton={false} hasAcceptButton={false} />
        </div>
      {/each}
      <Button href="/facts" variant="raised" class="formButton">
        <Label>Show me all facts</Label>
      </Button>
    </div>
    <div class="list-item">
      <h1>Newest image</h1>
      {#each $svelteNewestImageStore as image}
        <Image {image} hasDeleteButton={false} />
      {/each}
      <Button href="/images" variant="raised" class="formButton">
        <Label>Show me all images</Label>
      </Button>
    </div>

  </div>
</div>
