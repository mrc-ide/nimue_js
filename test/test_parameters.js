import { expect } from 'chai'
import sinon from 'sinon'

import default_params from '../data/default_parameters.json'

import { createParameters } from '../src/parameters.js'

import stlucia from '../data/LCA.json'

describe('createParameters', function() {
  it('can create default odin parameters', function() {
    console.log(stlucia.population.length)
    console.log(stlucia.contactMatrix.length)
    console.log(stlucia.contactMatrix[0].length)
    console.log(stlucia.contactMatrix[0][0].length)
    const actual = createParameters(
      stlucia.population,
      stlucia.contactMatrix,
      [0],
      [3],
      1000,
      1000
    );

    const {
      population,
      tt_matrix,
      mix_mat_set,
      tt_beta,
      beta_set,
      hosp_bed_capacity,
      ICU_bed_capacity,
      ...unchanged
    } = actual._toOdin();

    expect(unchanged).to.be.deep.equal(default_params);
  });

  it('parameterises beds correctly', function() {
    const actual = createParameters(
      stlucia.population,
      stlucia.contactMatrix,
      [0],
      [3],
      1000,
      3000
    );

    const {
      hosp_bed_capacity,
      ICU_bed_capacity,
      ...others
    } = actual._toOdin();

    expect(hosp_bed_capacity).to.be.equal(1000);
    expect(ICU_bed_capacity).to.be.equal(3000);
  });

  it('Throws error on late start time', function() {
    let params = createParameters(
      stlucia.population,
      stlucia.contactMatrix,
      [0],
      [3],
      1000,
      3000
    );

    expect(() => {params.withHorizon(50, 10)}).to.throw(Error);
  });

  it('Throws error on mismatched beta arrays', function() {
    expect(() => {
      createParameters(
        stlucia.population,
        stlucia.contactMatrix,
        [0, 50, 200],
        [3, 3/2],
        1000,
        3000
      )
    }).to.throw(Error);
  });

  it('Throws error on mismatched population and contact matrices', function() {
    expect(() => {
      createParameters(
        stlucia.population.slice(2),
        stlucia.contactMatrix,
        [0, 50, 200],
        [3, 3/2, 3],
        1000,
        3000
      )
    }).to.throw(Error);
  });

  it('Throws error on negative beds', function() {
    expect(() => {
      createParameters(
        stlucia.population,
        stlucia.contactMatrix,
        [0, 50, 200],
        [3, 3/2, 3],
        -3,
        3000
      )
    }).to.throw(Error);
  });

  it('Throws error on mismatched contact matrix dimension', function() {
    expect(() => {
      createParameters(
        [1, 2],
        [[1, 2], [1, 2], [1, 2]],
        [0, 50, 200],
        [3, 3/2, 3],
        1000,
        3000
      )
    }).to.throw(Error);
  });
});
