<script>
  import { getImages } from "../services/imageSerivce.js"
  import Image from './Image.svelte';

const localStore = getImages();

</script>

<style type="text/postcss">
.list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
}
  .list-item {
	display: flex; 
  padding: 0.5em;
  width: 300px;
  }

.list-content {
	background-color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1em;
	width: 100%;
}
.list-content p {
	flex: 1 0 auto;
}
</style>
<div>
  <ul class="list">
  {#each $localStore as image}
  <li class="list-item">
  <Image image={image} class="list-content"></Image>
  </li>
  {/each}
  </ul>
</div>