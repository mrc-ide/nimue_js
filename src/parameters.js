import strategies from '../data/strategies.json';
import defaultParams from '../data/default_parameters.json';
import { wellFormedArray } from './utils.js';
import { concat, round, subtract } from './math_bundle.js';
import { scalePrioritisation } from './strategy.js';

const PRECISION = 15;
const nAge = 17;
const nVaccine = 6;

export const createParameters = (
  population,
  mixMatSet,
  ttBeta,
  betaSet,
  nBeds,
  nICUBeds
) => {

  if (population.length !== nAge) {
    throw Error(`population must be length ${nAge}`);
  }

  if (!wellFormedArray(mixMatSet, [nAge, nAge, 1])) {
    throw Error(`mixMatSet must have the dimensions ${nAge} x ${nAge} x 1`);
  }

  if (ttBeta.length !== betaSet.length) {
    throw Error("mismatch between ttBeta and betaSet size");
  }

  if (nBeds < 0 || nICUBeds < 0) {
    throw Error("Bed counts must be greater than or equal to 0");
  }

  // Remove the seed exposed population
  let S0 = Array(nVaccine).fill(Array(nAge).fill(0));
  S0[0] = subtract(population, defaultParams.E1_0[0]);

  let parameters = {
    mixMatSet,
    ttBeta,
    betaSet,
    nBeds,
    nICUBeds,
    population,
    timeStart: 0,
    timeEnd: 250,
    ttVaccines: [0],
    maxVaccines: [0],
    S_0: S0,
    nCoverageMat: defaultParams.vaccine_coverage_mat,
    ttInfectionEfficacy: defaultParams.tt_vaccine_efficacy_infection,
    infectionEfficacy: defaultParams.vaccine_efficacy_infection,
    ttProbHosp: defaultParams.tt_vaccine_efficacy_disease,
    probHosp: defaultParams.prob_hosp,
    gammaVaccine: defaultParams.gamma_vaccine,
    gammaR: defaultParams.gamma_R,
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
    withVaccineInfectionEfficacy: function(timesteps, infectionEfficacy) {
      this.ttInfectionEfficacy = timesteps;
      if (timesteps.length != infectionEfficacy.length) {
        throw Error("timesteps and ve need to be the same size");
      }
      const nonVaccinated = Array(timesteps.length).fill(1);
      for (let v of infectionEfficacy) {
        if (!(v >= 0 && v <= 1)) {
          throw Error("All vaccine efficacies must be >= 0 and <= 1");
        }
      }
      const vaccinated = infectionEfficacy.map(i => 1 - i);
      this.infectionEfficacy = [
        Array(17).fill(nonVaccinated),
        Array(17).fill(nonVaccinated),
        Array(17).fill(nonVaccinated),
        Array(17).fill(vaccinated),
        Array(17).fill(vaccinated),
        Array(17).fill(nonVaccinated)
      ];
      return this;
    },
    withVaccineDiseaseEfficacy: function(timesteps, diseaseEfficacy) {
      if (timesteps.length != diseaseEfficacy.length) {
        throw Error("timesteps and diseaseEfficacy need to be the same size");
      }
      this.ttProbHosp = timesteps;
      for (let v of diseaseEfficacy) {
        if (!(v >= 0 && v <= 1)) {
          throw Error("All vaccine efficacies must be >= 0 and <= 1");
        }
      }
      this.probHosp = concat(
        ...diseaseEfficacy.map(efficacy => {
          let probs = [...defaultParams.prob_hosp];
          let nonVaccine = probs[0].map(
            i => [round(i * (1 - efficacy), PRECISION)]
          );
          probs[3] = nonVaccine;
          probs[4] = nonVaccine;
          return probs;
        })
      )
      return this;
    },
    withStrategy: function(strategy, coverage, vaccinesAvailable) {
      if (!strategies.hasOwnProperty(strategy)) {
        throw Error(`Unknown strategy ${strategy}`);
      }
      return this.withPrioritisationMatrix(
        strategies[strategy],
        coverage,
        vaccinesAvailable
      );
    },
    withPrioritisationMatrix: function(m, coverage, vaccinesAvailable) {
      if (!(coverage >= 0 && coverage <= 1)) {
        throw Error("Vaccine coverage must be >= 0 and <= 1");
      }
      if (coverage == null) {
        throw Error("Please specify vaccine coverage");
      }
      this.nCoverageMat = scalePrioritisation(
        m.map(row => { return row.map(i => i * coverage) }),
        this.population,
        vaccinesAvailable
      )
      return this;
    },
    withVaccineDuration: function(timesteps) {
      if (!timesteps > 0) {
        throw Error("timesteps must be greater than 0");
      }
      const gammaV = 2 * 1 / timesteps;
      this.gammaVaccine[3] = gammaV;
      this.gammaVaccine[4] = gammaV;
      return this;
    },
    withNaturalImmunity: function(timesteps) {
      if (!timesteps > 0) {
        throw Error("timesteps must be greater than 0");
      }
      this.gammaR = 2 * 1/timesteps;
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
        tt_vaccine_efficacy_disease: this.ttProbHosp,
        vaccine_efficacy_infection: this.infectionEfficacy,
        tt_vaccine_efficacy_infection: this.ttInfectionEfficacy,
        S_0: this.S_0,
        vaccine_coverage_mat: this.nCoverageMat,
        N_prioritisation_steps: this.nCoverageMat[0].length,
        gamma_vaccine: this.gammaVaccine,
        gamma_R: this.gammaR
      };
    }
  };
  return parameters;
};
