
<script>
  import TopAppBar, {Row, Section, Title} from '@smui/top-app-bar';
  import IconButton, {Icon} from '@smui/icon-button';
  import Button, {Label} from '@smui/button';
 import Menu, {SelectionGroup, SelectionGroupIcon} from '@smui/menu';
  import {Anchor} from '@smui/menu-surface';
  import List, {Item} from '@smui/list';
  import page from "page"
  import { login,logout,userStore } from './../services/loginService.js';

  let loggedIn = false;
  const unsubscribe = userStore.subscribe(user => {
		loggedIn = user.loggedIn;
	});

  let dense = true;
  let prominent = false;
  let variant = 'standard';
  let collapsed = false;

  let menu2;
  let anchor2;

</script>
<TopAppBar {dense} {prominent} {variant} bind:collapsed>
  <Row>
    <Section>
      <IconButton class="material-icons"  on:click={() => menu2.setOpen(true)}>menu</IconButton>
      <Title>Lurinfacts</Title>
    </Section>
    <Section align="end" toolbar>
      <IconButton class="material-icons" aria-label="Download">file_download</IconButton>
      {#if variant !== 'short'}
        <IconButton class="material-icons" aria-label="Print this page">print</IconButton>
        <IconButton class="material-icons" aria-label="Bookmark this page">bookmark</IconButton>
      {/if}
    </Section>
  </Row>
</TopAppBar>
<div use:Anchor bind:this={anchor2}>
  <Button>Open Menu</Button>
  <Menu bind:this={menu2} anchor={false} bind:anchorElement={anchor2} anchorCorner="BOTTOM_LEFT">
    <List>
      <Item on:SMUI:action={() => page( "/")}>Home</Item>
      <Item on:SMUI:action={() => page("/facts")}>Facts</Item>
      <Item on:SMUI:action={() => page("/images")}>Images</Item>
      <Item on:SMUI:action={() => page("/map")}>Map</Item>

      <Item on:SMUI:action={() => page("/login")}>{loggedIn ? 'Logout' : 'Login'}</Item>     
    </List>
  </Menu>
</div>