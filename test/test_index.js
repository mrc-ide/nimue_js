import { runModel, createParameters } from "../src/index.js"
import { expect } from 'chai'

import sinon from 'sinon'

import stlucia from '../data/LCA.json'

describe('runModel', function() {

  it('can create a basic timeline', function() {
    // create mocks
    const run = sinon.spy();

    class model {
      constructor() {
        return { run }
      }
    }

    global.odin = [ model ];

    // parameterise model for t between 0 and 1
    runModel(
      createParameters(
        stlucia.S_0,
        stlucia.E1_0,
        stlucia.contactMatrix,
        [0],
        [3],
        1000,
        1000
      ).withHorizon(0, 1)
    );

    // expect a timeline between 0 and 1
    expect(run.withArgs(
      [0, .1, .2, .3, .4, .5, .6, .7, .8, .9]
    ).calledOnce);
  });
});
