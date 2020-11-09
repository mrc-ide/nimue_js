import default_params from '../data/default_parameters.json'
import { wellFormedArray } from './utils.js'

export const createParameters = (
  population,
  mixMatSet,
  ttBeta,
  betaSet,
  nBeds,
  nICUBeds,
  S_0,
  E1_0
) => {
  //if (!wellFormedArray(mixMatSet, [population.length - 1, population.length - 1, 1])) {
    //throw Error("mixMatSet must have the dimensions (nAge - 1) x (nAge - 1) x 1");
  //}

  //if (population.length !== mixMatSet[0].length) {
    //throw Error("mismatch between population and mixing matrix size");
  //}

  if (!(Array.isArray(ttBeta) && Array.isArray(betaSet))) {
    throw Error("ttBeta and betaSet must be arrays");
  }

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
    S_0,
    E1_0,
    timeStart: 0,
    timeEnd: 250,
    dt: 1,
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
        hosp_beds: [this.nBeds],
        tt_hosp_beds: [0],
        ICU_beds: [this.nICUBeds],
        tt_ICU_beds: [0],
        max_vaccine: [1000],
        tt_vaccine: [0],
        S_0: this.S_0,
        E1_0: this.E1_0
      }
    }
  };
  return parameters;
};
