import { db } from "./customfirebase";
import { triggerPush } from "./pushService";
let poposalArray = [];

var proposalDbRef = db.ref("factsProposal");
var factsDbRef = db.ref().child("facts");

proposalDbRef.on("child_added", function (snapshot) {
  var proposal = snapshot.val();
  proposal.key = snapshot.key;
  poposalArray.push(proposal);
});
proposalDbRef.on("child_removed", function (snapshot) {
  poposalArray = poposalArray.filter((p) => p.key !== snapshot.key);
});

export function addFactProposal(factObj) {
  const proposalRef = proposalDbRef.push();
  return proposalRef.set(factObj);
}

export function getFactsProposals() {
  return poposalArray;
}

export function deleteFactProposal(proposal) {
  if (proposal && proposal.key) {
    return proposalDbRef
      .child(proposal.key)
      .remove()
      .then((error) => {
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
    contributor: proposal.contributor,
  };
  return saveFact(fact).then((error) => {
    if (error) {
      console.log("error accept proposal", error);
      return false;
    }
    let ok = deleteFactProposal(proposal);
    if (ok) {
      triggerPush();
    }
    return ok;
  });
}

function saveFact(fact) {
  let newFactRef = factsDbRef.push();
  return newFactRef.set(fact);
}
