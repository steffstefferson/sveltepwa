import { writable } from "svelte/store";

export const notificationStore = writable("");
export const questionStore = writable("");

export function notify(msg) {
  notificationStore.set({ msg, time: +new Date() });
}

export function ask(msg) {
  return new Promise((resolve, reject) => {
    questionStore.set({ msg, time: +new Date(), resolve, reject });
  });
}
