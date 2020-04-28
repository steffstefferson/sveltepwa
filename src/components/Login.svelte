<script>
  import {
    login,
    logout,
    userStore,
    resetPasswordRequest
  } from "./../services/loginService.js";
  import { form } from "svelte-forms";
  import Button, { Label } from "@smui/button";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text/index";
  import { notify } from "./../services/notifyService";
  let loginObj = { email: "", password: "" };

  let user = {};
  let showLogin = true;
  const unsubscribe = userStore.subscribe(u => {
    showLogin = !u.loggedIn;
    user = u;
  });

  const loginForm = form(() => ({
    email: {
      value: loginObj.email,
      validators: ["required", "email", "min:5", "max:150"]
    },
    password: {
      value: loginObj.password,
      validators: ["required", "min:5", "max:80"]
    }
  }));

  function logoutUser(e) {
    e.preventDefault();
    logout().then(u => (user = u));
    return false;
  }

  function sendPasswordResetLink() {
    resetPasswordRequest(user).then(resposne => {
      notify(
        "Password reset email sent. I hope you remember the password of your email account."
      );
    });
  }

  function loginUser(e) {
    e.preventDefault();
    if (!navigator.onLine) {
      notify(
        "Your internet connection is lost and lurin couldn't fix it. try later."
      );
      return false;
    }

    return login(loginObj).then(
      function(user) {
        if (user.loggedIn) {
          loginObj.email = "";
          loginObj.password = "";
          notify("you are logged in! Add some nice content.");
        } else {
          notify("oooups, lurin didn't let you login.");
        }
      },
      function(e) {
        console.log("login error:", e);
        notify("oooups, lurin didn't let you login.");
      }
    );
    return false;
  }
</script>

<style type="text/postcss">

</style>

<div style="max-width: 400px;" class="contentpadding">
  {#if showLogin}
    <h1>Login</h1>
    <form on:submit={loginUser}>
      <div>
        <Textfield
          type="email"
          class="shaped-outlined"
          variant="outlined"
          bind:value={loginObj.email}
          label="Email Address"
          style="width: 100%;"
          input$required
          input$min-length="2"
          input$max-length="80"
          input$aria-controls="helper-text-shaped-outlined-a"
          input$aria-describedby="helper-text-shaped-outlined-a" />
        <HelperText id="helper-text-shaped-outlined-a">
          Your email address?
        </HelperText>
      </div>
      <br />
      <div>
        <Textfield
          type="password"
          class="shaped-outlined"
          variant="outlined"
          bind:value={loginObj.password}
          label="Password"
          style="width: 100%;"
          input$required
          input$min-length="2"
          input$max-length="80"
          input$aria-controls="helper-text-shaped-outlined-a"
          input$aria-describedby="helper-text-shaped-outlined-a" />
        <HelperText id="helper-text-shaped-outlined-a">
          Password, please. Can't remember? Ask Lurin!
        </HelperText>
      </div>
      <Button
        disabled={!$loginForm.valid || loginObj.email.length == 0 || loginObj.password.length == 0}
        variant="raised"
        class="formButton">
        <Label>Login</Label>
      </Button>
    </form>
    <Button
      on:click={sendPasswordResetLink}
      disabled={!$loginForm.email.valid || loginObj.email.length == 0}
      variant="raised"
      class="formButton">
      <Label>Send password reset link</Label>
    </Button>
  {:else}
    <h1>LoggedIn</h1>
    <h3>As: {user.email}</h3>
    <form on:submit={logoutUser}>
      <Button class="formButton" variant="raised">
        <Label>Logout</Label>
      </Button>
    </form>
  {/if}
</div>
