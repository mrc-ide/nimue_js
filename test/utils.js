import { expect } from 'chai'
import { matrix, size, subset, index } from '../src/math_bundle.js'

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

export function expectMultiArrayEqual(x_raw, y_raw, tolerance=1e-4) {
  const x = matrix(x_raw);
  const y = matrix(y_raw);
  expect(size(x)).to.deep.equal(size(y));
  x.forEach((u, i) => {
    let v = subset(y, index(...i));
    expect(u).to.be.closeTo(
      v,
      tolerance,
      `matrix index ${i} is off by ${u - v}`
    )
  })
}
