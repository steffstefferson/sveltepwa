<script>
  import { login,logout,userStore,resetPasswordRequest } from './../services/loginService.js';
  import { form } from 'svelte-forms';
  import { notifier } from "smelte";
import { TextField } from "smelte";
 import { Button } from "smelte";


let loginObj = { email: "", password: ""};

 let user = {};
 let showLogin = true;
  const unsubscribe = userStore.subscribe(u => {
    showLogin = !u.loggedIn;
    user = u;
	});

  const loginForm = form(() => ({
    email: { value: loginObj.email, validators: ["required", "email","min:5","max:150"]},
    password: { value: loginObj.password, validators: ["required", "min:5","max:80"]},
  }));

function logoutUser(e){
    e.preventDefault();
    logout().then(u => user = u);
    return false;
}

function sendPasswordResetLink(){
    resetPasswordRequest(user).then(resposne =>{
     notifier.notify("Password reset email sent. I hope you remember the password of your email account.");
    });
}

function loginUser(e) {
   e.preventDefault();
  if (!navigator.onLine) {
   notifier.notify("Your internet connection is lost and lurin couldn't fix it. try later.");
    return false;
  }

  return login(loginObj).then(
    function(user) {
      if(user.loggedIn){
        loginObj.email = "";
        loginObj.password = "";
       notifier.notify("you are logged in! Add some nice content.");
      }else{
       notifier.notify("oooups, lurin didn't let you login.");
      }
    },
    function(e) {
      console.log('login error:',e);
     notifier.notify("oooups, lurin didn't let you login.");
    });
  return false;

}
</script>

<style type="text/postcss">

</style>
<div  style="max-width: 400px;">
  {#if showLogin}
  <h1>Login</h1>
  <form on:submit={loginUser}>
  <div>
    <TextField bind:value={loginObj.email} label="Email Address" hint="our email address?" />
    </div><div>
    <TextField bind:value={loginObj.password} label="Password" hint="Password, please. Can't remember? Ask Lurin!" />
  </div>
    <Button 
    disabled={!$loginForm.valid || loginObj.password.length == 0}  
    class="formButton">Login
    </Button>
  </form>
    <Button on:click={sendPasswordResetLink}
    disabled={!$loginForm.email.valid || loginObj.email.length == 0}  
    class="formButton">Send password reset link
    </Button>

  {:else}
  <h1>LoggedIn</h1>
  <h3>As: {user.email}</h3>
  <form on:submit={logoutUser}>
    <Button 
    class="formButton"
    variant="raised">Logout
    </Button>
  </form>
  {/if}

</div>
