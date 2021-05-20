library(jsonlite)
library(tidyverse)

# function that takes in the vaccine_input from the UI
# and current infection efficacy, disease efficacy, doses given to date,
# and the number of vaccines given per day to work out future model state information related to vaccine
vaccine_input <- jsonlite::read_json("./R/vaccine_example.json")

calculate_vaccine_efficacy <- function(
  current_infection_efficacy, 
  current_disease_efficacy,
  current_doses_given, 
  current_date, 
  current_max_vaccine, 
  vaccine_input) {
  
  # format inputs
  current_date <- as.Date(current_date)
  vacc_dates <- as.Date(vapply(seq_along(vaccine_input), function(x) {
    vaccine_input[[x]]$introductionDate
  }, character(1)))
  vacc_doses <- vapply(seq_along(vaccine_input), function(x) {
    vaccine_input[[x]]$quantity
  }, numeric(1))
  vacc_inf_effs <- vapply(seq_along(vaccine_input), function(x) {
    vaccine_input[[x]]$vaccine$efficacyInfection
  }, numeric(1))
  vacc_dis_effs <- vapply(seq_along(vaccine_input), function(x) {
    vaccine_input[[x]]$vaccine$efficacyHosp
  }, numeric(1))
  
  # start by creating data frame of vaccs to date
  df <- data.frame("date" = current_date, 
                   "total_vaccs" = current_doses_given, 
                   "infection_efficacy" = current_infection_efficacy,
                   "disease_efficacy" = current_disease_efficacy,
                   "vaccine" = "fitting")
  
  # first countinue current roll out until first date in vaccine_input
  df <- rbind(df, 
              data.frame(
                "date" = seq.Date(current_date+1, min(vacc_dates)-1, 1), 
                "total_vaccs" = cumsum(rep(current_max_vaccine, vacc_dates[1] - current_date - 1)) + current_doses_given, 
                "infection_efficacy" = current_infection_efficacy,
                "disease_efficacy" = current_disease_efficacy,
                "vaccine" = "fitting")
  )
  
  # then distribute new supplies until it runs out
  full_vac_days <- floor(sum(vacc_doses)/current_max_vaccine)
  future_vaccs <- rep(current_max_vaccine, full_vac_days) 	
  future_vaccs <- c(future_vaccs, sum(vacc_doses) - full_vac_days*current_max_vaccine)
  
  # populate with new vaccines being used
  new_df <- data.frame(
    "date" = seq.Date(min(vacc_dates), min(vacc_dates)+length(future_vaccs)-1, 1),
    "total_vaccs" = cumsum(future_vaccs),
    "infection_efficacy" = vacc_inf_effs[1],
    "disease_efficacy" = vacc_dis_effs[1], 
    "vaccine" = "new"
  )
  
  # loop through the vaccines and work out at which point we switch to next vaccine type 
  if(length(vaccine_input) > 1) {
    
    total_out <- 0
    
    for(i in seq_along(vaccine_input)) {
      
      pos_i <- which(new_df$total_vaccs > total_out & new_df$total_vaccs <= vacc_doses[i]+total_out)
      new_df$infection_efficacy[pos_i] <- vacc_inf_effs[i]
      new_df$disease_efficacy[pos_i] <- vacc_dis_effs[i]
      new_df$vaccine[pos_i] <- paste0("new_", i)
      new_df$total_vaccs[pos_i] <- cumsum(future_vaccs[pos_i])
      total_out <- total_out + vacc_doses[i]
      
    }
    
  }
  
  # now add on day 0 (current date)
  for(i in seq_along(vaccine_input)) {
    new_df <- rbind(data.frame(
      "date" = current_date, 
      "total_vaccs" = 0, 
      "infection_efficacy" = vacc_inf_effs[i],
      "disease_efficacy" = vacc_dis_effs[i],
      "vaccine" = paste0("new_", i)),
      new_df
    )
  }
  
  # group all together and fill out how many of each vaccine type has been given total 
  # on each date
  all_df <- rbind(df, new_df)
  all_df <- group_by(all_df, vaccine) %>% 
    complete(date = seq.Date(min(current_date), max(new_df$date), by = "days")) %>% 
    fill(3:5, .direction = "downup")
  
  
  # now work out per date the weighted mean efficacies and max_vaccines to be given out
  vacc_efficacies <- group_by(all_df, date) %>% 
    summarise(infection_efficacy = weighted.mean(infection_efficacy, total_vaccs),
              disease_efficacy = weighted.mean(disease_efficacy, total_vaccs),
              max_vaccine = sum(total_vaccs))
  vacc_efficacies$max_vaccine <- c(current_max_vaccine, diff(vacc_efficacies$max_vaccine))
  
  # and add on 0 to make sure the input knows that there are no more vaccines
  vacc_efficacies <- rbind(vacc_efficacies, 
                           data.frame(
                             "date" = max(vacc_efficacies$date) + 1, 
                             "infection_efficacy" = tail(vacc_efficacies$infection_efficacy, 1),
                             "disease_efficacy" = tail(vacc_efficacies$disease_efficacy, 1),
                             "max_vaccine" = 0
                           ))
  return(vacc_efficacies)
}