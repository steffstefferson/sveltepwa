import { db } from "./customfirebase";

let factsArray = [];
// let factsNewestArray = [];

var factsDbRef = db.ref("facts");

export function subscribeToFacts(callback) {
  factsDbRef.on("child_added", function (snapshot) {
    var fact = snapshot.val();
    fact.key = snapshot.key;
    if (factsArray.filter((x) => x.key == fact.key).length == 0) {
      addFact(fact);
      callback(fact);
    }
  });
  factsDbRef.on("child_removed", function (snapshot) {
    factsArray = factsArray.filter((p) => p.key !== snapshot.key);
    callback(factsArray);
  });
}

export function deleteFact(fact) {
  if (fact && fact.key) {
    return factsDbRef
      .child(fact.key)
      .remove()
      .then((error) => {
        if (error) {
          console.log("error delete fact", error);
          return false;
        }
        return true;
      });
  }
  return Promise.resolve(false);
}

function addFact(fact) {
  if (factsArray.some((x) => x.key == fact.key)) {
    return;
  }
  factsArray.push(fact);
  factsArray.sort((x, y) => y.insertTime - x.insertTime);
  // // localStorage.setItem("facts", JSON.stringify(factsArray));
  // factsNewestArray = factsArray
  //   .sort((y, x) => x.insertTime > y.insertTime)
  //   .splice(0, 3);
}
