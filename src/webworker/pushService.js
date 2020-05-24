export function triggerPush() {
  return fetch(
    "https://us-central1-burning-inferno-892.cloudfunctions.net/pushContent",
    {
      method: "POST",
      mode: "no-cors",
    }
  );
}
