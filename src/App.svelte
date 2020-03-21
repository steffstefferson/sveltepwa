<script>
  import Facts from './components/Facts.svelte';
  import Images from './components/Images.svelte';
  import ImageFullScreen from './components/ImageFullScreen.svelte';
  import Header from './components/Header.svelte';
  import Contribute from './components/Contribute.svelte';
  import router from "page"

  if ('serviceWorker' in navigator) {
      //navigator.serviceWorker.register('/service-worker.js');
    }
  let page
  let params
  
  router({hashbang : true})
  router('/facts', () => page = Facts)
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
  router('/*', () => page = Contribute)
  router.start()
</script>



<style>
main {
  background-color: #f8f8f8
}
</style>
<Header></Header>
<main class="overflow-hidden">
    <svelte:component this={page} params={params} />
</main>
