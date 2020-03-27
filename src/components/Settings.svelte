<script>
  import { disablePush,enablePush,getCurrentSubscription  } from './../services/pushNotificationService.js';
  import { notify } from './../services/notifyService.js';
  import Button, {Label} from '@smui/button';

  let isWorking = false;
  let isPushFeatured = "serviceWorker" in navigator && "PushManager" in window;

 async function togglePush(disable){
  isWorking = true;
   var result = "";
   if(disable){
      result = await disablePush();
   }else{
     result = await enablePush();
   }
  notify(result.msg);
  isWorking = false;
 }
</script>

<style type="text/postcss">

</style>
<div>
  <h1>Settings</h1>

<h2>Push Notifications</h2>
<p>Get the latest and greatest news about lurins trips and wisdom.</p>
{#if isPushFeatured}
    <Button 
    on:click={() => togglePush(true) }
    disabled={isWorking}  
    variant="raised"
    class="formButton">
      <Label>Disable</Label>
    </Button>
    <Button 
    on:click={() => togglePush(false)}
    disabled={isWorking}  
    variant="raised"
    class="formButton">
      <Label>Enable</Label>
    </Button>
{:else}
 <p>Sorry, your browser doesn't feature push notification. Ask lurin how to download a real browser</p>
{/if}
</div>
