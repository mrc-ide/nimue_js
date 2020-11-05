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
  nimue_parameters <- nimue::get_nimue_parameters(
    population = squire::get_population(country)$n,
    contact_matrix_set = squire::get_mixing_matrix(country)
  )
  odin_parameters <- do.call(parameters, nimue_parameters)
  eigenvalue <- nimue_parameters$R0 / odin_parameters$beta_set

  write_json(
    list(
      population = odin_parameters$population,
      contactMatrix = odin_parameters$contact_matrix_set,
      eigenvalue = eigenvalue
    ),
    file.path(out_dir, paste0(iso3c, '.json')),
    matrix='columnmajor',
    auto_unbox=TRUE,
    digits=NA
  )

  if (!saved_default_parameters) {
    default_parameters <- nimue_parameters
    default_parameters[c(
      'population',
      'contact_matrix_set',
      'beta_set',
      'hosp_bed_capacity',
      'ICU_bed_capacity'
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
