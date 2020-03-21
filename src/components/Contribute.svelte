<script>
  import { addFactProposal } from './../services/factsService.js';
  import { form } from 'svelte-forms';
  import { writable } from "svelte/store";
  import Button, {Label} from '@smui/button';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text/index';
  import CharacterCounter from '@smui/textfield/character-counter/index';
  import Snackbar, {Actions} from '@smui/snackbar';

let mySnackbar;
let mySnackbarText = "";
let factObj = { fact: "", contributor: ""};

  const contributeForm = form(() => ({
    fact: { value: factObj.fact, validators: ["required", "min:5","max:150"]},
    contributor: { value: factObj.contributor, validators: ["required", "min:5","max:80"]},
  }));

function sendContribution(e) {
   e.preventDefault();
  factObj.insertTime = new Date().getTime();
  if (!navigator.onLine) {
    mySnackbarText = "Your internet connection is lost and lurin couldn't fix it. try later."
    mySnackbar.open();
    return false;
  }

  return addFactProposal(factObj).then(
    function() {
      factObj.fact = "";
      factObj.contributor = "";
      mySnackbarText = "fact added, lurin will decide if it's worth it"
      mySnackbar.open();
    },
    function(e) {
      console.log('error on save:',e);
      mySnackbarText = "lurin doesn't like this fact, error during save.";
      mySnackbar.open();
    }
  );
  return false;

}
</script>

<style type="text/postcss">

</style>
<div>
  <h1>Contribute</h1>
  <form style="max-width: 400px;" on:submit={sendContribution}>
    <div>
      <Textfield class="shaped-outlined" variant="outlined" bind:value={factObj.contributor} label="Contributor"
        style="width: 100%;"
        input$required
        input$min-length=5
        input$max-length=80
        input$aria-controls="helper-text-shaped-outlined-a" 
        input$aria-describedby="helper-text-shaped-outlined-a" />
      <HelperText id="helper-text-shaped-outlined-a">What's your name?</HelperText>
      <HelperText validationMsg>A name with length between 5 - 80 characters is required.</HelperText>
    </div>
    <div>
    <div>
      <Textfield textarea 
      input$maxlength="150"
      input$rows="5"
      style="width: 100%;"
      bind:value={factObj.fact} label="Fact">
        <CharacterCounter>0 / 150</CharacterCounter>
      </Textfield>
    </div>
    <Button 
    disabled={!$contributeForm.valid || factObj.fact.length == 0}  
    variant="raised"
    style="float:right; margin-top:20px">
      <Label>Send</Label>
    </Button>
  </form>
  <Snackbar bind:this={mySnackbar}>
      <Label>{mySnackbarText}</Label>
  </Snackbar>
</div>
