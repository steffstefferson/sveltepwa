<script>
  import { login,logout,userStore,resetPasswordRequest } from './../services/loginService.js';
  import { form } from 'svelte-forms';
  import Button, {Label} from '@smui/button';
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text/index';
  import Snackbar, {Actions} from '@smui/snackbar';

let mySnackbar;
let mySnackbarText = "";
let loginObj = { email: "", password: ""};

 let user = {};
 let showLogin = true;
  const unsubscribe = userStore.subscribe(value => {
    showLogin = !user.loggedIn;
    user = value;
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
      mySnackbarText = "Password reset email sent. I hope you remember the password of your email account."
      mySnackbar.open();
    });
}

function loginUser(e) {
   e.preventDefault();
  if (!navigator.onLine) {
    mySnackbarText = "Your internet connection is lost and lurin couldn't fix it. try later."
    mySnackbar.open();
    return false;
  }

  return login(loginObj).then(
    function(user) {
      if(user.loggedIn){
        loginObj.email = "";
        loginObj.password = "";
        mySnackbarText = "you are logged in! Add some nice content."
      }else{
        mySnackbarText = "oooups, lurin didn't let you login."
      }
      mySnackbar.open();
    },
    function(e) {
      console.log('login error:',e);
      mySnackbarText = "oooups, lurin didn't let you login.";
      mySnackbar.open();
    }
  );
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
      <Textfield type="email" class="shaped-outlined" variant="outlined" bind:value={loginObj.email} label="Email Address"
        style="width: 100%;"
        input$required
        input$min-length=2
        input$max-length=80
        input$aria-controls="helper-text-shaped-outlined-a" 
        input$aria-describedby="helper-text-shaped-outlined-a" />
      <HelperText id="helper-text-shaped-outlined-a">Your email address?</HelperText>
    </div>
    <br/>
  <div>
      <Textfield type="password" class="shaped-outlined" variant="outlined" bind:value={loginObj.password} label="Password"
        style="width: 100%;"
        input$required
        input$min-length=2
        input$max-length=80
        input$aria-controls="helper-text-shaped-outlined-a" 
        input$aria-describedby="helper-text-shaped-outlined-a" />
      <HelperText id="helper-text-shaped-outlined-a">Password, please. Can't remember? Ask Lurin!</HelperText>
  </div>
    <Button 
    disabled={!$loginForm.valid || loginObj.password.length == 0}  
    variant="raised"
    style="float:right; margin-top:20px">
      <Label>Login</Label>
    </Button>
  </form>
    <Button on:click={sendPasswordResetLink}
    disabled={!$loginForm.email.valid || loginObj.email.length == 0}  
    variant="raised"
    style="float:right; margin-top:20px">
      <Label>Send password reset link</Label>
    </Button>

  {:else}
  <h1>LoggedIn</h1>
  <h3>As: {user.email}</h3>
  <form on:submit={logoutUser}>
    <Button 
    variant="raised"
    style="float:right; margin-top:20px">
      <Label>Logout</Label>
    </Button>
  </form>
  {/if}
  <Snackbar bind:this={mySnackbar}>
      <Label>{mySnackbarText}</Label>
  </Snackbar>
</div>
