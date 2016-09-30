//# sourceURL=d3Boxplot.js

'use strict';

window.smartRApp.directive('ICU-timeseries', [
    'smartRUtils',
    'rServeService',
    '$rootScope',
    function(smartRUtils, rServeService, $rootScope) {

    return {
        restrict: 'E',
        scope: {
            data: '=',
            width: '@',
            height: '@'
        },
        templateUrl: $rootScope.smartRPath +  '/js/smartR/_angular/templates/icu-timeseries.html',
        link: function (scope, element) {
            var template_ctrl = element.children()[0],
                template_viz = element.children()[1];
            /**
             * Watch data model (which is only changed by ajax calls when we want to (re)draw everything)
             */
            scope.$watch('data', function () {
                $(template_viz).empty();
                if (! $.isEmptyObject(scope.data)) {
                    smartRUtils.prepareWindowSize(scope.width, scope.height);
                    scope.showControls = true;
                    createBoxplot2(scope, template_viz, template_ctrl);
                }
            });
        }
    };

    function createBoxplot2(scope, root) {
    	
        var concept = '',
            globalMin = Number.MIN_VALUE,
            globalMax = Number.MAX_VALUE,
            categories = [],
            excludedPatientIDs = [],
            useLog = false;
        function setData(data) {
//            concept = data.concept[0];
//            globalMin = data.globalMin[0];
//            globalMax = data.globalMax[0];
//            categories = data['Subset 2'] ? ['Subset 1', 'Subset 2'] : ['Subset 1'];
//            excludedPatientIDs = data.excludedPatientIDs;
//            useLog = data.useLog[0];
        }
        setData(scope.data);
        console.debug(scope.data);
        var animationDuration = 1000;

        var width = parseInt(scope.width);
        var w = width;
        var height = parseInt(scope.height);
        var h = height;
        var margin = [20, 60,200, 280];
        var m = margin;
  
     var parseDate = d3.time.format("%Y-%m-%d %X").parse;

     var x = d3.time.scale()
         .range([0, width]);

     var y = d3.scale.linear()
         .range([height, 0]);

     var xAxis = d3.svg.axis()
         .scale(x)
         .orient("bottom").ticks(5);

     var yAxis = d3.svg.axis()
         .scale(y)
         .orient("left").ticks(5);

     
     
    var svg = d3.select(root).append('svg')
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");


    var values = [];
    var dates = [];
   for (var patients in scope.data){
     var attr = scope.data[patients];
      for (var k in attr){
         if (k.endsWith("StartDate")){
           dates.push(parseDate(attr[k].substring(0,attr[k].lastIndexOf("."))));
           }
           else if (!k.endsWith("StartDate") && k != "Row.Label"){
           values.push(+attr[k]);
           }
        }
     
   }


   console.debug("DATES");
   console.debug(dates);
   console.debug(values);
   x.domain(d3.extent(dates, function(d) { return d; }));
   y.domain(d3.extent(values, function(d) { return d; }));
   //y.domain([d3.min(values, function(d) { return d; }), d3.max(values, function(d) { return d; })]);

   //ganzes Array mit Patienten durchgehen
   for(var index in scope.data) { 
     var patientID="";
     
     //Neues Array zum Speichern der Values und StartDates
     var output = [];
     
       var attr = scope.data[index]; 
       console.debug(attr);
       
       
       //Alle Messwerte eines einzelnen Patienten durchgehen
       for (var i in attr){
        
         if (i == "Row.Label"){
           // PatientenID
        	 patientID=attr[i];
           console.debug("ROWLABEL");
         }
         else {
           
           // Wenn der Wert nicht mit StartDate endet, ist es ein Messwert.
           if (!i.endsWith("StartDate")){
           //  console.debug(i);
          
          //ganzes Array nochmal durchgehen und nach dem StartDate suchen.
          for (var k in attr){
           
           if (k.startsWith(i) && k.endsWith("StartDate")){
             console.debug(attr[i] +"=="+attr[k]);
             var tmp = []
             tmp.value = attr[i];
             if (attr[k]!="")
            	 tmp.date = attr[k];
             else
            	 tmp.date="";
             output.push(tmp);
             break;
           } 
            
          }
             
           }
     
          
         }
         
       }
       
       output.forEach(function(d) {
   d.date = parseDate(d.date.substring(0,d.date.lastIndexOf("."))); // attr[k].substring(0,attr[k].lastIndexOf(".")))
   d.value = +d.value;
   });
       
console.debug("OUTPUT:");
console.debug(output);
       
        var line = d3.svg.line()
       .x(function(d) { return x(d.date); })
       .y(function(d) { return y(d.value); });
     

     
     svg.append("path")
         .datum(output)
         .attr("class", "line")
         .attr("d", line).text(patientID);

//     svg.append("text")
//     .attr("transform", "translate("+(0)+","+y(output[0].value)+")")
//     .attr("dy", ".35em")
//     .attr("text-anchor", "start")
//     .style("fill", "red")
//     .text(patientID);
       
   }

     svg.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(xAxis);

     svg.append("g")
         .attr("class", "y axis")
         .call(yAxis)
       .append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 6)
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .text("Data");



    }

}]);

