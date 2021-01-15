import { round, sum, multiply } from './math_bundle.js';

export function scalePrioritisation(matrix, population, vaccinesAvalable) {
  const wholePopulation = sum(population);
  const targetCoverage = vaccinesAvalable / wholePopulation;
  const currentCoverage = sum(
    multiply(
      matrix.map(ageGroup => ageGroup[ageGroup.length - 1]),
      population
    )
  ) / wholePopulation;

  //create copy of the matrix
  let scaled = matrix.map(row => row.slice());

  if (currentCoverage > targetCoverage) {
    const ratio = targetCoverage / currentCoverage;
    for (let i = 0; i < scaled.length; i++) {
      for (let j = 0; j < scaled[i].length; j++) {
        scaled[i][j] *= ratio;
      }
    }
  }

  return scaled;
}
