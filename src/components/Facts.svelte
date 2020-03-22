<script>
  import { getFacts } from './../services/factsService';
  import Fact from './Fact.svelte';
  import Button, {Label} from '@smui/button';

  const localStore = getFacts();

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
  width: 100%;
  
}
  .list-item {
    width: 300px;
    flex-grow:1;
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
    <Button href="/contribute"
    variant="raised"
    style="margin-top:20px">
      <Label>Contribute your own fact</Label>
    </Button>

  <ul class="list">
  {#each $localStore as fact}
  <li class="list-item">
  <Fact fact={fact} class="list-content"></Fact>
  </li>
  {/each}
</div>
