import { db } from "./customfirebase";
import { writable } from "svelte/store";

let factsArray = [];
let poposalArray = [];
export const svelteFactStore = writable([]);
export const svelteFactProposalStore = writable([]);
const factsFromStore = JSON.parse(localStorage.getItem("facts"));

var proposalDbRef = db.ref("factsProposal");
var factsDbRef = db.ref("facts");

proposalDbRef.on("child_added", function(snapshot) {
  var proposal = snapshot.val();
  proposal.key = snapshot.key;
  poposalArray.push(proposal);
  svelteFactProposalStore.set(poposalArray);
});
proposalDbRef.on("child_removed", function(snapshot) {
  poposalArray = poposalArray.filter(p => p.key !== snapshot.key);
  svelteFactProposalStore.set(poposalArray);
});

if (factsFromStore && factsFromStore.length) {
  factsArray.push(...factsFromStore);
  factsArray.sort((x, y) => y.insertTime - x.insertTime);
  svelteFactStore.set(factsArray);
}

factsDbRef.on("child_added", function(snapshot) {
  var fact = snapshot.val();
  fact.key = snapshot.key;
  addFact(fact);
});
factsDbRef.on("child_removed", function(snapshot) {
  factsArray = factsArray.filter(p => p.key !== snapshot.key);
  svelteFactStore.set(factsArray);
});

export function addFactProposal(factObj) {
  const proposalRef = proposalDbRef.push();
  return proposalRef.set(factObj);
}

export function deleteFact(fact) {
  if (fact && fact.key) {
    return factsDbRef
      .child(fact.key)
      .remove()
      .then(error => {
        if (error) {
          console.log("error delete fact", error);
          return false;
        }
        return true;
      });
  }
  return Promise.resolve(false);
}

export function deleteFactProposal(proposal) {
  if (proposal && proposal.key) {
    return proposalDbRef
      .child(proposal.key)
      .remove()
      .then(error => {
        if (error) {
          console.log("error delete proposal", error);
          return false;
        }
        return true;
      });
  }
  return Promise.resolve(false);
}

export function acceptFactProposal(proposal) {
  let fact = {
    fact: proposal.fact,
    insertTime: proposal.insertTime,
    contributor: proposal.contributor
  };
  return saveFact(fact).then(error => {
    if (error) {
      console.log("error accept proposal", error);
      return false;
    }
    return deleteFactProposal(proposal);
  });
}

function saveFact(fact) {
  let newFactRef = db
    .ref()
    .child("facts")
    .push();
  return newFactRef.set(fact);
}

function addFact(fact) {
  if (factsArray.some(x => x.key == fact.key)) {
    return;
  }
  factsArray.push(fact);
  factsArray.sort((x, y) => y.insertTime - x.insertTime);
  svelteFactStore.set(factsArray);
  localStorage.setItem("facts", JSON.stringify(factsArray));
}
