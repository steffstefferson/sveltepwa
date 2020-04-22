<script>
  import "./App.scss";
  import Facts from "./components/Facts.svelte";
  import Images from "./components/Images.svelte";
  import Map from "./components/Map.svelte";
  import Settings from "./components/Settings.svelte";
  import AddPlaceToBe from "./components/AddPlaceToBe.svelte";
  import Login from "./components/Login.svelte";
  import ImageFullScreen from "./components/ImageFullScreen.svelte";
  import HeaderTopBar from "./components/HeaderTopBar.svelte";
  import ShareApiTest from "./components/ShareApiTest.svelte";
  import Contribution from "./components/Contribution.svelte";
  import ManageContribution from "./components/ManageContribution.svelte";
  import Notification from "./components/Notification.svelte";
  import router from "page";
  import { DenseFixedAdjust } from "@smui/top-app-bar";

  let page;
  let params = {};

  router("/login", () => (page = Login));
  router("/settings", () => (page = Settings));
  router("/contribute", () => (page = Contribution));
  router("/contributions", () => (page = ManageContribution));
  router("/addImage", () => (page = AddPlaceToBe));
  router("/shareApiTest", () => (page = ShareApiTest));

  router("/facts", () => (page = Facts));
  router(
    "/facts?key=:factKey",
    (ctx, next) => {
      params = ctx.params;
      next();
    },
    () => (page = Facts)
  );

  router("/map", () => (page = Map));
  router("/images", () => (page = Images));

  router(
    "/images/slideShow",
    (ctx, next) => {
      params = ctx.querystring.split("&").reduce((red, keyval) => {
        let [key, val] = keyval.split("=");
        red[key] = val;
        return red;
      }, {});
      next();
    },
    () => (page = ImageFullScreen)
  );

  router("/*", () => (page = Facts));
  router.start();
</script>

<style>
  :global(body) {
    margin: 0px;
  }

  :global(.formButton) {
    margin-top: 20px;
    margin-left: 10px;
    float: right;
  }

  :global(app, body, html) {
    display: block !important;
    height: auto !important;
    width: auto !important;
    position: static !important;
    font-family: Roboto, sans-serif;
  }
  .mainContainer {
    padding: 40px 20px;
  }
</style>

<HeaderTopBar />
<main class="mainContainer" DenseFixedAdjust>
  <svelte:component this={page} {params} />
</main>
<Notification />
