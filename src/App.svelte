<script>
  import Facts from './components/Facts.svelte';
  import Images from './components/Images.svelte';
  import Login from './components/Login.svelte';
  import ImageFullScreen from './components/ImageFullScreen.svelte';
  import HeaderTopBar from './components/HeaderTopBar.svelte';
  import Contribute from './components/Contribute.svelte';
  import router from "page"
  import { DenseFixedAdjust} from '@smui/top-app-bar';

  if ('serviceWorker' in navigator) {
      //navigator.serviceWorker.register('/service-worker.js');
    }
  let page
  let params
  
  router('/facts', () => page = Facts)
  router('/login', () => page = Login)
  router('/facts/contribute', () => page = Contribute)
  router('/facts/:factKey', (ctx, next) => {
      params = ctx.params
      next()
    }, 
    () => page = ImageFullScreen)
  router('/images', () => page = Images)
  router('/images/:imageKey', (ctx, next) => {
      params = ctx.params
      next()
    }, 
    () => page = ImageFullScreen)
  router('/*', () => page = Login)
  router.start()
</script>

<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">

<style>
:global(body) {
  background-color: #f8f8f8;
  margin: 0px;
}
  :global(app, body, html) {
    display: block !important;
    height: auto !important;
    width: auto !important;
    position: static !important;
    font-family: Roboto,sans-serif;
  }
</style>
<HeaderTopBar></HeaderTopBar>
<main class="overflow-hidden" DenseFixedAdjust>
    <svelte:component this={page} params={params} />
</main>
