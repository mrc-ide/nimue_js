import strategies from '../data/strategies.json';
import defaultParams from '../data/default_parameters.json';
import { wellFormedArray } from './utils.js';
import { round } from './math_bundle.js';

const PRECISION = 15;

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
    ttVaccines: [0],
    maxVaccines: [0],
    nCoverageMat: defaultParams.vaccine_coverage_mat,
    infectionEfficacy: defaultParams.vaccine_efficacy_infection,
    probHosp: defaultParams.prob_hosp,
    dt: 1,
    withHorizon: function(timeStart, timeEnd) {
      if (timeStart > timeEnd) {
        throw Error("timeStart is greater than timeEnd");
      }
      this.timeStart = timeStart;
      this.timeEnd = timeEnd;
      return this;
    },
    withMaxVaccine: function(timesteps, maxVaccines) {
      if (timesteps.length != maxVaccines.length) {
        throw Error("timesteps and maxVaccines need to be the same size");
      }
      this.ttVaccines = timesteps;
      this.maxVaccines = maxVaccines;
      return this;
    },
    withVaccineEfficacy: function(diseaseEfficacy, infectionEfficacy) {
      if (!(diseaseEfficacy >= 0 && diseaseEfficacy <= 1)) {
        throw Error("diseaseEfficacy needs to be >= 0 and <= 1");
      }
      if (!(infectionEfficacy >= 0 && infectionEfficacy <= 1)) {
        throw Error("infectionEfficacy needs to be >= 0 and <= 1");
      }
      const vaccinatedProbHosp = defaultParams.prob_hosp[0].map(
        i => round(i * (1 - diseaseEfficacy), PRECISION)
      );
      const vaccinatedInfectedEff = Array(
        defaultParams.vaccine_efficacy_infection[0].length
      ).fill(round(1 - infectionEfficacy, PRECISION));
      this.probHosp[3] = vaccinatedProbHosp;
      this.probHosp[4] = vaccinatedProbHosp;
      this.infectionEfficacy[3] = vaccinatedInfectedEff;
      this.infectionEfficacy[4] = vaccinatedInfectedEff;
      return this;
    },
    withStrategy: function(strategy) {
      if (!strategies.hasOwnProperty(strategy)) {
        throw Error(`Unknown strategy ${strategy}`);
      }
      this.nCoverageMat = strategies[strategy];
      return this;
    },
    withPrioritisationMatrix: function(m) {
      this.nCoverageMat = m;
      return this;
    },
    _toOdin: function() {
      return {
        ...defaultParams,
        mix_mat_set: this.mixMatSet,
        tt_matrix: [0],
        tt_beta: this.ttBeta,
        beta_set: this.betaSet,
        hosp_beds: [this.nBeds],
        tt_hosp_beds: [0],
        ICU_beds: [this.nICUBeds],
        tt_ICU_beds: [0],
        max_vaccine: this.maxVaccines,
        tt_vaccine: this.ttVaccines,
        prob_hosp: this.probHosp,
        vaccine_efficacy_infection: this.infectionEfficacy,
        S_0: this.S_0,
        E1_0: this.E1_0,
        vaccine_coverage_mat: this.nCoverageMat,
        N_prioritisation_steps: this.nCoverageMat[0].length
      };
    }
  };
  return parameters;
};
