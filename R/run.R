library(jsonlite)
source('./R/strategies.R')

args = commandArgs(trailingOnly=TRUE)
if (length(args) != 1) {
  stop("The output directory is required as an argument")
}
out_dir <- args[1]

# Set up test cases
isos <- c('LCA', 'NGA', 'IND')
countries <- c('St. Lucia', 'Nigeria', 'India')
beds <- c(100, 100000, 100000000)
beta <- 3
vaccines <- c(FALSE, TRUE)

scenario <- 0

for (i in seq_along(countries)) {
  for (bed in beds) {
    for (vaccinate in vaccines) {
      cpm <- squire:::parse_country_population_mixing_matrix(
        country = countries[[i]]
      )
      if (vaccinate) {
        output <- nimue::run(
          population = cpm$population,
          contact_matrix_set = cpm$contact_matrix_set,
          beta_set = beta,
          max_vaccine = c(0, 10000),
          tt_vaccine = c(0, 100),
          vaccine_coverage_mat = strategy_etage_iso(.8, isos[[i]]),
          vaccine_efficacy_disease = rep(.99, 17),
          vaccine_efficacy_infection = rep(.92, 17),
          dur_vaccine_delay = 7,
          hosp_bed_capacity = bed,
          tt_hosp_beds = 0,
          ICU_bed_capacity = bed,
          tt_ICU_beds = 0,
          dur_V = 5000,
          seeding_cases = 5,
          seeding_age_order = seq(6, 10),
          seed = 42
        )
      } else {
        output <- nimue::run(
          population = cpm$population,
          contact_matrix_set = cpm$contact_matrix_set,
          beta_set = beta,
          max_vaccine = 0,
          tt_vaccine = 0,
          hosp_bed_capacity = bed,
          dur_vaccine_delay = 7,
          tt_hosp_beds = 0,
          ICU_bed_capacity = bed,
          tt_ICU_beds = 0,
          dur_V = 5000,
          seeding_cases = 5,
          seeding_age_order = seq(6, 10),
          seed = 42
        )
      }

      write_json(
        output$output,
        file.path(out_dir, paste0('output_', scenario, '.json')),
        pretty = TRUE,
        digits=NA
      )

      odin_parameters <- output$odin_parameters
      class(odin_parameters) <- NULL #remove class for serialisation
      write_json(
        odin_parameters,
        file.path(out_dir, paste0('pars_', scenario, '.json')),
        pretty = TRUE,
        digits = NA,
        auto_unbox = TRUE,
        matrix = 'columnmajor'
      )

      scenario <- scenario + 1
    }
  }
}
