<script>
  import "./../App.scss";
  import page from "page";
  import IconButton, { Icon } from "@smui/icon-button";
  import { createEventDispatcher } from "svelte";

  import {
    login,
    logout,
    userStore
  } from "./../services/loginWrapperService.js";

  const dispatch = createEventDispatcher();

  function deleteLocation(e) {
    e.stopPropagation();
    dispatch("delete", image);
  }

  let loggedIn = false;
  const unsubscribe = userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });
  let minimized = true;

  function checkIsOpened(e) {
    if (minimized) {
      toggleMenu();
      e.preventDefault();
    }
    return false;
  }
  function toggleMenu() {
    minimized = !minimized;
    dispatch("message", minimized);
  }
</script>

<style type="text/postcss">
  .pageTitle {
    color: var(--mdc-theme-on-primary, black);
  }

  nav {
    display: grid;
    grid-template-columns: 1px auto 1px;
    background-color: var(--mdc-theme-primary, yellow);
    height: 100vh;
    padding: 15px;
  }
  nav.minimized {
    grid-template-columns: auto auto auto;
    height: 20px;
  }

  ul {
    margin: 4px 50px;
    list-style: none;
    padding: 0px 10px;
    background-color: var(--mdc-theme-primary, yellow);
  }

  nav.minimized ul {
    width: 25px;
    margin: 0px;
  }

  li {
    text-align: center;
    padding: 10px 20px;
    margin-bottom: 10px;
    font-size: 4vw;
    transition: 1s;
  }

  nav.minimized ul li {
    background-color: black;
    margin-bottom: 0px;
    padding: 0px;
  }

  nav.minimized ul > li:nth-child(-n + 3) {
    margin-bottom: 3px;
    padding: 2px 3px;
  }

  nav.minimized ul li a {
    display: none;
  }
</style>

<nav on:click={toggleMenu} class={minimized ? 'minimized' : ''}>
  <div>
    {#if minimized}
      <div class="pageTitle">Lurinfacts beta</div>
    {/if}
  </div>
  <div>
    <ul>
      <li>
        <a on:click={checkIsOpened} href="/">Home</a>
      </li>
      <li>
        <a on:click={checkIsOpened} href="/facts">Facts</a>
      </li>
      <li>
        <a on:click={checkIsOpened} href="/images">Images</a>
      </li>
      <li>
        <a on:click={checkIsOpened} href="/map">Map</a>
      </li>
      <li>
        <a on:click={checkIsOpened} href="/settings">Settings</a>
      </li>
      <li>
        <a on:click={checkIsOpened} href="/login">
          {loggedIn ? 'Logout' : 'Login'}
        </a>
      </li>
      {#if loggedIn}
        <li>
          <a on:click={checkIsOpened} href="/contributions">
            {#if !minimized}
              <Icon class="material-icons">lock</Icon>
            {/if}
            Contributions
          </a>
        </li>
        <li>
          <a on:click={checkIsOpened} href="/addImage">
            {#if !minimized}
              <Icon class="material-icons">lock</Icon>
            {/if}
            Add image
          </a>
        </li>
      {/if}
    </ul>
  </div>
  {#if minimized}
    <div style="justify-self: end;">

      <a
        class="twitterLink"
        target="_blank"
        href="https://www.twitter.com/@lurin_tha_one"
        alt="follow Lurin on twitter">
        <img src="./../assets/twitter_logo.png" alt="Twitter Logo" />
      </a>

    </div>
  {/if}
</nav>
