get_immunity_ratios <- function(out, beta, t_now) {
  
  # mixing_matrix is already the mixing matrix that we pass to you in the country json files
  mixing_matrix <- squire:::process_contact_matrix_scaled_age(
    out$parameters$contact_matrix_set[[1]],
    out$parameters$population
  )
  
  # these parameters are found in pars_0.json that is imported in index.js
  dur_ICase <- out$parameters$dur_ICase
  dur_IMild <- out$parameters$dur_IMild
  rel_infectiousness <- out$odin_parameters$rel_infectiousness_vaccinated
  
  # vaccine efficacy is now time changing 
  # so we make a list of all the arrays at each time point 
  vei_list <- lapply(
    seq_len(nrow(out$odin_parameters$vaccine_efficacy_infection)),
    function(x) {
      out$odin_parameters$vaccine_efficacy_infection[x,,]
    })
  t_vei <- diff(c(out$odin_parameters$tt_vaccine_efficacy_infection, t_now))
  vei_list_long <- purrr::flatten(
    lapply(seq_along(t_vei), function(x) {
    rep(list(vei_list[[x]]), t_vei[x])
  }))
  
  prob_hosp_list <- lapply(
    seq_len(nrow(out$odin_parameters$prob_hosp)),
    function(x) {
      out$odin_parameters$prob_hosp[x,,]
    })
  t_prob_hosp <- diff(c(out$odin_parameters$tt_vaccine_efficacy_disease, t_now))
  prob_hosp_list_long <- purrr::flatten(
    lapply(seq_along(t_prob_hosp), function(x) {
      rep(list(prob_hosp_list[[x]]), t_prob_hosp[x])
    }))

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
  
  # We multiply by the effect of vaccines on onward infectiousness at each time point
  prop_susc <- vapply(
    seq_len(nrow(prop_susc)),
    FUN = function(i){ prop_susc[i,,]*vei_list_long[[i]]},
    FUN.VALUE = prop_susc[1,,]
  )
  
  # back into shape for next step
  prop_susc <- aperm(prop_susc, c(3,1,2))
  
  # Length 17 with relative R0 in each age category
  relative_R0_by_age <- lapply(prob_hosp_list_long, function(x) {
    x*dur_ICase + (1-x)*dur_IMild
  })
  
  # here we are looping over each time point to calculate the adjusted eigen
  # incorporating the proportion of the susceptible population in each age group
  adjusted_eigens <- vapply(
    seq(t_now),
    function(t) {
      Re(eigen(mixing_matrix * rowSums(prop_susc[t,,] * relative_R0_by_age[[t]]))$values[1])
    },
    numeric(1)
  )
  
  # multiply beta by the adjusted eigen at each time point to get Reff
  beta * adjusted_eigens
}

