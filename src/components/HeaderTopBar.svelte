<script>
  import "./../App.scss";
  import TopAppBar, { Row, Section, Title } from "@smui/top-app-bar";
  import IconButton, { Icon } from "@smui/icon-button";
  import Button, { Label } from "@smui/button";
  import Menu, { SelectionGroup, SelectionGroupIcon } from "@smui/menu";
  import { Anchor } from "@smui/menu-surface";
  import List, { Item } from "@smui/list";
  import page from "page";
  import {
    login,
    logout,
    userStore
  } from "./../services/loginWrapperService.js";

  let loggedIn = false;
  const unsubscribe = userStore.subscribe(user => {
    loggedIn = user.loggedIn;
  });

  let dense = true;
  let prominent = false;
  let variant = "standard";
  let collapsed = false;

  let menu2;
  let anchor2;
</script>

<style type="text/postcss">
  .pageTitle {
    color: var(--mdc-theme-on-primary, black);
  }
  .twitterLink {
    margin: auto;
    padding-right: 13px;
  }
</style>

<TopAppBar {dense} {prominent} {variant} color="primary" bind:collapsed>
  <Row>
    <Section>
      <IconButton class="material-icons" on:click={() => menu2.setOpen(true)}>
        menu
      </IconButton>
      <span class="pageTitle">Lurinfacts beta</span>
    </Section>
    <a
      class="twitterLink"
      target="_blank"
      href="https://www.twitter.com/@lurin_tha_one"
      alt="follow Lurin on twitter">
      <img src="./../assets/twitter_logo.png" alt="Twitter Logo" />
    </a>
  </Row>
</TopAppBar>
<div use:Anchor bind:this={anchor2}>
  <Menu
    bind:this={menu2}
    anchor={false}
    bind:anchorElement={anchor2}
    anchorCorner="BOTTOM_LEFT">
    <List>
      <Item on:SMUI:action={() => page('/')}>Home</Item>
      <Item on:SMUI:action={() => page('/facts')}>Facts</Item>
      <Item on:SMUI:action={() => page('/images')}>Images</Item>
      <Item on:SMUI:action={() => page('/map')}>Map</Item>
      <Item on:SMUI:action={() => page('/settings')}>Settings</Item>
      <Item on:SMUI:action={() => page('/login')}>
        {loggedIn ? 'Logout' : 'Login'}
      </Item>
      {#if loggedIn}
        <Item on:SMUI:action={() => page('/contributions')}>
          <Icon
            class="material-icons"
            style="font-size:18px; margin-top: -5px;">
            lock
          </Icon>
          Contributions
        </Item>
        <Item on:SMUI:action={() => page('/addImage')}>
          <Icon
            class="material-icons"
            style="font-size:18px; margin-top: -5px;">
            lock
          </Icon>
          Add image
        </Item>
      {/if}
    </List>
  </Menu>
</div>
