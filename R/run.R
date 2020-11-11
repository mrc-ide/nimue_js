library(jsonlite)

args = commandArgs(trailingOnly=TRUE)
if (length(args) != 1) {
  stop("The output directory is required as an argument")
}
out_dir <- args[1]

# Set up test cases
countries <- c('St. Lucia', 'Nigeria', 'India')
beds <- c(100, 100000, 100000000)
beta <- 3

scenario <- 0

for (country in countries) {
  for (bed in beds) {
    cpm <- squire:::parse_country_population_mixing_matrix(country = country)
    output <- nimue::run(
      population = cpm$population,
      contact_matrix_set = cpm$contact_matrix_set,
      beta_set = beta,
      max_vaccine = 0,
      tt_vaccine = 0,
      hosp_bed_capacity = bed,
      tt_hosp_beds = 0,
      ICU_bed_capacity = bed,
      tt_ICU_beds = 0,
      seed = 42
    )

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

