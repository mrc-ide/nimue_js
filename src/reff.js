import { wellFormedArray } from './utils.js';
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

export function reff(output, beta, population, mixingMatrix, tSubset = null) {
  if (!wellFormedArray(mixingMatrix, [population.length, population.length])) {
    throw Error("mixMatSet must have the dimensions nAge x nAge");
  }

  if (population.length !== mixingMatrix.length) {
    throw Error("mismatch between population and mixing matrix size");
  }

  if (tSubset == null) {
    tSubset = [...Array(beta.length).keys()];
  } else {
    beta = subset(beta, index(tSubset));
  }

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
    // reshape to match prob_hosp shape
    [size(tSubset)[0], N_VACCINE_STATES, population.length]
  )

  // exclude vaccinated compartments
  propSusc = subset(
    propSusc,
    index(range(0, propSusc.length), [2, 3], range(0, population.length)),
    zeros([propSusc.length, 2, population.length])
  );

  const relativeR0 = add(
    dotMultiply(pars.prob_hosp, pars.dur_ICase),
    dotMultiply(subtract(1, pars.prob_hosp), pars.dur_IMild)
  );

  const adjustedEigens = propSusc.map((_, i) => {
    return leadingEigenvalue(
      rowMultiply(
        mixingMatrix,
        apply(dotMultiply(propSusc[i], relativeR0), 0, sum)
      )
    );
  });

  return dotMultiply(beta, adjustedEigens);
}
