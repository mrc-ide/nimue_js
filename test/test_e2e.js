const fs = require('fs')
import { runModel, createParameters } from "../src/index.js"
import { expect } from 'chai'

import LCA from '../data/LCA.json'
import NGA from '../data/NGA.json'
import IND from '../data/IND.json'

describe('model comparison', function() {

  it('can match model runs without vaccination', function() {
    let scenario = 0;
    const beta = 3;
    const tolerance = 1e-4;
    for (const country of [ LCA, NGA, IND ]) {
      for (const bed of [ 100, 100000, 100000000 ]) {
        const actual = runModel(
          createParameters(
            country.population,
            country.contactMatrix,
            [0],
            [beta],
            bed,
            bed,
          ).withHorizon(0, 365)
        );

        const expected = JSON.parse(fs.readFileSync(
          `./data/output_${scenario}.json`,
          'utf8')
        );

        let passed = approxEqualArray(
          flattenNested(actual.y),
          flattenNested(expected),
          tolerance
        );

        if (!passed) {
          console.log(`
          -------failed-------
          scenario: ${scenario}
          country: ${country}
          capacity: ${bed}
          tolerance: ${tolerance}
          `);
        }
        expect(passed).to.be.true;
        scenario++;
      }
    }
  })

})
