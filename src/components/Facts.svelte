<script>
  import { svelteFactStore, deleteFact  } from './../services/factsService';
  import { notify  } from './../services/notifyService';
  import Fact from './Fact.svelte';
  import Button, {Label} from '@smui/button';
  import { userStore } from './../services/loginService.js';
   import Kitchen from '@smui/snackbar/kitchen/index';

  let loggedIn = false;
  userStore.subscribe(user => {
		loggedIn = user.loggedIn;
  });
  
  let kitchen;

  function onDeleteFact(event){
    return pushToKitchen(event.detail.fact);
  }

function deleteFactSerious(fact){
    deleteFact(fact).then(success => {
        if(success){
          notify('fact was deleted');
        }else{
          notify('something went wrong while deleting the fact');
        }
    });
}


  function pushToKitchen(fact) {
    kitchen.push({
      props: {
        variant: 'stacked'
      },
      label: 'Do you really want to delete this fact?',
      actions: [
        {
          onClick: () => deleteFactSerious(fact),
          text: 'Yes, please'
        },
        {
          text: 'Nope'
        }
      ],
      dismissButton: false
    });
  }

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
    width: 350px;
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
ul {
  padding-inline-start: 5px;
}

</style> 
<div style="height: 50px;">
    <Button href="/contribute"
    variant="raised"
    class="formButton">
      <Label>Contribute your own fact</Label>
    </Button>
    </div>
<div>
  <ul class="list">
  {#each $svelteFactStore as fact}
  <li class="list-item">
  <Fact fact={fact} hasDeleteButton="{loggedIn}"  on:delete="{onDeleteFact}" hasAcceptButton="{false}" class="list-content"></Fact>
  </li>
  {/each}
  </ul>
</div>

<Kitchen bind:this={kitchen} dismiss$class="material-icons" />
