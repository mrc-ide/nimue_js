import { expect } from 'chai'

export function approxEqualArray(x, y, tolerance) {
  if (y.length !== x.length) {
    throw Error("Incompatible arrays");
  }
  let scale = 0;
  let xy = 0;
  let n = 0;
  for (let i = 0; i < x.length; ++i) {
    if (x[i] !== y[i]) {
      scale += Math.abs(x[i]);
      xy += Math.abs(x[i] - y[i]);
      n++;
    }
  }
  if (n === 0) {
    return true;
  }

  scale /= n;
  xy /= n;

  if (scale > tolerance) {
    xy /= scale;
  }
  return xy < tolerance;
}

export function expectMatrixEqual(x, y, tolerance=1e-4) {
  expect(x.length).to.be.equal(y.length);
  expect(x[0].length).to.be.equal(y[0].length);
  for (let i = 0; i < x.length; i++) {
    for (let j = 0; j < x[0].length; j++) {
      expect(x[i][j]).to.be.closeTo(
        y[i][j],
        tolerance,
        `matrix index ${i}, ${j} is off by ${i - j}`
      )
    }
  }
}
