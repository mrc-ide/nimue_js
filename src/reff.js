import { arrayEqual } from './utils.js';
import { leadingEigenvalue } from './eigenvalues.js';

import {
  add,
  dotDivide,
  dotMultiply,
  subset,
  index,
  range,
  transpose,
  multiply,
  subtract,
  squeeze,
  reshape,
  size,
  concat,
  zeros,
  apply,
  sum
} from './math_bundle.js';

import pars from '../data/default_parameters.json'

const S_INDEX = range(18, 120);
const N_VACCINE_STATES = 6;

function rowDivide(m, a) {
  return m.map(row => dotDivide(row, a));
}

function rowMultiply(m, a) {
  return m.map(row => dotMultiply(row, a));
}

export function reffRaw(
  output,
  beta,
  population,
  mixingMatrix,
  probHosp,
  ttEfficacyDisease,
  vaccineInfectionEfficacy,
  ttEfficacyInfection,
  tSubset = null
) {
  if (!arrayEqual(size(mixingMatrix), [population.length, population.length])) {
    throw Error("mixMatSet must have the dimensions nAge x nAge");
  }

  if (!arrayEqual(size(probHosp), [N_VACCINE_STATES, population.length, ttEfficacyDisease.length])) {
    throw Error("probHosp must have the dimensions nVaccine x nAge x timesteps");
  }

  if (!arrayEqual(size(vaccineInfectionEfficacy), [N_VACCINE_STATES, population.length, ttEfficacyInfection.length])) {
    throw Error("vaccineInfectionEfficacy must have the dimensions nVaccine x nAge x timesteps");
  }

  if (population.length !== mixingMatrix.length) {
    throw Error("mismatch between population and mixing matrix size");
  }

  if (tSubset == null) {
    tSubset = [...Array(beta.length).keys()];
  } else {
    beta = subset(beta, index(tSubset));
  }

  // fill gaps and reshape probhosp to timestep x vaccine x age
  probHosp = tSubset.map(t => {
    let tIndex = ttEfficacyDisease.findIndex(n => n > t);
    tIndex = tIndex === -1 ? ttEfficacyDisease.length - 1 : tIndex - 1;
    return reshape(
      subset(
        probHosp,
        index(range(0, N_VACCINE_STATES), range(0, population.length), tIndex)
      ),
      [N_VACCINE_STATES, population.length]
    );
  });

  // fill gaps and reshape vaccine efficacy to timestep x vaccine x age
  vaccineInfectionEfficacy = tSubset.map(t => {
    let tIndex = ttEfficacyInfection.findIndex(n => n > t);
    tIndex = tIndex === -1 ? ttEfficacyInfection.length - 1 : tIndex - 1;
    return reshape(
      subset(
        vaccineInfectionEfficacy,
        index(range(0, N_VACCINE_STATES), range(0, population.length), tIndex)
      ),
      [N_VACCINE_STATES, population.length]
    );
  });

  //remove singleton arrays
  output = squeeze(output);
  population = squeeze(population);

  let propSusc = reshape(
    rowDivide(
      // get the susceptible counts for the current time horizion
      subset(output, index(tSubset, S_INDEX)),
      // divide by the total population size (copy 6 times for each vaccine
      // state)
      concat(...Array(N_VACCINE_STATES).fill(0).map(() => population))
    ),
    // reshape to match probHosp shape
    [size(tSubset)[0], N_VACCINE_STATES, population.length]
  );

  // multiply by vaccine efficacy along time
  propSusc = propSusc.map((m, t) => {
    return dotMultiply(
      m, 
      vaccineInfectionEfficacy[t]
    )
  });

  const relativeR0 = probHosp.map(p => {
    return add(
      dotMultiply(p, pars.dur_ICase),
      dotMultiply(subtract(1, p), pars.dur_IMild)
    );
  });

  const adjustedEigens = propSusc.map((m, i) => {
    return leadingEigenvalue(
      rowMultiply(
        mixingMatrix,
        apply(dotMultiply(m, relativeR0[i]), 0, sum)
      )
    );
  });

  return dotMultiply(beta, adjustedEigens);
}
