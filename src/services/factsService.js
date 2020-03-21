import { db } from "./customfirebase";
import { writable } from "svelte/store";

export function addFactProposal(factObj) {
  const firebaseProposal = db.ref().child("factsProposal");
  const proposalRef = firebaseProposal.push();
  return proposalRef.set(factObj);
}

const factsArray = [];
const svelteFactStore = writable([]);
const factsFromStore = JSON.parse(localStorage.getItem("facts"));

if (factsFromStore && factsFromStore.length) {
  addFact(factsFromStore);
} else {
  console.log("load fact from firebase");
  var starCountRef = db.ref("facts");
  starCountRef.on("child_added", function(snapshot) {
    addFact([snapshot.val()]);
  });
}

function addFact(factArray) {
  factsArray.push(...factArray);
  factsArray.sort((x, y) => y.insertTime - x.insertTime);
  svelteFactStore.set(factsArray);
  localStorage.setItem("facts", JSON.stringify(factsArray));
}

export function getFacts() {
  return svelteFactStore;
}
