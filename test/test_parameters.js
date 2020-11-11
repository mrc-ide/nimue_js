import { expect } from 'chai'
import sinon from 'sinon'

import default_params from '../data/default_parameters.json'

import { createParameters } from '../src/parameters.js'

import stlucia from '../data/LCA.json'

describe('createParameters', function() {
  it('can create default odin parameters', function() {
    const actual = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      1000
    );

    const {
      population,
      mix_mat_set,
      tt_matrix,
      tt_vaccine,
      max_vaccine,
      beta_set,
      hosp_beds,
      ICU_beds,
      tt_hosp_beds,
      tt_ICU_beds,
      S_0,
      E1_0,
      ...unchanged
    } = actual._toOdin();

    expect(unchanged).to.be.deep.equal(default_params);
  });

  it('parameterises beds correctly', function() {
    const actual = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      3000
    );

    const {
      hosp_beds,
      ICU_beds,
      ...others
    } = actual._toOdin();

    expect(hosp_beds[0]).to.be.equal(1000);
    expect(ICU_beds[0]).to.be.equal(3000);
  });

  it('Throws error on late start time', function() {
    let params = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      3000
    );

    expect(() => {params.withHorizon(50, 10)}).to.throw(Error);
  });

  it('Throws error on mismatched beta arrays', function() {
    expect(() => {
      createParameters(
        stlucia.S_0,
        stlucia.E1_0,
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
        stlucia.S_0.slice(2),
        stlucia.E1_0,
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
        stlucia.S_0,
        stlucia.E1_0,
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
        [[1, 2]],
        [[1, 2]],
        [[1, 2], [1, 2], [1, 2]],
        [0, 50, 200],
        [3, 3/2, 3],
        1000,
        3000
      )
    }).to.throw(Error);
  });
});
