<script>
import { createEventDispatcher } from 'svelte';
import {getDisplayTime} from "../services/displayTime.js"
 import Card from '@smui/Card';
import Button,{Label} from '@smui/Button';

export let fact;
export let hasDeleteButton;
export let hasAcceptButton;

const dispatch = createEventDispatcher();

function deleteFact(){
		dispatch('delete', {fact});
}
function acceptFact(){
	dispatch('accept', {fact});
}

</script>

  <div style="display: flex; flex-wrap: wrap;">
    <div class="card-container short factContainer">
      <Card style="background-color: #ffff65;" padded>{ fact.fact }
      <div class="factSubtitle">{ getDisplayTime(fact.insertTime) } | by {fact.contributor}</div>
      </Card>
      {#if hasDeleteButton}
        <Button on:click={deleteFact}
        variant="raised"
         class="formButton"
        >
        <Label>Delete fact</Label>
        </Button>
    {/if}
          {#if hasAcceptButton}
        <Button on:click={acceptFact}
        variant="raised" class="formButton">
        <Label>Accept fact</Label>
        </Button>
    {/if}
    </div>
    </div>


<style>
.factContainer {
    width: 100%;
    max-width: 350px;
    min-width: 350px;
}

.factSubtitle{
    font-size: 12px;
    text-align:right;
}
</style>