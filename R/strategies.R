hcw <- readRDS("./data-raw/prop_working_age_healthcare.rds")

cm <- readRDS("./data-raw/Clark_formatted.RDS")
cm <- subset(cm, (cm$age_low > 10) & (cm$age_low < 65))
cm <- cm[c('iso3c', 'at_least_one_condition')]

strategy_who_iso <- function(max_coverage, iso3c){
  if (iso3c %in% hcw$iso3c) {
    return(strategy_who(
      max_coverage,
      hcw$prop_working_age_hc[hcw$iso3c == iso3c]
    ))
  }
}

strategy_etage_iso <- function(max_coverage, iso3c){
  if (iso3c %in% hcw$iso3c && iso3c %in% cm$iso3c) {
    return(strategy_etage(
      max_coverage,
      hcw$prop_working_age_hc[hcw$iso3c == iso3c],
      cm$at_least_one_condition[cm$iso3c == iso3c]
    ))
  }
}

#' Strategy for WHO Europe work
#'
#' @param max_coverage Maximum coverage achievable for any single age-group
#' @param risk_proportion_hcw Proportion of age groups aged 15-64 who are healthcare workers.
#' This can be input as a vector of length 10, or a single value that will be recycled.
#'
#' @return A prioritisation matrix.
strategy_who <- function(max_coverage, risk_proportion_hcw){
  if(!length(risk_proportion_hcw) %in% c(1, 10)){
    stop("Length of risk_proportion_hcw must = 1 or 10")
  }
  
  # Index for ages 15-64
  hcw_age_index <- 4:13
  
  # Row for healthcare workers
  hcw_age_risk <- matrix(0, ncol = 17, nrow = 1)
  hcw_age_risk[, hcw_age_index] <- max_coverage * risk_proportion_hcw
  
  # Rows for 80+ - 15
  elderly <- nimue::strategy_matrix("Elderly", max_coverage = max_coverage)[1:14,]
  elderly <- pmax(elderly, hcw_age_risk[rep(1, nrow(elderly)),])
  
  who_matrix <- rbind(hcw_age_risk, elderly)
  return(who_matrix)
}

#' Strategy for ETAGE recommendation. We assume random correlation between those who are
#' HCWs and those of the same age-class who have comorbidities
#'
#' @param max_coverage Maximum coverage achievable for any single age-group
#' @param risk_proportion_hcw Proportion of age groups aged 15-64 who are healthcare workers.
#' This can be input as a vector of length 10, or a single value that will be recycled. 
#' @param risk_proportion_cm Proportion of age groups aged 15-60 who have at least 1 comorbidity.
#' This can be input as a vector of length 9, or a single value that will be recycled. 
#'
#' @return A prioritisation matrix.
strategy_etage <- function(max_coverage, risk_proportion_hcw, risk_proportion_cm){
  if(!length(risk_proportion_hcw) %in% c(1, 10)){
    stop("Length of risk_proportion_hcw must = 1 or 10")
  }
  if(is.list(risk_proportion_cm)){
    risk_proportion_cm <- unlist(risk_proportion_cm)
  }

  if(!length(risk_proportion_cm) %in% c(1, 10)){
    stop("Length of risk_proportion_cm must = 1 or 10")
  }
  # Index for ages 15-64
  hcw_age_index <- 4:13
  # Index for ages 15-64
  comorbidity_age_index <- 4:13
  
  # Row for helathcare workers
  hcw_age_risk <- matrix(0, ncol = 17, nrow = 1)
  hcw_age_risk[, hcw_age_index] <- max_coverage * risk_proportion_hcw
  
  # Rows for 80+ - 65
  elderly <- nimue::strategy_matrix("Elderly", max_coverage = max_coverage)[1:4,]
  elderly <- pmax(elderly, hcw_age_risk[rep(1, nrow(elderly)),])
  
  # Rows for comorbidities
  comorbidities_age_risk <- matrix(0, ncol = 17, nrow = 1)
  comorbidities_age_risk[,comorbidity_age_index] <- max_coverage * risk_proportion_cm + (1 - risk_proportion_cm) * hcw_age_risk[, comorbidity_age_index]
  comorbidities_age_risk <- pmax(comorbidities_age_risk, elderly[nrow(elderly), ])
  
  # Everyone else
  remaining_pop <- nimue::strategy_matrix("Elderly", max_coverage = max_coverage)[-c(1:4, 15:17),]
  remaining_pop <- pmax(remaining_pop, comorbidities_age_risk[rep(1, nrow(remaining_pop)), ])
  
  etage_matrix <- rbind(hcw_age_risk, elderly, comorbidities_age_risk, remaining_pop)
  return(etage_matrix)
}
