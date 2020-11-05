import default_params from '../data/default_parameters.json'
import { wellFormedArray } from './utils.js'

const parametersPrototype = {
  withHorizon: function(timeStart, timeEnd) {
    if (timeStart > timeEnd) {
      throw Error("timeStart is greater than timeEnd");
    }
    this.timeStart = timeStart;
    this.timeEnd = timeEnd;
    return this;
  },
  _toOdin: function() {
    return {
      ...default_params,
      tt_matrix: [0],
      mix_mat_set: this.mixMatSet,
      tt_beta: this.ttBeta,
      beta_set: this.betaSet,
      hosp_bed_capacity: this.nBeds,
      ICU_bed_capacity: this.nICUBeds
    }
  }
};

export const createParameters = (
  population,
  mixMatSet,
  ttBeta,
  betaSet,
  nBeds,
  nICUBeds
) => {
  //if (!wellFormedArray(mixMatSet, [population.length - 1, population.length - 1, 1])) {
    //throw Error("mixMatSet must have the dimensions (nAge - 1) x (nAge - 1) x 1");
  //}

  //if (population.length !== mixMatSet[0].length) {
    //throw Error("mismatch between population and mixing matrix size");
  //}

  if (ttBeta.length !== betaSet.length) {
    throw Error("mismatch between ttBeta and betaSet size");
  }

  if (nBeds < 0 || nICUBeds < 0) {
    throw Error("Bed counts must be greater than or equal to 0");
  }

  let parameters = {
    population,
    mixMatSet,
    ttBeta,
    betaSet,
    nBeds,
    nICUBeds,
    timeStart: 0,
    timeEnd: 250,
  };
  Object.setPrototypeOf(parameters, parametersPrototype);
  return parameters;
};
