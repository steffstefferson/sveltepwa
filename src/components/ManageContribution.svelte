<script>
  import {
    getFactsProposals,
    deleteFactProposal,
    acceptFactProposal
  } from "./../services/factsWrapperService.js";
  import Fact from "./Fact.svelte";
  import Button, { Label } from "@smui/button";
  import { notify } from "./../services/notifyService";
  import { userStore } from "./../services/loginWrapperService.js";
  import { onMount } from "svelte";

  let facts = [];

  onMount(async function() {
    facts = await getFactsProposals();
  });

  let loggedIn = false;
  userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });

  function onDeleteFactProposal(event) {
    deleteFactProposal(event.detail.fact).then(success => {
      if (success) {
        notify("fact was deleted");
      } else {
        notify("something went wrong while deleting the fact");
      }
    });
  }

  function onAcceptFactProposal(event) {
    acceptFactProposal(event.detail.fact).then(success => {
      if (success) {
        notify("fact was accepted");
      } else {
        notify("something went wrong while accepting the fact");
      }
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

<div class="contentpadding">
  <h1>Manage fact purposals</h1>
  <ul class="list">
    {#each facts as fact}
      <li class="list-item">
        <Fact
          {fact}
          hasDeleteButton={loggedIn}
          hasAcceptButton={loggedIn}
          on:delete={onDeleteFactProposal}
          on:accept={onAcceptFactProposal}
          class="list-content" />
      </li>
    {/each}
  </ul>
</div>
