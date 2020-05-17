<script>
  import { addFactProposal } from "./../services/factsWrapperService.js";
  import { notify } from "./../services/notifyService.js";
  import { form } from "svelte-forms";
  import Button, { Label } from "@smui/button";

  let factObj = { fact: "", contributor: "" };

  const contributeForm = form(() => ({
    fact: { value: factObj.fact, validators: ["required", "min:5", "max:150"] },
    contributor: {
      value: factObj.contributor,
      validators: ["required", "min:5", "max:80"]
    }
  }));

  function sendContribution(e) {
    e.preventDefault();
    factObj.insertTime = new Date().getTime();
    if (!navigator.onLine) {
      notify(
        "Your internet connection is lost and lurin couldn't fix it. try later."
      );
      return false;
    }

    return addFactProposal(factObj).then(
      function() {
        factObj.fact = "";
        factObj.contributor = "";
        notify("fact added, lurin will decide if it's worth it");
      },
      function(e) {
        console.log("error on save:", e);
        notify("lurin doesn't like this fact, error during save.");
      }
    );
    return false;
  }
</script>

<style type="text/postcss">

</style>

<div class="contentpadding">
  <h1>Contribute</h1>
  <form on:submit={sendContribution} class="lurinForm">

    <div>
      <label for="contributor">Contributor</label>
      <input type="text" name="contributor" bind:value={factObj.contributor} />
    </div>
    <br />
    <div>
      <label for="fact">Fact</label>
      <textarea name="fact" cols="40" rows="5" bind:value={factObj.fact} />
      {factObj.fact.length} / 150
    </div>

    <Button
      disabled={!$contributeForm.valid || factObj.fact.length == 0}
      variant="raised"
      class="formButton">
      <Label>Send</Label>
    </Button>
  </form>
</div>
