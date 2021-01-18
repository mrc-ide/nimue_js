import { round, sum, multiply, subtract, add, dotDivide } from './math_bundle.js';

const getStep = (matrix, step) => matrix.map(ageGroup => ageGroup[step]);
const setStep = (matrix, step, values) => {
  matrix.forEach((ageGroup, i) => {
    ageGroup[step] = values[i];
  });
}

export function scalePrioritisation(matrix, population, vaccinesAvailable) {
  let step = 0;

  // find the step at which vaccine allocation exceeds vaccinesAvailable
  // returns if we reach the end of the matrix
  while (true) {
    if (step === matrix[0].length) {
      return matrix;
    }

    const nVaccinesInStep = sum(multiply(getStep(matrix, step), population));

    if (nVaccinesInStep > vaccinesAvailable) {
      break;
    }

    step++;
  }

  //create copy of the matrix upto the current step
  let scaled = matrix.map(row => row.slice(0, step + 1));

  //find the last change in allocation
  let previousStep;
  if (step === 0) {
    previousStep = Array(scaled.length).fill(0);
  } else {
    previousStep = getStep(scaled, step - 1)
  }
  const deltaAllocation = subtract(getStep(scaled, step), previousStep);

  //reduce the delta between the last two steps
  const previousAllocation = sum(multiply(previousStep, population));
  const newTotalDelta = vaccinesAvailable - previousAllocation;
  const newDelta = multiply(deltaAllocation, newTotalDelta / sum(deltaAllocation));
  const finalStep = add(previousStep, dotDivide(newDelta, population));
  setStep(scaled, step, finalStep);

  return scaled;
}

