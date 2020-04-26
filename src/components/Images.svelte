<script>
  import { svelteImageStore } from "../services/imageSerivce.js";
  import Image from "./Image.svelte";
  import { userStore } from "./../services/loginService.js";

  import { deleteImageAndMetadata } from "../services/imageUploadService.js";
  import { notify, ask } from "./../services/notifyService.js";

  let loggedIn = false;
  userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });

  async function onDeleteLocation(event) {
    let ok = await ask("Do you really want to delete this location?");
    if (ok) {
      deleteLocationSerious(event.detail);
    }
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
    {#each $svelteImageStore as image}
      <li class="list-item">
        <Image
          {image}
          hasDeleteButton={loggedIn}
          on:delete={onDeleteLocation} />
      </li>
    {/each}
  </ul>
</div>
