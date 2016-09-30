library(jsonlite)
library(plyr)


main <- function(excludedPatientIDs = integer(), useLog=FALSE) {


output <- list()

loaded_variables <- join_all(loaded_variables, by = "Row.Label")

output <- loaded_variables


toJSON(output)
}



