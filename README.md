![Unit tests](https://github.com/mrc-ide/nimue_js/workflows/test/badge.svg?branch=master)
![Browser tests](https://github.com/mrc-ide/nimue_js/workflows/e2e/badge.svg?branch=master)

# nimue.js

### Requirements

The required system and R packages are listed in the `Dockerfile`

## Setup

You can build the javascript bundle and data by running:

```sh
npm install
npm run build
# outputs a bundle in build/nimue.js
# outputs model data to the data directory
```

You can run the interface unit tests with:

```sh
npm test
```

You can run the end-to-end test with:

```sh
npm run e2e
```

## Usage

You can access the model using ES6 import syntax:

```js
import { runModel, createParameters } from './nimue.js'
```

### Parameterisation (to be implemented)

createParameters takes the minimum info to create a parameter set for the model.

```js
function createParameters(
  population,
  contactMatrix,
  ttBeta,
  betaSet,
  nBeds,
  nICUBeds
)
```

The arguments are:

  * population - is an array of population sizes for each of the 17 age groups
  * contactMatrix - is the 17 x 17 contact matrix between age groups
  * ttBeta - is an array of timesteps at which the beta value will change
  * betaSet - is an array of beta values that will change in line with `ttBeta`.
  * nBeds - is the country's capacity for hospital beds
  * nICUBeds - is the country's capacity in Intensive Care

The default parameter set models 250 timesteps with no vaccination.

#### Optional parameters (to be implemented)

createParameters returns an object with methods for further parameterisation.

```js
Parameters.withHorizon(start = 0, end = 250);
```

This changes the start and end timestep of the simulation. `end` must be greater
than or equal to `start`.


```js
Parameters.withMaxVaccine(timesteps = [0], maxVaccines = [0]);
```

This models changes in the number of available vaccines over time. At each
timestep in `timesteps` the corresponding number of `maxVaccines` will be made
available. The `timesteps` and `maxVaccines` arrays must be the same size.

```js
Parameters.withVaccineEfficacy(diseaseEfficacy = .95, infectionEfficacy = .95)
```

This models the efficacy of the vaccine in the simulation. `diseaseEfficacy`
is a value between 0 and 1 representing the likelihood of a vaccinated
individual contracting the disease. `infectionEfficacy`
is a value between 0 and 1 representing the likelihood of a vaccinated
individual infecting someone else.


```js
Parameters.withVaccineTarget(vaccineTarget = Array(17).fill(1));
```

This models an age-specific targeting of the vaccine. `vaccineTarget` is an
array representing the proportion of each age group who are eligible for any
available vaccines.

### Running the model (to be implemented)

`runModel` takes parameter sets from the previous section and produces model
outputs.

```js
function runModel(parameters)
```

`runModel` will return object with the following keys:

Names: The names of the columns of the table. The names include:

  * t: the time step
  * S: susceptible
  * E (E1 & E2): Latent infections
  * IMild: Unhospitalised infection
  * R: (R1 & R2): Recovered
  * ICase (ICase1 & ICase2): To-be hospitalised infection
  * IOxGetLive (IOxGetLive1 & IOxGetLive2): Get oxygen, go on to survive
  * IOxGetDie (IOxGetDie1 & IOxGetDie2): Get oxygen go on to die
  * IOxNotGetLive (IOxNotGetLive1 & IOxNotGetLive2): Do not get oxygen, go on to
survive
  * IOxNotGetDie (IOxNotGetDie1 & IOxNotGetDie2): Do not get oxygen, go on to die 
  * IMVGetLive (IMVGetLive1 & IMVGetLive2): Get mechanical ventilation, go on to
    live
  * IMVGetDie (IMVGetDie1 & IMVGetDie2): Get mechanical ventilation, go on to
    die
  * IMVNotGetLive (IMVNotGetLive1 & IMVNotGetLive2): Do no get mechanical
    ventilation, go on to live
  * IMVNotGetDie (IMVNotGetDie1 & IMVNotGetDie2): Do no get mechanical
    ventilation, go on to die
  * IRec (IRec1 & IRec2): Recovering from ICU
  * D: Dead

All columns except the first represent the size of the population in that state
at each timestep. These columns are further broken down into 17 age groups
and 6 vaccination states. The age groups represent 5 year age bands from 0 to
80+. The first vaccination state is unvaccinated, the second state is recently
vaccinated, and the remaining states represent subpopulations who have been
vaccinated further in the past.

E.g. the "S[1, 1]" column represents the count for the unvaccinated, susceptible
population in the first age group.

Y is a 2D array representing the rows of the table.

## Examples

Here we show how some example scenarios can be coded up:

### No vaccination (to be implemented)

The default parameters will model 250 timesteps of the simulation, with no
vaccination.

Here is an example default run for Nigeria:

```js
import nigeriaData from './data/NGA.json';
const ttBeta  = [0, 10,  20,  30,  40 ];
const betaSet = [3, 3.2, 2.5, 1.9, 5.2];
const results = runModel(
  createParameters(
    nigeriaData.population,
    nigeriaData.contactMatrix,
    ttBeta,
    beta,
    10000000000,
    10000000000
  )
);
```

Note: this package does not provide estimations of beta

### Vaccines becoming available (to be implemented)

We can simulate 100,000 vaccines becoming available at timestep 20.

```js
import nigeriaData from './data/NGA.json';
const ttBeta  = [0, 10,  20,  30,  40 ];
const betaSet = [3, 3.2, 2.5, 1.9, 5.2];
const results = runModel(
  createParameters(
    nigeriaData.population,
    nigeriaData.contactMatrix,
    ttBeta,
    beta,
    10000000000,
    10000000000
  ).withMaxVaccine([0, 20], [0, 100000])
);
```

### Vaccine profile (to be implemented)

We can simulate a vaccine which only mitigates onward infection.

```js
import nigeriaData from './data/NGA.json';
const ttBeta  = [0, 10,  20,  30,  40 ];
const betaSet = [3, 3.2, 2.5, 1.9, 5.2];
const results = runModel(
  createParameters(
    nigeriaData.population,
    nigeriaData.contactMatrix,
    ttBeta,
    beta,
    10000000000,
    10000000000
  ).withVaccineEfficacy(0, .7)
);
```

### Targeting an age group (to be implemented)

We can simulate a strategy which targets only the elderly.

```js
import nigeriaData from './data/NGA.json';
const ttBeta  = [0, 10,  20,  30,  40 ];
const betaSet = [3, 3.2, 2.5, 1.9, 5.2];
const target = [
  ...Array(12).fill(0), //filter out the young
  ...Array(5).fill(1)   //include the 5 oldest age groups
];
const results = runModel(
  createParameters(
    nigeriaData.population,
    nigeriaData.contactMatrix,
    ttBeta,
    beta,
    10000000000,
    10000000000
  ).withVaccineTarget(target)
);
```

### Estimating Rt and Reff (to be implemented)

You can estimate Rt by multiplying your beta values by the country's eigenvalue:

```js
import nigeriaData from './data/NGA.json';
const beta = [3, 2.8];
const rt = beta.map(r => { return r * nigeriaData.eigenvalue });
```

Reff is the Rt after having accounted for decreased transmission due to
immunity:

```js
// run the model with a simple vaccine strategy

import nigeriaData from './data/NGA.json';
const ttBeta  = [0, 10,  20,  30,  40 ];
const betaSet = [3, 3.2, 2.5, 1.9, 5.2];
const parameters = createParameters(
  nigeriaData.population,
  nigeriaData.contactMatrix,
  ttBeta,
  beta,
  10000000000,
  10000000000
).withMaxVaccine([0, 20], [0, 100000]);

const results = runModel(parameters);

// pass the model output, parameters and eigenvalue to our utility function
const reff = estimate_reff(results, parameters, nigeriaData.eigenvalue);
```

`estimate_reff` will return an object containing a timeseries of Reff. The
`timestep` key will contain the timestep for every change in reff. The `value`
key will contain the new value of `reff`.
