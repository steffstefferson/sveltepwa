import { writable } from "svelte/store";

export const notificationStore = writable("");

export function notify(msg) {
  notificationStore.set({ msg, time: +new Date() });
}
