<script>
  import { svelteFactStore, deleteFact } from "./../services/factsService";
  import Dialog, { Title, Content, Actions, InitialFocus } from "@smui/dialog";
  import { notify } from "./../services/notifyService";
  import Fact from "./Fact.svelte";
  import Button, { Label } from "@smui/button";
  import { userStore } from "./../services/loginService.js";
  import Kitchen from "@smui/snackbar/kitchen/index";
  import page from "page";

  export let params;
  let selectedFactDialog;
  let selectedFact = null;
  let loggedIn = false;
  userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });

  let kitchen;

  function onDeleteFact(event) {
    return pushToKitchen(event.detail.fact);
  }

  function deleteFactSerious(fact) {
    deleteFact(fact).then(success => {
      if (success) {
        notify("fact was deleted");
      } else {
        notify("something went wrong while deleting the fact");
      }
    });
  }

  if (params.factKey) {
    svelteFactStore.subscribe(facts => {
      selectedFact = facts.filter(x => (x.key = params.factKey))[0];
      if (selectedFact) {
        selectFact(selectedFact);
      }
    });
  }

  function selectFact(fact) {
    selectedFact = fact;
    selectedFactDialog.open();
    page("/facts?key=" + selectedFact.key);
  }

  function pushToKitchen(fact) {
    kitchen.push({
      props: {
        variant: "stacked"
      },
      label: "Do you really want to delete this fact?",
      actions: [
        {
          onClick: () => deleteFactSerious(fact),
          text: "Yes, please"
        },
        {
          text: "Nope"
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
    flex-grow: 1;
  }

  .list-content p {
    flex: 1 0 auto;
  }
  ul {
    padding-inline-start: 5px;
  }
</style>

<div style="height: 50px;">
  <Button href="/contribute" variant="raised" class="formButton">
    <Label>Contribute your own fact</Label>
  </Button>
</div>
<div>
  <ul class="list">
    {#each $svelteFactStore as fact}
      <li class="list-item" on:click={() => selectFact(fact)}>
        <Fact
          {fact}
          hasDeleteButton={loggedIn}
          on:delete={onDeleteFact}
          hasAcceptButton={false} />
      </li>
    {/each}
  </ul>
</div>

<Dialog
  bind:this={selectedFactDialog}
  aria-labelledby="list-title"
  aria-describedby="list-content">
  <Title id="list-title">Fact</Title>
  <Content>
    {#if selectedFact}
      <Fact
        fact={selectedFact}
        hasDeleteButton={false}
        hasAcceptButton={false} />
    {/if}
  </Content>
  <Actions>
    <Button action="accept">
      <Label>Got it!</Label>
    </Button>
  </Actions>
</Dialog>

<Kitchen bind:this={kitchen} dismiss$class="material-icons" />
