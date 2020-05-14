<script>
  import {
    deleteFact,
    subscribeToFacts
  } from "./../services/factsWrapperService.js";
  import Dialog, { Title, Content, Actions, InitialFocus } from "@smui/dialog";
  import { notify, ask } from "./../services/notifyService";
  import Fact from "./Fact.svelte";
  import Button, { Label } from "@smui/button";
  import { userStore } from "./../services/loginWrapperService.js";
  import page from "page";
  import { onMount } from "svelte";

  onMount(async function() {
    var s = await subscribeToFacts();
    s.subscribe(x => {
      facts = x;
    });
  });

  let facts = [];
  export let params;
  let selectedFactDialog;
  let selectedFact = null;
  let loggedIn = false;
  userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });

  async function onDeleteFact(event) {
    let ok = await ask("Do you really want to delete this fact?");
    if (ok) {
      deleteFactSerious(event.detail);
    }
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
</script>

<style type="text/postcss">
  .list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }
  .list-item {
    display: flex;
    padding: 0px 20px 25px;
    max-width: 400px;
    min-width: 300px;
    flex: 1 1 0px;
  }

  ul {
    padding-inline-start: 5px;
  }
</style>

<div class="contentpadding">
  <div style="height: 60px;">
    <Button href="/contribute" variant="raised" class="formButton">
      <Label>Contribute your own fact</Label>
    </Button>
  </div>
  <div>
    <ul class="list">
      {#each facts as fact}
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
    <Button action="accept" variant="raised" class="formButton">
      <Label>Got it!</Label>
    </Button>
  </Actions>
</Dialog>
