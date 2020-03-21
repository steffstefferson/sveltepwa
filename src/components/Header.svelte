<script>

  import HamburgerMenu from './HamburgerMenu.svelte';
let classesTopNav = "topnav"

function hanndleToggle() {
  if (classesTopNav === "topnav") {
    classesTopNav+= " responsive";
  } else {
    classesTopNav = "topnav";
  }
}
</script>

<div class={classesTopNav} id="myTopnav">
  <a href="/" class="active">Home</a>
  <a href="/facts">Facts</a> 
  <a href="/images">Images</a>
  <a href="/map">Map</a>
  <div class="icon">
  <HamburgerMenu  on:message={hanndleToggle}></HamburgerMenu>
  </div>
</div>

<style>
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}

.topnav {
  overflow: hidden;
  background-color: #333;
}

.topnav a {
  float: left;
  display: block;
  color: #f2f2f2;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 17px;
}

.topnav a:hover {
  background-color: #ddd;
  color: black;
}

.topnav a.active {
  background-color: #4CAF50;
  color: white;
}

.topnav .icon {
  display: none;
}

@media screen and (max-width: 600px) {
  .topnav a:not(:first-child) {display: none;}
  .topnav .icon {
    float: right;
    display: block;
  }
}

@media screen and (max-width: 600px) {
  .topnav.responsive {position: relative;}
  .topnav.responsive .icon {
    position: absolute;
    right: 0;
    top: 0;
  }
  .topnav.responsive a {
    float: none;
    display: block;
    text-align: left;
  }
}
</style>