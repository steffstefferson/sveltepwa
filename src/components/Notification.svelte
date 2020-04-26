<script>
  import {
    notificationStore,
    questionStore
  } from "./../services/notifyService.js";
  import { Label } from "@smui/button";
  import { onMount } from "svelte";
  import Snackbar, { Actions } from "@smui/snackbar";
  import Kitchen from "@smui/snackbar/kitchen/index";

  let kitchen;
  let mySnackbar;
  let mySnackbarText;

  onMount(async () => {
    notificationStore.subscribe(x => {
      mySnackbarText = x.msg;
      mySnackbarText && mySnackbar.open();
    });

    questionStore.subscribe(x => {
      if (!x.msg) {
        return;
      }
      pushToKitchen(x.msg, x.resolve, x.reject);
    });
  });

  function pushToKitchen(msg, reslove, reject) {
    if (!kitchen) {
      reject();
    }
    kitchen.push({
      props: {
        variant: "stacked"
      },
      label: msg,
      actions: [
        {
          onClick: () => reslove(true),
          text: "Yes, please"
        },
        {
          text: "Nope",
          onClick: () => reslove(false)
        }
      ],
      dismissButton: false
    });
  }
</script>

<Snackbar bind:this={mySnackbar} labelText={mySnackbarText}>
  <Label />
</Snackbar>
<Kitchen bind:this={kitchen} dismiss$class="material-icons" />
