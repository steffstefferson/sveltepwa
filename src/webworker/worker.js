import * as Comlink from "comlink";
import { deleteFact, subscribeToFacts } from "./factsService.js";
import { subscribeToImages, loadFullSizeImage } from "./imageSerivce.js";
import {
  addFactProposal,
  getFactsProposals,
  deleteFactProposal,
  acceptFactProposal,
} from "./factsProposalService.js";

const dataInterface = {
  deleteFact,
  addFactProposal,
  getFactsProposals,
  deleteFactProposal,
  addFactProposal,
  acceptFactProposal,
  subscribeToFacts,
  subscribeToImages,
  loadFullSizeImage,
};
Comlink.expose(dataInterface, self);
