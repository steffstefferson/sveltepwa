<script>
  import { getImages } from "../services/imageSerivce.js";
  import Image from "./Image.svelte";
  import { userStore } from "./../services/loginService.js";
  import Kitchen from "@smui/snackbar/kitchen/index";
  import { deleteImageAndMetadata } from "../services/imageUploadService.js";
  import { notify } from "./../services/notifyService.js";

  const localStore = getImages();

  let loggedIn = false;
  userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });

  let kitchen;

  function onDeleteLocation(event) {
    return pushToKitchen(event.detail);
  }

  function deleteLocationSerious(location) {
    deleteImageAndMetadata(location).then(
      () => {
        notify("location was deleted");
      },
      () => {
        notify("something went wrong while deleting the location");
      }
    );
  }

  function pushToKitchen(location) {
    kitchen.push({
      props: {
        variant: "stacked"
      },
      label: "Do you really want to delete this location?",
      actions: [
        {
          onClick: () => deleteLocationSerious(location),
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
    width: 300px;
  }

  .list-content p {
    flex: 1 0 auto;
  }
</style>

<div>
  <ul class="list">
    {#each $localStore as image}
      <li class="list-item">
        <Image
          {image}
          hasDeleteButton={loggedIn}
          on:delete={onDeleteLocation} />
      </li>
    {/each}
  </ul>
</div>

<Kitchen bind:this={kitchen} dismiss$class="material-icons" />
