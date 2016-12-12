library(outliers)
library(data.table)
library(jsonlite)

library(dplyr)
library(plyr)
require(dplyr)  
strEndsWith <- function(haystack, needle)
{
  hl <- nchar(haystack)
  nl <- nchar(needle)
  if(nl>hl)
  {
    return(F)
  } else
  {
    return(substr(haystack, hl-nl+1, hl) == needle)
  }
}
main <- function(excludedPatientIDs = integer(), useLog=FALSE) {
frame <- data.frame()

items <- c();
items2 <- list()
min_date <- NULL
max_date <- NULL

min_value <- NULL
max_value <- NULL

loaded_variables <- loaded_variables[order(names(loaded_variables))]; # for determinism
# names(loaded_variables)


loaded_variables <- join_all(loaded_variables, by = 'Row Label')
#loaded_variables

# aufteilen nach items, um mehrere items/patient zuzulassen
patients = list()
i <- 1
for (patient in loaded_variables[['Row Label']]){
  patients[[toString(patient)]] <- list()
  
  # print(patient)
  
  
  for (item in names(loaded_variables)){
    # print(item)
    # j <- 0
    if (item == 'Row Label'){
      next
    }
    
    # print(c("item",item))
    if (!strEndsWith(item,'StartDate')){
      splitted <- strsplit(item, "[\\\\]", fixed=FALSE)  
      # print(c("splitted",splitted))
      mp <- splitted[[1]][[length(splitted[[1]])]]
      last <- splitted[[1]][[length(splitted[[1]])-1]]
      last <- last[[1]][[1]]
      
      #print(c("last",last))
      
      if (is.null(patients[[toString(patient)]][[last]])){
        # print("IS NOT NULL")
        patients[[toString(patient)]][[last]] <- data.frame()  
      }
      
      if (is.null(loaded_variables[[item]][[i]]) || is.na(loaded_variables[[item]][[i]])){
        value <- NA
      }
      else {
        value <- loaded_variables[[item]][[i]]  
        
        
        # print(value)
        #date <- format(as.Date(loaded_variables[[paste0(item,"_StartDate")]][[i]]), "%Y-%m-%d %H:%M:%S")
        # if (!is.null(loaded_variables[[paste0(item,"_StartDate")]][[i]])){
        # print("here1")
        # print(loaded_variables[[paste0(item,"_StartDate")]][[i]])
        if (is.null(loaded_variables[[paste0(item,"_StartDate")]][[i]]) ) {
          print("empty")
          loaded_variables[[paste0(item,"_StartDate")]][[i]]  <- ""
          date <- NA
        }
        else {
          # print("else")
          print(loaded_variables[[paste0(item,"_StartDate")]][[i]])
          if (is.na(loaded_variables[[paste0(item,"_StartDate")]][[i]]) || loaded_variables[[paste0(item,"_StartDate")]][[i]] == ""){
            date<-NA
          }
          else{
            date <- strptime(substr(loaded_variables[[paste0(item,"_StartDate")]][[i]],0,nchar(loaded_variables[[paste0(item,"_StartDate")]][[i]])), format = "%Y-%m-%d %H:%M:%S")
          }
        }
        
        # print("here2")
        # print(date)
        
        if (is.null(min_date) && !is.na(date)){
          min_date <- date
        }
        if (is.null(max_date) && !is.na(date)){
          max_date <- date
          #print(C("first max date: " , max_date))
        }
        
        if (is.null(min_value) && !is.na(value)){
          min_value <- value
        }
        if (is.null(max_value) && !is.na(value)){
          max_value <- value
        }
        
        if (!is.na(value) && value > max_value){
          max_value <- value
          # print("NA")
        }
        if (!is.na(value) && value < min_value)
        {
          min_value <- value
        }
        
        if (!is.na(date) && date > max_date){
          max_date <- date
        }
        if (!is.na(date) && date < min_date){
          min_date <- date
        }
        
        result <- data.frame(value,date,last)
        colnames(result) <- c("value","date", "item")
        patients[[toString(patient)]][[last]] <- rbind(patients[[toString(patient)]][[last]],data.frame(result))
        if (!(last %in% items)){
          items <- c(items,last);
        }
        
        if (is.null(items2[[toString(last)]])){
          items2[[toString(last)]] <- list()  
        }
        
        result2 <- data.frame(date,patient,last,value)
        colnames(result2) <- c("date","pid","item","value")
        frame <- rbind(frame,data.frame(result2))
        
        items2[[toString(last)]] <- rbind(items2[[toString(last)]],data.frame(result2))
      }
      
    }
    if (nrow(patients[[toString(patient)]][[last]])>0){
      patients[[toString(patient)]][[last]] <- patients[[toString(patient)]][[last]][order(strptime(patients[[toString(patient)]][[last]]$date, format="%Y-%m-%d %H:%M:%S")),]    
      #order by date?
    }
  }
  
  
  i <- i+1
}

output <- list()
output$patients <- patients

output$meta <- list()
#output$meta$mindate <- as.Date(min_date)-1
#output$meta$maxdate <- as.Date(max_date)+1
output$meta$minvalue <- min_value
output$meta$maxvalue <- max_value
output$meta$dates <- c(as.Date(min_date),as.Date(max_date)+1)
output$meta$items <- (items)




avg <- list()
for (item in names(items2)){
  by_date <- items2[[item]] %>% na.omit() %>% group_by(date=as.Date(date,format ="%Y-%m-%d" ))
  
  # by_date <- arrange(by_date,date);
  
  minMax <- dplyr::summarise(items2[[item]],
                             count = n(),
                             avg = mean(value, na.rm = TRUE),
                             min = min(value, na.rm = TRUE),
                             max = max(value,na.rm = TRUE))
  
  
  quant <- quantile(by_date$value, na.rm = TRUE)
  
  
  # out <- mutate(by_date,outlier=(abs(value - mean(value)) > 2*sd(value)))
  outs <- filter(by_date,(abs(value - mean(value)) > 2*sd(value))) 
  outs <- outs[order(as.Date(outs$date, format="%Y-%m-%d %H:%M:%S")),]
  stats <- dplyr::summarise(by_date,
                            count = n(),
                            `25%`=quantile(value, probs=0.25, na.rm = TRUE),
                            `50%`=quantile(value, probs=0.5, na.rm = TRUE),
                            `75%`=quantile(value, probs=0.75, na.rm = TRUE),
                            avg = mean(value, na.rm = TRUE),
                            sd = sd(value),
                            min = min(value, na.rm = TRUE),
                            max = max(value,na.rm = TRUE),
                            # outlier = (value-avg > 3 *  sds),
                            patients = paste(pid,collapse=","))
  stats <- mutate(stats,currentitem=item)
  stats <- stats[order(stats$date),]
  
  #by_date <- as.data.table(by_date)
  #by_date <- by_date[, outlier := abs(value-mean(value)) > 3 *  sd(value), by = date]
  
  
  # outl <- filter(by_date,!value %in% c(outlier(value))) %>%
  #   summarise(value = mean(value, na.rm = TRUE))
  
  
  avg[[item]]$summary <- stats
  avg[[item]]$minMax <- minMax
  avg[[item]]$quants <- quant
  avg[[item]]$outs <- outs
}

output$meta$avg <- avg

#fileConn<-file("C:/Users/Benjamin/Google Drive/UNI/Masterarbeit/htdocs/data.json")
#write(x = toJSON(output),file=fileConn)
#close(fileConn)

toJSON(output)

}


