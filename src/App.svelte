<script>
import Tailwindcss from './components/Tailwindcss.svelte';
  import "smelte/src/tailwind.css";
  // import 'smelte/src/tailwind.css'
  // import Facts from './components/Facts.svelte';
  // import Images from './components/Images.svelte';
  // import Map from './components/Map.svelte';
  // import Settings from './components/Settings.svelte';
  // import AddPlaceToBe from './components/AddPlaceToBe.svelte';
  import Login from './components/Login.svelte';
  // import ImageFullScreen from './components/ImageFullScreen.svelte';
  // import HeaderTopBar from './components/HeaderTopBar.svelte';
  // import Contribution from './components/Contribution.svelte';
  // import ManageContribution from './components/ManageContribution.svelte';
  import Notification from './components/Notification.svelte';
  import router from "page"


  if ('serviceWorker' in navigator) {
      //navigator.serviceWorker.register('/service-worker.js');
    }
  let page
  let params = {};
  
  // router('/login', () => page = Login)
  // router('/settings', () => page = Settings)
  // router('/contribute', () => page = Contribution)
  // router('/admin/contributions', () => page = ManageContribution)
  // router('/admin/addImage', () => page = AddPlaceToBe)

  // router('/facts', () => page = Facts)
  // router('/facts?key=:factKey', (ctx, next) => {
  //     params = ctx.params
  //     next()
  //   }, () => page = Facts)

  // router('/map', () => page = Map)
  // router('/images', () => page = Images)

  // router('/images/slideShow', (ctx, next) => {
  //     params = ctx.querystring.split("&").reduce((red,keyval) => { let [key,val] = keyval.split('=');  red[key] = val; return red;},{})
  //     next()
  //   },() =>  page = ImageFullScreen)

  router('/*', () => page = Login)
  router.start()
</script>

<style>


:global(body) {
  background-color: #f8f8f8;
  margin: 0px;
}

:global(.formButton){
  margin-top: 20px;
  margin-left: 10px;
  float: right;
}

  :global(app, body, html) {
    display: block !important;
    height: auto !important;
    width: auto !important;
    position: static !important;
    font-family: Roboto,sans-serif;
  }
</style>
<!-- <HeaderTopBar></HeaderTopBar> -->
<main class="overflow-hidden;" style="padding-top: 12px;">
    <svelte:component this={page} params={params} />
</main>
<Notification></Notification>
