<script>
  import { notificationStore } from "./../services/notifyService.js";
  import { Label } from "@smui/button";
  import { onMount } from "svelte";
  import Snackbar, { Actions } from "@smui/snackbar";

  let mySnackbar;
  let mySnackbarText;

  onMount(async () => {
    notificationStore.subscribe(x => {
      mySnackbarText = x.msg;
      mySnackbarText && mySnackbar.open();
    });
  });
</script>

<Snackbar bind:this={mySnackbar} labelText={mySnackbarText}>
  <Label />
</Snackbar>
