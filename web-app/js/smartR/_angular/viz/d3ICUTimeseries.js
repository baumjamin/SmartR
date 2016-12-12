//# sourceURL=d3ICUTimeseries.js

'use strict';

window.smartRApp.directive('icutimeseries', [
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
        templateUrl: $rootScope.smartRPath +  '/js/smartR/_angular/templates/icutimeseries.html',
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
    	var _showPatients = false;
    	var _showMinMax = true
    	var _whiskers = true;

    	var color = d3.scaleOrdinal(d3.schemeCategory10);
    	console.log(color)

    	var concept = '',
    	globalMin = Number.MIN_VALUE,
    	globalMax = Number.MAX_VALUE,
    	categories = [],
    	excludedPatientIDs = [],
    	useLog = false;
    	function setData(data) {
    	}
    	setData(scope.data);
    	console.debug(scope.data);
    	console.log(scope.data)
    	var data = scope.data;
    	var _data = data;

    	var whiskerCheck = smartRUtils.getElementWithoutEventListeners('sr-icutimeseries-whiskers-check');
    	whiskerCheck.addEventListener('change', function() { 
    		console.log("whiskers changed"); 
    		showWhiskers(_whiskers);
    		_whiskers = !_whiskers;
    	});

    	var minmaxButton = smartRUtils.getElementWithoutEventListeners('sr-icutimeseries-minmax');
    	minmaxButton.addEventListener('click', function(){ 
    		console.log("showminmax");
    		_showMinMax = !_showMinMax
    		showMinMax(_showMinMax);

    	});
    	var minmaxButton = smartRUtils.getElementWithoutEventListeners('sr-icutimeseries-showPatients');
    	minmaxButton.addEventListener('click', function(){ 
    		console.log("sr-icutimeseries-showPatients");
    		_showPatients = !_showPatients;
    		showPatients(_showPatients);
    	});

    	var width = parseInt(scope.width);
    	var height = parseInt(scope.height);
    	var margin = {top: 20, right: 60, bottom: 200, left: 280};

    	var color = d3.scaleOrdinal(d3.schemeCategory10);

    	var max_value = 10;
    	var min_value = 1;		
    	var high_value = 30;
    	var low_value = 10;
    	var minColor = "grey";
    	var maxColor = "grey";

    	var svg = d3.select(root).append("svg").attr("width",
    			width + margin.left + margin.right).attr("height",
    					height + margin.top + margin.bottom).append("g").attr(
    							"transform",
    							"translate(" + margin.left + "," + margin.top + ")");

    	/**
    	 * Tooltip
    	 */
    	var tip = d3.select(root).append("div")
    	.attr("class", "tooltip")
    	.style("opacity", 0);
   
    	var parseDateSummary = d3.timeParse("%Y-%m-%d");
    	var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    	var formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
    	var formatDate = d3.timeFormat("%d-%b");

    	var x = d3.scaleTime().range([ 0, width ]);

    	var y1 = d3.scaleLinear().range([ height, 0 ]);
    	var y2 = d3.scaleLinear().range([height, 0]);

    	var xAxis = d3.axisBottom(x).ticks(5)
    	.tickFormat(d3.timeFormat("%Y-%m-%d"));
    	var yAxis = d3.axisLeft(y1);
    	var yAxisRight = d3.axisRight(y2);

    	var lines = document.getElementsByClassName('line');

    	/**
    	 * Data Preparation
    	 */
    	for (var avgItem in data.meta.avg){
    		data.meta.avg[avgItem].summary.forEach(function(d) {
    			d.avg = +d.avg;
    			d.min = +d.min;
    			d.max = +d.max;
    			d.count = +d.count;
    			d.date = parseDateSummary(d.date);
    		});

    		if (data.meta.avg[avgItem].outs){
    		data.meta.avg[avgItem].outs.forEach(function(d) {
    			d.date = parseDateSummary(d.date);
    			d.value = +d.value;
    		});
    		}
    	}

    	for (var patient in data.patients){
    		for (var item in data.patients[patient]){
    			data.patients[patient][item].forEach(function(d){
    				d.date = parseDate(d.date)
    				d.value = +d.value
    				d.item = String(d.item)
    			})
    		}
    	}
    	min_value = +data.meta.minvalue;
    	if (min_value > 0)
    		min_value = 0;
    	else if (min_value < 0)
    		min_value = min_value -1;

    	max_value = +data.meta.maxvalue;
    	max_value = +max_value+1;

    	x.domain(d3.extent(data.meta.dates, function(d) {
    		return parseDateSummary(d);
    	}));
    	var itemCount = data.meta.items.length;
    	console.log("AVG")

    	if (itemCount == 2){
    		console.log("We have exactly 2 items")
    		var min1 = data.meta.avg[data.meta.items[0]].minMax[0].min;
    		var max1 = data.meta.avg[data.meta.items[0]].minMax[0].max

    		var min2 = data.meta.avg[data.meta.items[1]].minMax[0].min;
    		var max2 = data.meta.avg[data.meta.items[1]].minMax[0].max
    		var item1,item2;
   			item1 = data.meta.items[0];
    		item2 = data.meta.items[1];
    		y1.domain([ min1, max1 ]);

    		y2.domain([ min2, max2 ]);

    		svg.append("g")
    		.attr("class", "y axis")
    		.call(yAxis)
    		.style("fill", color(item1))
    		.append("text")
    		.attr("class", "text axis")
    		.attr("transform", "rotate(-90)")
    		.attr("y", 6).attr("dy",".71em")
    		.style("text-anchor", "end")
    		.text(item1)
    		.style("fill", color(item1))

    		svg.append("g")
    		.attr("class", "y axis right")
    		.style("fill", color(item2)) 
    		.attr("transform", "translate(" + width + " ,0)")
    		.call(yAxisRight)
    		.append("text")
    		.attr("class", "text axis")
    		.attr("transform", "rotate(-90)").attr("y", -15).attr("dy",
    		".71em")
    		.style("text-anchor", "end")
    		.text(item2)
    		.style("fill", color(item2))
    	}
    	else{
    		y1.domain([ min_value, max_value ]);
    		y2.domain([ min_value, max_value ]);
    		
    		svg.append("g")
    		.attr("class", "y axis")
    		.call(yAxis)
    		.append("text")
    		.attr("class", "text axis")
    		.attr("transform", "rotate(-90)")
    		.attr("y", 6).attr("dy",".71em")
    		.style("text-anchor", "end")
    		.text(data.meta.items)
    		.style("fill", "#000")
    	}

    	svg.append("g")
    	.attr("class", "x axis")
    	.attr("transform","translate(0," + height + ")")
    	.call(xAxis)
    	.selectAll("text")	
    	.style("text-anchor", "end")
    	.attr("dx", "-.8em")
    	.attr("dy", ".15em")
    	.attr("transform", function(d) {return "rotate(-65)"})

    	_data = data;
    	showLegend(_data);
    	showPatients(_showPatients);
    	showMinMax(_showMinMax)

function showPatients(_showPatients) {
	data = _data;
	if (_showPatients) {
		console.log("showing patients")
		console.log(data)
		for (var patient in data.patients){
			var i = 0;
			for (var item in  data.patients[patient]){
				var yy;
				console.log(item + " " + data.meta.items[0])
				var line;
				if (item == data.meta.items[0]){
					yy = y1;
				}
				else {
					yy = y2;
				}
				
				line = d3.line()
				.x(function(d) {
					return x(d.date);
				}).y(function(d) {
					return yy(d.value);
				});
				
				var c = color(item); 
				var output = data.patients[patient][item];
				output.forEach(function(d){
					d.patient = patient
				})
				output.item = item;
				output.patient = patient;

				svg
				.datum(output)
				.append("path")
				.attr("class", "line patients")
				.attr("d", line(output))
				.style("stroke", function() {
					return output.color = c; 
				})
				.on("mouseover", function(d) {
					tip.transition()
					.duration(200)
					.style("opacity", .9);
					tip .html("Patient: " + d.patient + "<br/>"+ "Item: " + d.item)
					.style("left", (d3.event.layerX)+15 + "px")
					.style("top", (d3.event.layerY)+15 + "px");
				})
				.on("mouseout", function(d) {
					tip.transition()
					.duration(500)
					.style("opacity", 0);
				})
				.on("click", function(d){
					console.log("line clicked");
				});

				svg.selectAll("dot")
				.data(output)
				.enter()
				.append("circle")
				.style("fill", function(d) {return c})
				.attr("class","circle patients")
				.attr("r", 2.5)
				.attr("cx", function(d) { return x(d.date); })
				.attr("cy", function(d) { return yy(d.value); })
				.attr("id",output.item)
				.attr("active","true")
				.attr("patient", patient)
				.on("mouseover", function(d) {
					tip.transition()
					.duration(200)
					.style("opacity", .9);
					tip .html("Patient: " + d.patient + "<br/>"+ "Date: " + formatTime(d.date) + "<br/>" + "Item: " + d.item + "<br/>" + "Value: " + d.value)
					.style("left", (d3.event.layerX)+15 + "px")
					.style("top", (d3.event.layerY)+15 + "px");
				})
				.on("mouseout", function(d) {
					tip.transition()
					.duration(500)
					.style("opacity", 0);
				})
				.on("click", function(d){
				});
				i = i+1;
			}
		}
	}
	else {
		svg.selectAll("path.patients").remove()
		svg.selectAll("circle.patients").remove()
		console.log("hiding!")
	}
}

    	/**
    	 * Item Legend
    	 */
    	function showLegend(){
    		data = _data;
    		data.meta.items.forEach(function(d,i){
    			var c = color(d);
    			var legendSpace = width/data.meta.items.length;
    			svg.append("text") 
    			.attr("x", (legendSpace/2)+i*legendSpace) 
    			.attr("y", height + (margin.bottom/2)+ 15)
    			.attr("class", "legend item")
    			.attr("active", "true")
    			.attr("item", d)
    			.style("fill", function() { 
    				return  c; })
    				.text(d)
    		});
    	}

    	function showMinMax(_showMinMax){
    		data = _data;
    		if (_showMinMax){
    			console.log("Showing Min/Max!")
    			console.log(data.meta.items)
    			for (var avgItem in data.meta.avg){
    				var summary = data.meta.avg[avgItem].summary;
    				var outs = data.meta.avg[avgItem].outs;

    				var quants = data.meta.avg[avgItem].quants;
    				var yy;
    				var avgLine, minLine, maxLine;
    				var line;
    				
    				if (avgItem == data.meta.items[0]){
    					yy = y1;
    				}
    				else {
    					yy = y2;
    				}
    				avgLine = d3.line()
    				.x(function(d) {
    					return x(d.date);
    				}).y(function(d) {
    					return yy(d['50%']);
    				}); 

    				var c = color(avgItem);
    				var path = svg.append("path")
    				.attr("class", "line minmax")
    				.attr("stroke", "steelblue")
    				.attr("stroke-width", "2")
    				.attr("fill", "none")
    				.attr("id",avgItem)
    				.attr("d", avgLine(summary)) 
    				.style("stroke", function() {
    					return summary.color = c; 
    				})

    				/**
    				 * outliers
    				 */
    				if (outs){
    				svg.selectAll("dot")
    				.data(outs)
    				.enter()
    				.append("circle")
    				.attr("id",avgItem)
    				.attr("class", "circle outs")
    				.attr("r", 2.5)
    				.attr("cx", function(d) { return x(d.date); })
    				.attr("cy", function(d) { return yy(d.value); })
    				.style("stroke", "gray")
    				.style("fill", "transparent")
    				.on("mouseover", function(d) {
    					tip.transition()
    					.duration(200)
    					.style("opacity", .9);
    					tip .html("Outlier: <br/>Patient: " + d.pid + "<br/>"+ "Date: " + 
    							formatTime(d.date) + "<br/>" + "Item: " + d.item 
    							+ "<br/>" + "Value: " + d.value)
    							.style("left", (d3.event.layerX)+15 + "px")
    							.style("top", (d3.event.layerY)+15 + "px");
    				})
    				.on("mouseout", function(d) {
    					tip.transition()
    					.duration(500)
    					.style("opacity", 0);
    				})
    				.on("click", function(d){
    					console.log("clicked");
    				})
    				}
    				
    				svg.selectAll("dot")
    				.data(summary)
    				.enter()
    				.append("circle")
    				.attr("id",avgItem)
    				.attr("class", "circle minmax")
    				.style("fill", function(d) {return c})
    				.attr("r", 2.5)
    				.attr("cx", function(d) { return x(d.date); })
    				.attr("cy", function(d) { return yy(d['50%']); })
    				.on("mouseover", function(d) {
    					console.log("mousing")
    					console.log(d)
    					console.log(d3.event)
    					tip.transition()
    					.duration(200)
    					.style("opacity", .9);
    					tip.html("50% Quantile <br/>Patients: " + d.count + "<br/>"+ "Date: " + 
    							formatTime(d.date) + "<br/>" + "Item: " + d.currentitem + "<br/>" + "Value: " + d['50%'])
    							.style("left", (d3.event.layerX)+15 + "px")
    							.style("top", (d3.event.layerY)+15 + "px");
    				})
    				.on("mouseout", function(d) {
    					tip.transition()
    					.duration(500)
    					.style("opacity", 0);
    				})
    				.on("click", function(d){
    					console.log("clicked");
    				})

    				/**
    				 * minimum
    				 */
    				svg
    				.selectAll("dot")
    				.data(summary)
    				.enter()
    				.append("line")
    				.attr("id",avgItem)
    				.attr("class", "quant min")
    				.attr("x1",  function(d) { return x(d.date)-5; })
    				.attr("y1", function(d) { return yy(d['25%']); })
    				.attr("x2",  function(d) { return x(d.date)+5; })
    				.attr("y2", function(d) { return yy(d['25%']); })
    				.style("stroke", function(d) {return minColor})//minColor})
    				.on("mouseover", function(d) {
    					tip.transition()
    					.duration(200)
    					.style("opacity", .9);
    					tip .html("25% Quantile <br/>Patients: " + d.count + "<br/>"+ "Date: " + 
    							formatTime(d.date) + "<br/>" + "Item: " + d.currentitem + "<br/>" + "Value: " + d['25%'])
    							.style("left", (d3.event.layerX)+15 + "px")
    							.style("top", (d3.event.layerY)+15 + "px");
    				})
    				.on("mouseout", function(d) {
    					tip.transition()
    					.duration(500)
    					.style("opacity", 0);
    				})
    				.on("click", function(d){
    					console.log("clicked");

    				});	

    				/**
    				* maximum
    				*/

    				svg.selectAll("dot")
    				.data(summary)
    				.enter()
    				.append("line")
    				.attr("id",avgItem)
    				.attr("class", "quant max")
    				.attr("x1",  function(d) { return x(d.date)-5; })
    				.attr("y1", function(d) { return yy(d['75%']); })
    				.attr("x2",  function(d) { return x(d.date)+5; })
    				.attr("y2", function(d) { return yy(d['75%']); })
    				.style("stroke", function(d) {return minColor})
    				.on("mouseover", function(d) {
    					tip.transition()
    					.duration(200)
    					.style("opacity", .9);
    					tip .html("75% Quantile <br/>Patients: " + d.count + "<br/>"+ "Date: " + 
    							formatTime(d.date) + "<br/>" + "Item: " + avgItem + "<br/>" + "Value: " + d['75%'])
    							.style("left", (d3.event.layerX)+15 + "px")
    							.style("top", (d3.event.layerY)+15 + "px");
    				})
    				.on("mouseout", function(d) {
    					tip.transition()
    					.duration(500)
    					.style("opacity", 0);
    				})
    				.on("click", function(d){
    				})

    				/**
    				* Line between 25-75%
    				*/
    				svg.selectAll("dot")
    				.data(summary)
    				.enter()
    				.append("line")
    				.attr("id",avgItem)
    				.attr("class", "quant min max")
    				.attr("x1",  function(d) { return x(d.date); })
    				.attr("y1", function(d) { return yy(d['75%']); })
    				.attr("x2",  function(d) { return x(d.date); })
    				.attr("y2", function(d) { return yy(d['25%']); })
    				.style("stroke", function(d) {return minColor})
    				.style("stroke-dasharray", ("3, 3"))
    			}
    			if (!_whiskers){
//    				svg.selectAll("circle.minmax").style("opacity", 0);
    				svg.selectAll("line.quant").style("opacity", 0);
    				svg.selectAll("circle.outs").style("opacity", 0);
    			}
    			else {
//    				svg.selectAll("circle.minmax").style("opacity", 1);
    				svg.selectAll("line.quant").style("opacity", 1);
    				svg.selectAll("circle.outs").style("opacity", 1);
    			}
    		}
    		else {
    			svg.selectAll("path.minmax").remove()
    			svg.selectAll("circle.minmax").remove()
    			svg.selectAll("line.quant").remove()
    			svg.selectAll("circle.outs").remove()
    			console.log("hiding!")
    		}
    		
    	}

    	//@Deprecated
    	function showPatientLegend(patients){
    		/*
    		 * Add the Legend for PATIENTS
    		 */
    		var patientSize = Object.keys(patients).length;

    		svg.append("text") 
    		.attr("x", (width +100)) 
    		.attr("y", 0) 
    		.attr("class", "legend patient") 
    		.text("Patients:");

    		var i = 0;
    		for (var patient in patients){
    			legendSpace = (height/patientSize)/2;
    			svg.append("text") 
    			.attr("x", (width +100))
    			.attr("y", 25 + i*legendSpace)
    			.attr("class", "legend patient") 
    			.attr("active", "true")
    			.attr("patient", patient)
    			.text(patient)
    			.on({
    				"mouseover": function(d) {
    					d3.select(this).style("cursor", "pointer")
    				},
    				"mouseout": function(d) {
    					d3.select(this).style("cursor", "default")
    				}
    			})
    			.on("click", function(){
    				var active   = d3.select(this).attr("active");
    				var patient = d3.select(this).attr("patient");
    				var newOpacity = active == "true" ? 0 : 1;
    				d3.selectAll('path[patient = "'+patient+'"],circle[patient = "'+patient+'"]').select(function(){
    					if (d3.select(this).attr("active") == "true"){
    						return this;
    					}
    				}).style("opacity",newOpacity); 
    				if (active == "true"){
    					activePatients.pop(patient);
    					d3.select(this).attr("active", "false");
    				}
    				else if (active == "false"){
    					activePatients.push(patient);
    					d3.select(this).attr("active", "true");
    				}
    			})
    			; 

    			i = i+1;
    		}
    	}

    	function showPatientsData(){
    		console.log("showPatientsData");
    		showPatients(_data);
    	}

    	function showMinMaxData(){
    		console.log("showMinMaxData");
    		showMinMax(_data);
    	}

    	function showWhiskers(){

    		if (_whiskers){
    			svg.selectAll("circle.outs").style("opacity", 0);
    			svg.selectAll("line.quant").style("opacity", 0);
    		}
    		else {
    			svg.selectAll("circle.outs").style("opacity", 1);
    			svg.selectAll("line.quant").style("opacity", 1);
    		}
    	}
    }

}]);

