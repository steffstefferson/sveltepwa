import { auth } from "./customfirebase";

var initialState = true;

export function subscribeToLoginState(callback) {
  auth.onAuthStateChanged(function (authData) {
    var eventName = initialState ? "initial" : "authChange";
    if (authData) {
      callback({ email: authData.email, loggedIn: true, event: eventName });
    } else {
      callback({ email: "", loggedIn: false, event: eventName });
    }
    initialState = false;
  });
}

export function login(user) {
  return auth
    .signInWithEmailAndPassword(user.email, user.password)
    .then(function () {
      console.log("login done!", user.email);
    })
    .catch(function (error) {
      console.log("Login Failed!", error);
    });
}

export function resetPasswordRequest(user) {
  return auth.sendPasswordResetEmail(user.email).catch(function (error) {
    console.log("sendPasswordResetEmail Failed!", error);
  });
}

export function logout() {
  return auth.signOut().then(function () {
    console.log("logout done!");
  });
}
