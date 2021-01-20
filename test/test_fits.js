import { createParameters, runModel } from '../build/nimue.js';
const bent = require('bent');

import BRB from '../data/BRB.json';
import MUS from '../data/MUS.json';

const countries = [
  ['BRB', BRB, 2038, 67],
  ['MUS', MUS, 6132, 177]
];

const url = 'https://raw.githubusercontent.com/mrc-ide/global-lmic-reports/master/'
const filename = '/input_params.json'

describe('runModel', function() {
  it('does not hit the step size limit', async function() {
    this.timeout(100000);
    for (let i = 0; i < countries.length; i++) {
      let [iso, country, general, icu] = countries[i];
      let data = await bent('json')(url + iso + filename);
      let beta = data.map(i => i.beta_set);
      let out = runModel(createParameters(
        country.population,
        country.contactMatrix,
        [...data.map(i => i.tt_beta), 519, 1047],
        [...beta, 2.4 * country.eigenvalue, beta[beta.length - 1]],
        general,
        icu
      ).withHorizon(0, 1024));
      console.log(out)
    }
  });
});
