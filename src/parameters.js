import default_params from '../data/default_parameters.json'
import { wellFormedArray } from './utils.js'

export const createParameters = (
  S_0,
  E1_0,
  mixMatSet,
  ttBeta,
  betaSet,
  nBeds,
  nICUBeds
) => {
  const nAge = 17;
  const nVaccine = 6;

  if (!wellFormedArray(S_0, [nVaccine, nAge])) {
    throw Error(`S_0 must have the dimensions ${nVaccine} x ${nAge}`);
  }

  if (!wellFormedArray(E1_0, [nVaccine, nAge])) {
    throw Error(`E1_0 must have the dimensions ${nVaccine} x ${nAge}`);
  }

  if (!wellFormedArray(mixMatSet, [nAge, nAge, 1])) {
    throw Error(`mixMatSet must have the dimensions ${nAge} x ${nAge} x 1`);
  }

  if (!(nAge == mixMatSet[0].length && nAge == E1_0[0].length)) {
    throw Error("mismatch between population and mixing matrix size");
  }

  if (ttBeta.length !== betaSet.length) {
    throw Error("mismatch between ttBeta and betaSet size");
  }

  if (nBeds < 0 || nICUBeds < 0) {
    throw Error("Bed counts must be greater than or equal to 0");
  }

  let parameters = {
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
        mix_mat_set: this.mixMatSet,
        tt_matrix: [0],
        tt_beta: this.ttBeta,
        beta_set: this.betaSet,
        hosp_beds: [this.nBeds],
        tt_hosp_beds: [0],
        ICU_beds: [this.nICUBeds],
        tt_ICU_beds: [0],
        max_vaccine: [0],
        tt_vaccine: [0],
        S_0: this.S_0,
        E1_0: this.E1_0
      }
    }
  };
  return parameters;
};
