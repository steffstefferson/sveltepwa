import * as Comlink from "comlink";
import { writable } from "svelte/store";
import { notify } from "./notifyService";
const worker = new Worker("worker.js");
export const userStore = writable({
  email: "",
  loggedIn: false,
  event: "initial",
});

userStore.subscribe((user) => {
  if (user && user.event == "initial") {
    return;
  }
  if (user.loggedIn) {
    notify("you are logged in! Add some nice content.");
  } else {
    notify("your logged out, lurin kicked you out.");
  }
});

let dataInterface = Comlink.wrap(worker);

export function login(...p) {
  return dataInterface.login(...p);
}

export function resetPasswordRequest(...p) {
  return dataInterface.resetPasswordRequest(...p);
}

export function logout() {
  return dataInterface.logout();
}

async function getLoginState() {
  function callback(f) {
    userStore.set(f);
  }
  dataInterface.subscribeToLoginState(Comlink.proxy(callback));
}

getLoginState();
