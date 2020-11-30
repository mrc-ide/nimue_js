import { getModel } from '../build/nimue_odin.js';

export const runModel = function(parameters) {

  const model = getModel();
  const mod = new model(parameters._toOdin(), 'ignore');
  const { timeStart, timeEnd, dt } = parameters;
  let t = [];
  for (let i = 0; i < (timeEnd - timeStart) / dt; ++i) {
    t.push(timeStart + i * dt);
  }

  return mod.run(t);
};

export { createParameters } from './parameters.js';
export { reff } from './reff.js';
