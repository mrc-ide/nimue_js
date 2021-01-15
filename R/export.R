library(nimue)
library(jsonlite)
source('./R/strategies.R')

args = commandArgs(trailingOnly=TRUE)
if (length(args) != 1) {
  stop("The only argument is the output directory")
}

countries <- unique(squire::population$country)
names(countries) <- unique(squire::population$iso3c)

out_dir <- args[1]

saved_default_parameters <- FALSE

for (iso3c in names(countries)) {
  country <- countries[[iso3c]]
  set.seed(42)

  vaccine_params <- nimue:::default_vaccine_pars()
  default_durations <- squire:::default_durations()

  parameters <- nimue:::parameters(
    country = country,
    seeding_cases = 5,
    seeding_age_order = seq(6, 10),

    # Durations
    dur_E = default_durations$dur_E,
    dur_IMild = default_durations$dur_IMild,
    dur_ICase = default_durations$dur_ICase,

    dur_get_ox_survive = default_durations$dur_get_ox_survive,
    dur_get_ox_die = default_durations$dur_get_ox_die,
    dur_not_get_ox_survive = default_durations$dur_not_get_ox_survive,
    dur_not_get_ox_die = default_durations$dur_not_get_ox_die,

    dur_get_mv_survive = default_durations$dur_get_mv_survive,
    dur_get_mv_die = default_durations$dur_get_mv_die,
    dur_not_get_mv_survive = default_durations$dur_not_get_mv_survive,
    dur_not_get_mv_die = default_durations$dur_not_get_mv_die,

    dur_rec = default_durations$dur_rec,
    dur_R = 365,

    # Vaccine
    dur_V = 5000,
    vaccine_efficacy_infection = vaccine_params$vaccine_efficacy_infection,
    vaccine_efficacy_disease = vaccine_params$vaccine_efficacy_disease,
    max_vaccine = 0,
    tt_vaccine = 0,
    dur_vaccine_delay = 7,
    vaccine_coverage_mat = vaccine_params$vaccine_coverage_mat,

    # Health system capacity
    hosp_bed_capacity = 0,
    ICU_bed_capacity = 0,
    tt_hosp_beds = 0,
    tt_ICU_beds = 0
  )

  default_r0 <- 3
  eigenvalue <- default_r0 / parameters$beta_set

  write_json(
    list(
      population = parameters$population,
      contactMatrix = parameters$mix_mat_set,
      contactMatrixScaledAge = squire:::process_contact_matrix_scaled_age(
        parameters$contact_matrix_set[[1]],
        parameters$population
      ),
      eigenvalue = eigenvalue,
      whoPriority = strategy_who_iso(1, iso3c),
      etagePriority = strategy_etage_iso(1, iso3c)
    ),
    file.path(out_dir, paste0(iso3c, '.json')),
    matrix='columnmajor',
    auto_unbox=TRUE,
    digits=NA,
    null='null'
  )

  if (!saved_default_parameters) {
    class(parameters) <- NULL #remove class for serialisation
    default_parameters <- parameters
    default_parameters[c(
      'mix_mat_set',
      'contact_matrix_set',
      'population',
      'tt_matrix',
      'max_vaccine',
      'tt_vaccine',
      'beta_set',
      'hosp_beds',
      'ICU_beds',
      'tt_hosp_beds',
      'tt_ICU_beds',
      'S_0'
    )] <- NULL
    default_parameters <- c(
      default_parameters,
      default_durations[c('dur_ICase', 'dur_IMild')]
    )
    write_json(
      default_parameters,
      file.path(out_dir, 'default_parameters.json'),
      matrix='columnmajor',
      auto_unbox=TRUE,
      digits=NA
    )
    write_json(
      list(
        all = exclude_children(nimue::strategy_matrix('All', max_coverage = 1)),
        elderly = exclude_children(nimue::strategy_matrix('Elderly', max_coverage = 1))
      ),
      file.path(out_dir, 'strategies.json'),
      matrix='columnmajor',
      digits=NA
    )
    saved_default_parameters <- TRUE
  }
}
