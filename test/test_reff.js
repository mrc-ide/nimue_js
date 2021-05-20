import { reffRaw } from '../src/reff.js';
import { approxEqualArray } from './utils.js';
import { strict as assert } from 'assert';

import reffModelOutput from '../data/output_reff_nimue.json';
import reffOutput from '../data/output_reff.json';
import reffPars from '../data/pars_reff.json';
import brazil from '../data/BRA.json';
import inputs from './assets/BRA_inputs.json';

describe('reff', function() {
  it('compares well with R runs for Brazil', function() {
    const beta = inputs.input_params.map(d => d.beta_set);
    const actual = reffRaw(
      reffModelOutput,
      beta,
      brazil.population,
      brazil.contactMatrixScaledAge,
      reffPars.prob_hosp,
      reffPars.tt_vaccine_efficacy_disease,
      reffPars.vaccine_efficacy_infection,
      reffPars.tt_vaccine_efficacy_infection
    );
    assert(approxEqualArray(actual, reffOutput, 1e-4));
  });

  it('can compute reff for every 10 values of t', function() {
    const beta = inputs.input_params.map(d => d.beta_set);
    const t = [...Array(beta.length).keys()].filter(i => i % 10 === 0);
    const expected = reffOutput.filter((_, i) => i % 10 === 0);
    const actual = reffRaw(
      reffModelOutput,
      beta,
      brazil.population,
      brazil.contactMatrixScaledAge,
      reffPars.prob_hosp,
      reffPars.tt_vaccine_efficacy_disease,
      reffPars.vaccine_efficacy_infection,
      reffPars.tt_vaccine_efficacy_infection,
      t
    );
    assert(approxEqualArray(actual, expected, 1e-4));
  });
});
