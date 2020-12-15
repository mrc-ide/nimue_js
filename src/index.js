import { getModel } from '../build/nimue_odin.js';
import { reffRaw } from './reff.js';

export const runModel = function(parameters, atol=1e-3, rtol=1e-3) {

  const model = getModel();
  const mod = new model(parameters._toOdin(), 'ignore');
  const { timeStart, timeEnd, dt } = parameters;
  let t = [];
  for (let i = 0; i < (timeEnd - timeStart) / dt; ++i) {
    t.push(timeStart + i * dt);
  }

  return mod.run(t, null, null, atol, rtol);
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
