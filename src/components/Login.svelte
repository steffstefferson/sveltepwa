<script>
  import {
    login,
    logout,
    userStore,
    resetPasswordRequest
  } from "./../services/loginWrapperService.js";
  import { form } from "svelte-forms";
  import Button, { Label } from "@smui/button";
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

  async function loginUser(e) {
    e.preventDefault();
    if (!navigator.onLine) {
      notify(
        "Your internet connection is lost and lurin couldn't fix it. try later."
      );
      return false;
    }
    try {
      await login(loginObj);
    } catch (e) {
      console.log("login error:", e);
      notify("oooups, lurin didn't let you login.");
    }
  }
</script>

<style type="text/postcss">

</style>

<div class="contentpadding">
  {#if showLogin}
    <h1>Login</h1>
    <form on:submit={loginUser} class="lurinForm">
      <div>
        <label for="email">Email Address</label>
        <input type="text" name="email" bind:value={loginObj.email} />
      </div>
      <br />
      <div>
        <label for="password">Password</label>
        <input type="password" name="password" bind:value={loginObj.password} />
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
