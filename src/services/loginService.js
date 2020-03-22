import { auth } from "./customfirebase";
import { writable } from "svelte/store";

export const userStore = writable({ email: "", loggedIn: false });

auth.onAuthStateChanged(function(authData) {
  if (authData) {
    setLoggedIn(authData.email);
    console.log("User " + authData.email + " is logged in .");
  } else {
    console.log("User is logged out");
    setLoggedOut();
  }
});

function setLoggedIn(email) {
  var user = { email: email, loggedIn: true };
  userStore.set(user);
  return user;
}

function setLoggedOut() {
  let user = { email: "", loggedIn: false };
  userStore.set(user);
  return user;
}

export function login(user) {
  return auth
    .signInWithEmailAndPassword(user.email, user.password)
    .then(function() {
      return setLoggedIn(user.email);
    })
    .catch(function(error) {
      console.log("Login Failed!", error);
      return setLoggedOut();
    });
}

export function resetPasswordRequest(user) {
  return auth.sendPasswordResetEmail(user.email).catch(function(error) {
    console.log("sendPasswordResetEmail Failed!", error);
    return setLoggedOut();
  });
}

export function logout() {
  return auth.signOut().then(function() {
    return setLoggedOut();
  });
}
