library(nimue)
library(jsonlite)

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

  cpm <- squire:::parse_country_population_mixing_matrix(country = country)
  nimue_parameters <- nimue::get_nimue_parameters(
    population = cpm$population,
    contact_matrix_set = cpm$contact_matrix_set
  )
  odin_parameters <- do.call(parameters, nimue_parameters)
  eigenvalue <- nimue_parameters$R0 / odin_parameters$beta_set

  write_json(
    list(
      population = odin_parameters$population,
      contactMatrix = odin_parameters$mix_mat_set,
      S_0 = odin_parameters$S_0,
      E1_0 = odin_parameters$E1_0,
      eigenvalue = eigenvalue
    ),
    file.path(out_dir, paste0(iso3c, '.json')),
    matrix='columnmajor',
    auto_unbox=TRUE,
    digits=NA
  )

  if (!saved_default_parameters) {
    class(odin_parameters) <- NULL #remove class for serialisation
    default_parameters <- odin_parameters
    default_parameters[c(
      'population',
      'mix_mat_set',
      'beta_set',
      'hosp_beds',
      'ICU_beds',
      'tt_hosp_beds',
      'tt_ICU_beds',
      'S_0',
      'E1_0'
    )] <- NULL
    write_json(
      default_parameters,
      file.path(out_dir, 'default_parameters.json'),
      matrix='columnmajor',
      auto_unbox=TRUE,
      digits=NA
    )
    saved_default_parameters <- TRUE
  }
}
