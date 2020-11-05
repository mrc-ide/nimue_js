
//NOTE: this function expects odin to be loaded into the global scope
export const runModel = function(parameters) {

  const model = Object.values(odin)[0];
  const mod = new model(parameters._toOdin());
  const { timeStart, timeEnd, dt } = parameters;
  let t = [];
  for (let i = 0; i < (timeEnd - timeStart) / dt; ++i) {
    t.push(timeStart + i * dt);
  }

  return mod.run(t);
};

export { createParameters } from './parameters.js';
