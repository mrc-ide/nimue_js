library(jsonlite)
source('./R/reff.R')

args = commandArgs(trailingOnly=TRUE)
if (length(args) != 1) {
  stop("The output directory is required as an argument")
}

out_dir <- args[1]

country <- 'Brazil'
input_data <- './test/assets/BRA_inputs.json'

inputs <- read_json(input_data)
Rt <- vapply(inputs$input_params, function(i) i$Rt, numeric(1))
beta <- vapply(inputs$input_params, function(i) i$beta_set, numeric(1))
tt_beta  <- vapply(inputs$input_params, function(i) i$tt_beta, numeric(1))

# get the model run
output <- nimue::run(
  country = country,
  tt_R0 = tt_beta,
  R0 = Rt,
  hosp_bed_capacity = 100000,
  tt_hosp_beds = 0,
  ICU_bed_capacity = 100000,
  tt_ICU_beds = 0,
  time_period = 365,
  max_vaccine = 1000000,
  tt_vaccine = 0,
  seed = 42
)

write_json(
  output$output,
  file.path(out_dir, paste0('output_reff_nimue.json')),
  pretty = TRUE,
  digits=NA
)

write_json(
  output$odin_parameters[c(
    'prob_hosp',
    'vaccine_efficacy_infection',
    'tt_vaccine_efficacy_disease',
    'tt_vaccine_efficacy_infection'
  )],
  file.path(out_dir, paste0('pars_reff.json')),
  pretty = TRUE,
  matrix = 'columnmajor',
  digits=NA
)

write_json(
  get_immunity_ratios(output, beta, length(beta)),
  file.path(out_dir, paste0('output_reff.json')),
  pretty = TRUE,
  digits=NA
)
