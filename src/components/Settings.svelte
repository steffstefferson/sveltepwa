<script>
  import { addFactProposal } from './../services/factsService.js';
  import { notify } from './../services/notifyService.js';
  import { form } from 'svelte-forms';
  import Button, {Label} from '@smui/button';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text/index';
  import CharacterCounter from '@smui/textfield/character-counter/index';
  import Snackbar, {Actions} from '@smui/snackbar';

let factObj = { fact: "", contributor: ""};

  const contributeForm = form(() => ({
    fact: { value: factObj.fact, validators: ["required", "min:5","max:150"]},
    contributor: { value: factObj.contributor, validators: ["required", "min:5","max:80"]},
  }));

function sendContribution(e) {
   e.preventDefault();
  factObj.insertTime = new Date().getTime();
  if (!navigator.onLine) {
    notify("Your internet connection is lost and lurin couldn't fix it. try later.");
    return false;
  }

  return addFactProposal(factObj).then(
    function() {
      factObj.fact = "";
      factObj.contributor = "";
      notify("fact added, lurin will decide if it's worth it");
    },
    function(e) {
      console.log('error on save:',e);
      notify("lurin doesn't like this fact, error during save.");
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
    class="formButton">
      <Label>Send</Label>
    </Button>
  </form>
</div>
