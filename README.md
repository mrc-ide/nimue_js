![Tests](https://github.com/mrc-ide/nimue_js/workflows/test/badge.svg?branch=master)

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

### Parameterisation

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

#### Optional parameters

createParameters returns an object with methods for further parameterisation.

```js
Parameters.withHorizon(start = 0, end = 250);
```

This changes the start and end timestep of the simulation. `end` must be greater
than or equal to `start`.


```js
Parameters.withMaxVaccine(timesteps = [0], maxVaccines = [0]);
```

This models changes in the number of vaccines available each day. At each
timestep in `timesteps` the corresponding number of `maxVaccines` will be made
available. The `timesteps` and `maxVaccines` arrays must be the same size.

```js
Parameters.withVaccineEfficacy(diseaseEfficacy = .95, infectionEfficacy = .95)
```

This models the efficacy of the vaccine in the simulation. `diseaseEfficacy`
is a value between 0 and 1 that reduces the rate of hospitalisation $\phi(a)$ by a constant factor, influencing the proportion of cases that are severe. `infectionEfficacy`
is a value between 0 and 1 that reduces the transmission parameter ($\beta$) by a constant factor, influencing the probability of infection.


```js
Parameters.withStrategy(strategy, coverage, vaccinesAvailable);
```

This models a predefined prioritisation strategy for vaccine distribution.

`strategy` can be either "elderly" or "all".

`coverage` sets the maximum coverage for the targeted age group.

`vaccinesAvailable` sets the total number of vaccines available.

```js
Parameters.withPrioritisationMatrices(m, coverage, vaccinesAvailable);
```

This models a prioritisation strategy based on a matrix `m`.

`coverage` sets the maximum coverage for the targeted age group.

`vaccinesAvailable` sets the total number of vaccines available.

```js
Parameters.withVaccineDuration(timesteps);
```

Sets the duration of vaccine efficacy in the model

### Running the model

`runModel` takes parameter sets from the previous section and produces model
outputs.

```js
function runModel(parameters, control)
```

The `control` paramer is a dict that may take elements:

* `atol`: absolute tolerance (e.g., 1e-5)
* `rtol`: relative tolerance (e.g., 1e-5; generally set this to the same as `atol`)
* `stepSizeMin`: smallest allowable step size
* `stepSizeMinAllow`: boolean, if `true` then we continue after hitting `stepSizeMin` and do not reduce the step size further
* `stepSizeMax`: maximum allowble step size; if we hit this we take steps of no larger than this size but always continue

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

### No vaccination

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

### Vaccines becoming available

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

### Vaccine profile

We can now simulate changing vaccine efficacy over time in resposne to changing doses/vaccine properties by passing in an array of timesteps and efficacies.

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
  .withVaccineDiseaseEfficacy([0, 1, 2], [.8, .9, .95])
  .withVaccineInfectionEfficacy([0, 1, 2], [.5, .6, .7])
);
```

### Targeting an age group

We can simulate a strategy which targets only the elderly.

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
  .withMaxVaccine([0, 20], [0, 100000])
  .withStrategy('elderly', .8, 1e8) // the two options here are 'elderly' and 'all'
);
```

### Prioritisation Matrices

We can model more complex strategies using prioritisation matrices. We provide 2
in the country JSON files: etagePriority and whoPriority

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
  .withMaxVaccine([0, 20], [0, 100000])
  .withPrioritisationMatrix(nigeriaData.etagePriority, .8, 1e5)
);
```

### Reff

We provide function to estimate Reff from model outputs:

```js
function reff(
  output,
  beta,
  population,
  parameters,
  contactMatrixScaledAge,
  tSubset = null
)
```

Parameters:

 * output - the `y` component of the model output returned from runModel
 * beta - an array with corresponding beta values for the first timesteps of the output
 * population - an array with population counts for each age group (called `population` in the country json files)
 * parameters - the parameters object from `getParameters`
 * mixingMatrix - a 2D array representing an age scaled mixing matrix (called `contactMatrixScaledAge` in the country json files)
 * tSubset - an array of timesteps to calculate Reff for

This returns an array of Reff values for the output at the timesteps in `tSubset`.
If `tSubset` is null, it will return Reff values for all the beta values
given.
