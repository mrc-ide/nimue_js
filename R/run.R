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
    population <- squire::get_population(country)$n
    m <- squire::get_mixing_matrix(country)
    output <- nimue::run(
      population = population,
      contact_matrix_set = m,
      beta_set = beta
    )

    write_json(
      output$output,
      file.path(out_dir, paste0('output_', scenario, '.json')),
      pretty = TRUE,
      digits=NA
    )

    scenario <- scenario + 1
  }
  
}

