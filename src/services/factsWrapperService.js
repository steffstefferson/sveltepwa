import * as Comlink from "comlink";
import { writable } from "svelte/store";
const worker = new Worker("worker.js");

let facts = writable([]);
let newestFacts = writable([]);
let factAdapter = writable([]);

let dataInterface = Comlink.wrap(worker);

export async function addFactProposal(...p) {
  return dataInterface.addFactProposal(...p);
}

export async function getFactsProposals(...p) {
  return dataInterface.getFactsProposals(...p);
}

export async function deleteFactProposal(...p) {
  return dataInterface.deleteFactProposal(...p);
}

export async function acceptFactProposal(...p) {
  return dataInterface.acceptFactProposal(...p);
}

export async function deleteFact(...p) {
  return dataInterface.deleteFact(...p);
}

export async function subscribeToFacts() {
  return facts;
}

export async function subscribeToNewestFacts() {
  return newestFacts;
}

async function loadFacts() {
  var storedFacts = localStorage.getItem("facts") || "[]";
  const factsArray = JSON.parse(storedFacts);

  facts.set(factsArray);
  newestFacts.set(getNewest(factsArray));

  function callback(f) {
    factAdapter.set(f);
  }
  dataInterface.subscribeToFacts(Comlink.proxy(callback));

  factAdapter.subscribe((f) => {
    // console.log("got call back from comlink", f);
    var valToAdd = Array.isArray(f) ? f : [f];

    var notYetStoredFacts = valToAdd.filter(
      (x) => !factsArray.some((a) => a.key == x.key)
    );

    if (notYetStoredFacts.length == 0) {
      return;
    }

    factsArray.push(...notYetStoredFacts);

    factsArray.sort((x, y) => y.insertTime - x.insertTime);

    let factsForLocalStore = factsArray.filter((x, idx) => idx < 10);
    localStorage.setItem("facts", JSON.stringify(factsForLocalStore));

    facts.set(factsArray);
    newestFacts.set(getNewest(factsArray));
  });
}

function getNewest(factsArray) {
  return factsArray.filter((x, idx) => idx < 3);
}

loadFacts();
