get_immunity_ratios <- function(out, beta, t_now) {

  # mixing_matrix is already the mixing matrix that we pass to you in the country json files
  mixing_matrix <- squire:::process_contact_matrix_scaled_age(
    out$parameters$contact_matrix_set[[1]],
    out$parameters$population
  )

  # these parameters are found in pars_0.json that is imported in index.js
  dur_ICase <- out$parameters$dur_ICase
  dur_IMild <- out$parameters$dur_IMild
  prob_hosp <- out$odin_parameters$prob_hosp

  #
  index <- nimue:::odin_index(out$model)

  # pop is a 17 length with population sizes in each age category
  pop <- out$parameters$population

  # in here we work out each time point the number of individuals in each age category in
  # the S compartment at each time point.
  susceptible <- array(
    out$output[seq(t_now),index$S,],
    dim=c(t_now, dim(index$S))
  )
  # We divide by the total population
  prop_susc <- sweep(susceptible, 2, pop, FUN='/')
  # We multiply by the effect of vaccines on onward infectiousness
  prop_susc <- sweep(
    prop_susc,
    c(2, 3),
    out$odin_parameters$vaccine_efficacy_infection,
    FUN='*'
  )

  # Length 17 with relative R0 in each age category
  relative_R0_by_age <- prob_hosp*dur_ICase + (1-prob_hosp)*dur_IMild

  # here we are looping over each time point to calculate the adjusted eigen
  # incorporating the proportion of the susceptible population in each age group
  adjusted_eigens <- vapply(
    seq(t_now),
    function(t) {
      Re(eigen(mixing_matrix * rowSums(prop_susc[t,,] * relative_R0_by_age))$values[1])
    },
    numeric(1)
  )

  # multiply beta by the adjusted eigen at each time point to get Reff
  beta * adjusted_eigens
}
