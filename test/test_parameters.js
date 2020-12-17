import { expect } from 'chai'
import sinon from 'sinon'

import default_params from '../data/default_parameters.json'

import { createParameters } from '../src/parameters.js'
import { expectMatrixEqual } from './utils.js'

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

  it('parameterises strategies correctly', function() {
    const actual = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      3000
    ).withStrategy('all');

    const {
      vaccine_coverage_mat,
      N_prioritisation_steps,
      ...others
    } = actual._toOdin();

    expect(vaccine_coverage_mat).to.be.deep.equal(Array(17).fill([.8]));
    expect(N_prioritisation_steps).to.be.equal(1);
  });

  it('accepts prioritisation matrices', function() {
    const actual = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      3000
    ).withPrioritisationMatrix(stlucia.etagePriority);

    const {
      vaccine_coverage_mat,
      N_prioritisation_steps,
      ...others
    } = actual._toOdin();

    expect(vaccine_coverage_mat).to.be.deep.equal(stlucia.etagePriority);
    expect(N_prioritisation_steps).to.be.equal(16);
  });

  it('parameterises efficacy correctly', function() {
    const actual = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      3000
    ).withVaccineEfficacy(.7, .99);

    const {
      vaccine_efficacy_infection,
      prob_hosp,
      ...others
    } = actual._toOdin();

    const defaultProbHosp = [0.000840764,0.001182411,0.001662887,0.002338607,
      0.003288907,0.004625365,0.006504897,0.009148183,0.012865577,0.018093546,
      0.025445917,0.035785947,0.050327683,0.0707785,0.099539573,0.1399878,
      0.233470395];

    const vaccinatedProbHosp = [0.0002522292,0.0003547233,0.0004988661,
      0.0007015821,0.0009866721,0.0013876095,0.0019514691,0.0027444549,
      0.0038596731,0.0054280638,0.0076337751,0.0107357841,0.0150983049,
      0.0212335500,0.0298618719,0.0419963400,0.0700411185];

    expectMatrixEqual(
      vaccine_efficacy_infection,
      [
        Array(17).fill(1),
        Array(17).fill(1),
        Array(17).fill(1),
        Array(17).fill(.01),
        Array(17).fill(.01),
        Array(17).fill(1),
      ]
    )

    expectMatrixEqual(
      prob_hosp,
      [
        defaultProbHosp,
        defaultProbHosp,
        defaultProbHosp,
        vaccinatedProbHosp,
        vaccinatedProbHosp,
        defaultProbHosp
      ]
    )

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

  it('Throws error on mismatched max_vaccine', function() {
    const params = createParameters(
      stlucia.S_0,
      stlucia.E1_0,
      stlucia.contactMatrix,
      0,
      3,
      1000,
      3000
    );

    expect(() => {
      params.withMaxVaccine([0, 30], [0])
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
