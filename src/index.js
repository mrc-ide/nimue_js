import { getModel } from '../build/nimue_odin.js';
import { reffRaw } from './reff.js';

export const runModel = function(parameters, control = null) {
  if (control === null) {
    control = {atol: 1e-3, rtol: 1e-3, stepSizeMin: 1e-5, stepSizeMax: 0.5, stepSizeMinAllow: true};
  }

  const model = getModel();
  const mod = new model(parameters._toOdin(), 'ignore');
  const { timeStart, timeEnd, dt } = parameters;
  let t = [];
  for (let i = 0; i < (timeEnd - timeStart) / dt; ++i) {
    t.push(timeStart + i * dt);
  }

  return mod.run(t, null, control);
};

export function reff(output, beta, population, parameters, mixingMatrix, tSubset = null) {
  const odinParameters = parameters._toOdin();
  return reffRaw(
    output,
    beta, 
    population, 
    mixingMatrix,
    odinParameters.prob_hosp, 
    odinParameters.vaccine_efficacy_infection,
    tSubset
  )
};

export { createParameters } from './parameters.js';
