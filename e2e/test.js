import { approxEqualArray } from '../test/utils.js';
import { flattenNested } from '../src/utils.js';
import json from '@rollup/plugin-json';

const fs = require('fs');
const Browser = require('zombie');
const browser = new Browser();
const rollup = require('rollup');
const tolerance = 1e-2;

async function load() {
  let bundle = await rollup.rollup({
    input: './e2e/test_script.js',
    plugins: json()
  });
  bundle = await bundle.generate({ format: 'es' });
  bundle = bundle.output[0].code;
  browser.evaluate(
  `var s=window.document.createElement('script');
      s.type = 'module';
      s.textContent = ${bundle};
      window.document.head.appendChild(s);`
  )
}

async function test() {
  let scenario = 0;
  let failed = false;
  const beta = 3;
  browser.evaluate("let p; let r;");
  for (const country of [ 'LCA', 'NGA', 'IND' ]) {
    for (const bed of [ 100, 100000, 100000000 ]) {
      for (const vaccinate of [ false, true ]) {
        browser.evaluate(
          `
          p = createParameters(
            ${country}.population,
            ${country}.contactMatrix,
            [0],
            [${beta}],
            ${bed},
            ${bed}
          ).withHorizon(0, 365);
          `
        )
        if (vaccinate) {
          browser.evaluate(
            `
            p = p
              .withMaxVaccine([0, 100], [0, 10000])
              .withPrioritisationMatrix(${country}.etagePriority, .8, 1e8)
              .withVaccineInfectionEfficacy([0], [.92])
              .withVaccineDiseaseEfficacy([0], [.99])
            `
          )
        }
        let actual = browser.evaluate(
          `r = { parameters: p._toOdin(), output: runModel(p) }; r`
        );

        const expected = JSON.parse(fs.readFileSync(
          `./data/output_${scenario}.json`,
          'utf8')
        );

        let passed = approxEqualArray(
          flattenNested(actual.output.y),
          flattenNested(expected),
          tolerance
        );

        console.log(`
        --------------------
        scenario: ${scenario}
        country: ${country}
        capacity: ${bed}
        tolerance: ${tolerance}
        `);
        if (!passed) {
          failed = true;
          console.log('failed. Writing diagnostics');
          // Write to file for diagnostics
          const outPath = `./data/failure_${scenario}.json`;
          fs.writeFileSync(
            outPath,
            JSON.stringify(actual.output.y, null, 4)
          );
          const outParsPath = `./data/failure_${scenario}_pars.json`;
          fs.writeFileSync(
            outParsPath,
            JSON.stringify(actual.parameters, null, 4)
          );
        } else {
          console.log('passed');
        }
        
        /*
         * Basic test of Reff
        */
        const reff = browser.evaluate(
          `
          reff(
            r.output.y,
            [${beta}],
            ${country}.population,
            p,
            ${country}.contactMatrixScaledAge
          )
          `
        )
        if (!reff[0] == 4) {
          failed = true;
          console.log(`Expected ${reff[0]} == 4 for t = 0`)
        }

        scenario++;
      }
    }
  }
  return failed;
}

async function run() {
  await browser.visit(
    `file://${__dirname}/test_site.html`
  );
  await load();
  const failed = await test();
  process.exit(failed);
}

run()
  .catch(e => {
    console.log(e);
    process.exit(1)
  });
