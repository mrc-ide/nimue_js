import { expect } from 'chai';
import sinon from 'sinon';

import { scalePrioritisation } from '../src/strategy.js';

import stlucia from '../data/LCA.json';
import strategies from '../data/strategies.json';

const sum = (a, b) => a + b;

describe('scaleToAvailable', function() {

  it('gives consistent final coverages', function() {
    const wholePopulation = stlucia.population.reduce(sum, 0);

    for (let strategy of [strategies.all, stlucia.whoPriority]) {
      for (let vaccineAvailable of [1e2, 1e3, 1e4, wholePopulation]) {

        let originalCoverage = strategy.map((ageGroup, i) => {
          return ageGroup[ageGroup.length - 1] * stlucia.population[i];
        }).reduce(sum, 0) / wholePopulation;

        const matrix = scalePrioritisation(
          strategy,
          stlucia.population,
          vaccineAvailable
        );

        const finalCoverage = matrix.map((ageGroup, i) => {
          return ageGroup[ageGroup.length - 1] * stlucia.population[i];
        }).reduce(sum, 0) / wholePopulation;

        expect(finalCoverage).to.be.closeTo(
          Math.min(vaccineAvailable / wholePopulation, originalCoverage),
          1e-9
        );
      }
    }
  });

  it('produces steps with increasing coverage', function() {
    const wholePopulation = stlucia.population.reduce(sum, 0);
    for (const vaccineAvailable of [1e2, 1e3, 1e4, wholePopulation]) {
      const matrix = scalePrioritisation(
        stlucia.whoPriority,
        stlucia.population,
        vaccineAvailable
      );
      for (let ageGroup = 0; ageGroup < matrix.length; ageGroup++) {
        for (let step = 1; step < matrix[0].length; step++) {
          expect(matrix[ageGroup][step]).to.be.at.least(matrix[ageGroup][step - 1]);
        }
      }
    }
  });
});
