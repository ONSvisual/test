
//test if browser supports webGL

if(Modernizr.webgl) {

	//setup pymjs
	var pymChild = new pym.Child();

	//Load data and config file
	d3.queue()
		.defer(d3.csv, "data/value.csv")
		.defer(d3.json, "data/config.json")
		.defer(d3.json, "data/geog.json")
		.await(ready);


	function ready (error, valuedata, config, geog){
		//Set up global variables
		dvc = config.ons;
		oldAREACD = "";
		var value='value';
		var switchValue = 'hectare';
		var pollutant = "pollution_total";
		var keyunitvalue='value'
		var breaksData = [-2132,0,4674,6236,8206,20059];
		var x_key;
		var features;

		$('select').select2({
		    minimumResultsForSearch: 20 // at least 20 results must be displayed
		});

		d3.select('#value').on('click', function() {
			value = this.id;
			keyunitvalue=this.id;
			switchMe(value);

			d3.select('#select-container').style('display', 'block');
			d3.select('#pollutant-wrapper').style('display', 'block');

			document.getElementById('button-1').checked = true;
			document.getElementById('button-1').setAttribute("aria-checked", true);

			document.getElementById('button-2').setAttribute("aria-checked", false);
			document.getElementById('button-2').checked = false;

			dataLayer.push({
									 'event': 'buttonClicked',
									 'selected': 'valuelink'
								 })
		})

		d3.select('#hectare').on('click', function() {
			value = this.id;
			keyunitvalue=this.id;
			switchMe(value);

			d3.select('#select-container').style('display', 'none');
			d3.select('#pollutant-wrapper').style('display', 'none');

			d3.select('#select-container').style('display', 'block');
			d3.select('#pollutant-wrapper').style('display', 'block');

			document.getElementById('button-1').checked = false;
			document.getElementById('button-1').setAttribute("aria-checked", false);

			document.getElementById('button-2').setAttribute("aria-checked", true);
			document.getElementById('button-2').checked = true;

			dataLayer.push({
									 'event': 'buttonClicked',
									 'selected': 'hectarelink'
								 })
		})


		d3.selectAll("input[name='button']")
		  .on('click', function() {
				value = this.value;
				keyunitvalue=this.value;
				switchMe(value);
				if(value === 'hectare') {
					d3.select('#select-container').style('display', 'none');
					d3.select('#pollutant-wrapper').style('display', 'none');
				}
				if(value === 'value') {
					d3.select('#select-container').style('display', 'block')
					d3.select('#pollutant-wrapper').style('display', 'block')
				}
				dataLayer.push({
                     'event': 'buttonClicked',
                     'selected': value
                   })
		  });

		//set title of page
		//Need to test that this shows up in GA
		document.title = dvc.maptitle;

		//Fire design functions
		//selectlist(data);

		//Set up number formats
		displayformat = d3.format("." + dvc.displaydecimals + "f");
		legendformat = d3.format("." + dvc.legenddecimals + "f");

		// draw the stacked bars

		// value removed
		var widthPollution = document.getElementById('pollution-removed').clientWidth;
		var heightPollution = 81;

		var marginPollution = {
	    top: 0,
	    bottom: 40,
	    left: 0,
	    right: 0
		};

		var svgPollution = d3.select("#pollution-removed")
	    .append("svg")
	    .attr("width", widthPollution)
	    .attr("height", heightPollution)
	    .attr("align", "center")
	    .append("g")
	    .attr("transform", "translate(" + marginPollution.left + "," + marginPollution.top + ")");

		widthPollution = widthPollution - marginPollution.left - marginPollution.right;
		heightPollution = heightPollution - marginPollution.top - marginPollution.bottom;

		var y = d3.scaleBand()
			.rangeRound([heightPollution,0]);

		var x = d3.scaleLinear()
			.rangeRound([widthPollution, 0]);

		var x_axis = d3.axisBottom(x);

		var y_axis = d3.axisLeft(y);

		svgPollution.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + heightPollution + ")")

		svgPollution.append("rect")
			.attr("class", ".background1")
			.attr('width', widthPollution)
			.attr('y', 0)
			.attr('height', y.bandwidth())
			.attr('fill', "#dadada")

		// hectare
		var widthHectare = document.getElementById('pollution-hectare').clientWidth;
		var heightHectare = 80;

		var marginHectare = {
	    top: 0,
	    bottom: 40,
	    left: 0,
	    right: 0
		};

		var svgHectare = d3.select("#pollution-hectare")
	    .append("svg")
	    .attr("width", widthHectare)
	    .attr("height", heightHectare)
	    .attr("align", "center")
	    .append("g")
	    .attr("transform", "translate(" + marginHectare.left + "," + marginHectare.top + ")");

		widthHectare = widthHectare - marginHectare.left - marginHectare.right;
		heightHectare = heightHectare - marginHectare.top - marginHectare.bottom;

		var y_hectare = d3.scaleBand()
			.rangeRound([heightHectare, 0]);

		var x_hectare = d3.scaleLinear()
			.rangeRound([widthHectare,0]);

		var z_hectare = d3.scaleOrdinal()
    	.range(["#174363", "#dadada"]);

		var stack_hectare = d3.stack();

		var xAxisHec = d3.axisBottom()
	    .scale(x_hectare);

		var yAxisHec = d3.axisLeft()
	    .scale(y_hectare);

		svgHectare.append("g")
	    .attr("class", "axis--x")
	    .attr("transform", "translate(0," + heightHectare + ")");

		svgHectare.append("rect")
			.attr("class", ".background2")
			.attr('width', widthHectare)
			.attr('y', 0)
			.attr('height', y_hectare.bandwidth())
			.attr('fill', "#dadada");

		// function that inserts data to stacked back
		// run function on load with total pollution data from a postcode or 0

		drawStacked(0, 0);
		social();

		function drawStacked(data,data2) {

			var t = d3.transition()
        .duration(2000);

			// value removed
			total_data = [{
				"index": "value",
				"areaVal": data,
				"totalMax": 20059
			}];

			x.domain([0,total_data[0]["totalMax"]]);
      y.domain(total_data.map(function(d) {
            return d.index;
        }));

			var layer = svgPollution.selectAll(".serie")
            .data(total_data);

        layer
            .exit()
            .remove()

        // enter
        var new_layer = layer.enter()
            .append("rect")
            .attr("class", "serie")
						.attr('y', function(d) {
            return y(d.index);
		        })
		        .attr('width', 0)
		        .attr('height', y.bandwidth())

		    new_layer.merge(layer)
		        .transition(t)
		        .attr('y', function(d) {
		            return y(d.index);
		        })
		        .attr('width', function(d) {
		            return widthPollution - x(d.areaVal)
		        })
		        .attr('fill', "#266D4A")



				// // hectare
				var maxHectare = d3.max(valuedata, function(d) {return +d.total});

				data_hectare = [{
					"index": "value",
					"areaVal": data2,
					"hectareMax": maxHectare
				}];

				x_hectare.domain([0, maxHectare]);
				y_hectare.domain(data_hectare.map(function(d) {
							return d.index;
					}));

				var layer_hectare = svgHectare.selectAll(".serie-hectare")
							.data(data_hectare)

					layer_hectare
							.exit()
							.remove()

					// enter
					var new_hectare = layer_hectare.enter()
							.append("rect")
							.attr("class", "serie-hectare")
							.attr('y', function(d) {
								return y(d.index)
							})
							.attr('width', 0)
							.attr('y', heightHectare)
							.attr('height', y_hectare.bandwidth());

					new_hectare.merge(layer_hectare)
							.transition(t)
							.attr('y', function(d) {
									return y_hectare(d.index);
							})
							.attr('width', function(d) {
									return widthHectare - x_hectare(d.areaVal)
							})
							.attr('fill', "#174363");

			pymChild.sendHeight();

		} //end drawStacked

		// average lines

		//first stacked bar

		var xAverage1 = d3.scaleLinear()
				.domain([0,20059])
				.range([0, widthPollution]);

		var yAverage1 = d3.scaleLinear()
				.domain([0, heightPollution])
				.range([0, heightPollution])


		var averageData1 = [[5618.68, 0], [5618.68, 80]];

		var line1 = d3.line()
					.x( function(d) { return xAverage1(d[0]) })
					.y( function(d) { return yAverage1(d[1]) });


		var averageLine1= svgPollution.selectAll('.line1')
													.data([averageData1]);

		averageLine1
			.enter()
			.append('path')
				.attr('class', 'line1')
				.attr("fill", "none")
				.attr("stroke", "#e78402")
				.attr("stroke-width", '3px')
				.attr('d', line1);

		// text average line 1
		var text1 = averageLine1.enter().append('text')
				// .attr('x', x(30))
				.attr("x", xAverage1(6000))
				.attr('y', yAverage1(heightPollution+15))
				.attr('text-anchor', 'start')
				.text("UK average")
				.style('fill', '#666')
				.style('font-weight', 'bold')
				.style('font-size', '14px' );


		var text2 = averageLine1.enter().append('text')
				// .attr('x', x(30))
				.attr("x", xAverage1(6000))
				.attr('y', yAverage1(heightPollution+15))
				.attr('dy',"1.1em")
				.attr('text-anchor', 'start')
				.text("5,619 kg")
				.style('fill', '#666')
				.style('font-weight', 'bold')
				.style('font-size', '18px' );

		// second stacked bar
		var xAverage2 = d3.scaleLinear()
				.domain([0,25.83])
				.range([0, widthPollution]);

		var yAverage2 = d3.scaleLinear()
				.domain([0, heightPollution])
				.range([0, heightPollution])


		var averageData2 = [[15.53, 0], [15.53, 80]];

		var line2 = d3.line()
					.x( function(d) { return xAverage2(d[0]) })
					.y( function(d) { return yAverage2(d[1]) });


		var averageLine2 = svgHectare.selectAll('.line2')
													.data([averageData2]);

		averageLine2
			.enter()
			.append('path')
				.attr('class', 'line2')
				.attr("fill", "none")
				.attr("stroke", "#db8e29")
				.attr("stroke-width", '3px')
				.attr('d', line2);

		// text average line 2
		var text3 = averageLine2.enter().append('text')
				// .attr('x', x(30))
				.attr("x", xAverage2(16))
				.attr('y', yAverage2(heightPollution+17))
				.attr('text-anchor', 'start')
				.text("UK average")
				.style('fill', '#666')
				.style('font-weight', 'bold')
				.style('font-size', '14px' );

		var text4 = averageLine2.enter().append('text')
				// .attr('x', x(30))
				.attr("x", xAverage2(16))
				.attr('y', yAverage2(heightPollution+15))
				.attr('dy',"1.2em")
				.attr('text-anchor', 'start')
				.text("£15.53")
				.style('fill', '#666')
				.style('font-weight', 'bold')
				.style('font-size', '18px' );

		//move the text of the average label for almost mobile
		if(parseInt(d3.select("#postcode-info").style("width"))<222){
			d3.select('#pollution-hectare').select('svg').selectAll('text').remove()

			var text3 = averageLine2.enter().append('text')
					// .attr('x', x(30))
					.attr("x", xAverage2(15))
					.attr('y', yAverage2(heightPollution+17))
					.attr('text-anchor', 'end')
					.text("UK average")
					.style('fill', '#666')
					.style('font-weight', 'bold')
					.style('font-size', '14px' );

			var text4 = averageLine2.enter().append('text')
					// .attr('x', x(30))
					.attr("x", xAverage2(15))
					.attr('y', yAverage2(heightPollution+15))
					.attr('dy',"1.2em")
					.attr('text-anchor', 'end')
					.text("£15.53")
					.style('fill', '#666')
					.style('font-weight', 'bold')
					.style('font-size', '18px' );
		}

		pymChild.sendHeight();

		// hide info and stacked bar charts onload
		d3.select('#postcode-info').style('display', 'none');

		//set up basemap
		map = new mapboxgl.Map({
		  container: 'map', // container id
		 // style: style,
		  style: "data/style.json", //stylesheet location
		  center: [0, 51.50], // starting position
		  zoom: 9, // starting zoom
			minZoom: 4,
		  maxZoom: 20, //
		  attributionControl: false
		});

		// Add zoom and rotation controls to the map.
		map.addControl(new mapboxgl.NavigationControl());

		// Disable map rotation using right click + drag
		map.dragRotate.disable();

		// Disable map rotation using touch rotation gesture
		map.touchZoomRotate.disableRotation();

		// Add geolocation controls to the map.
		map.addControl(new mapboxgl.GeolocateControl({
			positionOptions: {
				enableHighAccuracy: true
			}
		}));

		//add compact attribution
		map.addControl(new mapboxgl.AttributionControl({
			compact: true
		}));

		function defineBreaks(){

			rateById = {};
			areaById = {};

			valuedata.forEach(function(d) {rateById[d.AREACD] = +d[variables[0]]; areaById[d.AREACD] = d.AREANM}); //change to brackets
			breaks = config.ons.breaks[0];
			createKey(breaks);
		}

		function setupScales() {
			//set up d3 color scales
			//Load colours
			if(typeof dvc.varcolour === 'string') {
				colour = colorbrewer[dvc.varcolour][dvc.numberBreaks];
			} else {
				colour = dvc.varcolour;
			}

			//set up d3 color scales
			color = d3.scaleThreshold()
					.domain(breaks.slice(1))
					.range(colour);
		}

		////////////////////build value map/////////////////////////

		//Get column names
		variables = [];
		for (var column in valuedata[0]) {
			if (column == 'AREACD') continue;
			if (column == 'AREANM') continue;
			variables.push(column);
		}

		defineBreaks();
		setupScales();

		//convert topojson to geojson
		for(key in geog.objects){
			var areas = topojson.feature(geog, geog.objects[key])
		}

		//and add properties to the geojson based on the csv file we've read in
				areas.features.map(function(d,i) {
				  if(!isNaN(rateById[d.properties.AREACD]))
				  	{d.properties.fill = color(rateById[d.properties.AREACD])
						 d.properties.value = rateById[d.properties.AREACD]}
				  else {d.properties.fill = '#ccc'};
				});

		map.on('load', function() {

			map.addSource('area', { 'type': 'geojson', 'data': areas });

				map.addLayer({
					'id': 'area',
					'type': 'fill',
					'source': 'area',
					'touchAction':'none',
					"layout": {
						"visibility": "visible"
					},
					'paint': {
						'fill-color': {
							type: 'identity',
							property: 'fill'
						 },
						'fill-opacity': 0.0,
						'fill-outline-color': '#fff'
					}
				}, 'place_suburb');

				map.addLayer({
					"id": "state-fills-hover",
					"type": "line",
					"source": "area",
					"layout": {},
					"paint": {
						"line-color": "rgba(0,0,0,0)",
						"line-width": 2
					},
					"filter": ["==", "AREACD", ""]
				}, 'place_suburb');

			zoomThreshold = 11;

			// Add Mapillary sequence layer.
			// https://www.mapillary.com/developer/tiles-documentation/#sequence-layer
			map.addLayer({
				"id": "pollution",
				'type': 'fill',
				"source": {
					"type": "vector",
					"tiles": ["https://cdn.ons.gov.uk/maptiles/t3/{z}/{x}/{y}.pbf"],
					//"tiles": ["http://localhost/pollution/pollutionmap/tiles/{z}/{x}/{y}.pbf"],
					"minzoom": 4,
					"maxzoom": 14
				},
				"source-layer": "pollution",
				'paint': {
            'fill-opacity':0.7,
						'fill-outline-color':'rgba(0,0,0,0)',
            'fill-color': {
                // Refers to the data of that specific property of the polygon
              'property': 'pollution_total',
              // Prevents interpolation of colors between stops
              'base': 0,
              // Stops are an array of two element arrays:
              // [value_of_property, color]
              // The color applies to values equal or below the value_of_property
              'stops': [
								[-2132, '#f6e8c3'],
									[0, '#B5C9BF'],
									[4674, '#91B2A1'],
									[6236, '#6D9B84'],
									[8206, '#498467'],
									[20059, '#266D4A']
              ]
            }

          }
			}, 'place_suburb');

		// });

			map.addLayer({
                "id": "onekmhover",
                "type": "line",
                "source": {
                    "type": "vector",
										"tiles": ["https://cdn.ons.gov.uk/maptiles/t3/{z}/{x}/{y}.pbf"],
										//"tiles": ["http://localhost/pollution/pollutionmap/tiles/{z}/{x}/{y}.pbf"],
										 //"tiles": ["http://localhost:8001/tiles2/{z}/{x}/{y}.pbf"],
                    "minzoom": 1,
                    "maxzoom": 14
                },
                "source-layer": "pollution",
								"minzoom": 9,
								"maxzoom": 14,

                // "minzoom": zoomThreshold,
                // "maxzoom": (zoomThreshold+1,
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "#000",
                    "line-width": 2
                },
                "filter": ["==", "GID", ""]
            }, 'place_suburb');
		});

		map.on('click', 'pollution', onClick);
		// map.on('click', 'area', onClick);

            //Highlight stroke on mouseover (and show area information)
            map.on("mousemove", "pollution", onMove);

            // Reset the state-fills-hover layer's filter when the mouse leaves the layer.
            map.on("mouseleave", "pollution", onLeave);
						pymChild.sendHeight();

		$("#pcText").click(function() {
			$("#pcText").val('')
		})

		$("#submitPost").click(function( event ) {

						event.preventDefault();
						event.stopPropagation();

						myValue=$("#pcText").val();

						getCodes(myValue);
						pymChild.sendHeight();
		});

		// update the map when selecting dropdown

		$('#pollutant-select').on('change', function() {
			pollutant = $('#pollutant-select').val();
			updateLayers(pollutant)
			dataLayer.push({
                     'event': 'mapDropSelect',
                     'selected': pollutant
                   })
		})

		function updateLayers(pollVal) {
			//set up style object

			var dataBreaks = {
				'pollution_SO2':
				[[-145, '#f6e8c3'],
					[0, '#B5C9BF'],
					[392, '#91B2A1'],
					[700, '#6D9B84'],
					[2282, '#498467'],
					[6761, '#266D4A']],

				'pollution_total':
				[[-2132, '#f6e8c3'],
					[0, '#B5C9BF'],
					[4674, '#91B2A1'],
					[6236, '#6D9B84'],
					[8206, '#498467'],
					[20059, '#266D4A']],

				'pollution_O3':
				[[-891, '#f6e8c3'],
					[0, '#B5C9BF'],
					[3434, '#91B2A1'],
					[4769, '#6D9B84'],
					[5818, '#498467'],
					[8892, '#266D4A']],

				'pollution_NH3':
				[[-79, '#f6e8c3'],
					[0, '#B5C9BF'],
					[218, '#91B2A1'],
					[336, '#6D9B84'],
					[506, '#498467'],
					[1449, '#266D4A']],

				'pollution_PM10':
				[[-1161, '#f6e8c3'],
					[0, '#B5C9BF'],
					[336, '#91B2A1'],
					[670, '#6D9B84'],
					[1134, '#498467'],
					[4416, '#266D4A']],

				'pollution_PM25':
				[[-178, '#f6e8c3'],
					[0, '#B5C9BF'],
					[175, '#91B2A1'],
					[342, '#6D9B84'],
					[602, '#498467'],
					[1662, '#266D4A']],

				'pollution_NO2':
				[[-18, '#f6e8c3'],
					[0, '#B5C9BF'],
					[329, '#91B2A1'],
					[573, '#6D9B84'],
					[925, '#498467'],
					[3577, '#266D4A']]
			}

			breaksData = [dataBreaks[pollVal][0][0], dataBreaks[pollVal][1][0], dataBreaks[pollVal][2][0], dataBreaks[pollVal][3][0], dataBreaks[pollVal][4][0], dataBreaks[pollVal][5][0]]

			createKey(breaksData)

			styleObject = {
									property: pollVal,
									'stops': dataBreaks[pollVal]

						}
			//repaint area layer map usign the styles above
			map.setPaintProperty('pollution', 'fill-color', styleObject);
		};

			//Highlight stroke on mouseover (and show area information)
			map.on("mousemove", "OAbounds", onMove);

			//Work out zoom level and update
			map.on("moveend", function (e) {
				zoom = parseInt(map.getZoom());

				baselevel = 13;
				numberperdotlowest = 10;
				dropdensity = 2;

				if(zoom < baselevel) {
					thepowerof = (baselevel - zoom);
					numberperdot = numberperdotlowest * Math.pow(dropdensity,thepowerof);

					d3.select("#people").text("1 dot = ~" +  (numberperdot).toLocaleString('en-GB') + " people")
				} else {
					d3.select("#people").text("1 dot = ~10 people")
				}
			});

			function getCodes(myPC)	{

					dataLayer.push({
										 'event': 'geoLocate',
										 'selected': 'postcode'
									 })

					var myURIstring=encodeURI("https://api.postcodes.io/postcodes/"+myPC);
					$.support.cors = true;
					$.ajax({
						type: "GET",
						crossDomain: true,
						dataType: "jsonp",
						url: myURIstring,
						error: function (xhr, ajaxOptions, thrownError) {
							},
						success: function(data1){
							if(data1.status == 200 ){
								//$("#pcError").hide();
								lat =data1.result.latitude;
								lng = data1.result.longitude;

								success(lat,lng)
							} else {
								$("#pcText").val("Sorry, invalid postcode.");
							}
						}

					});

				}

		function success(lat,lng) {

		  //go on to filter
		  //Translate lng lat coords to point on screen

			if($("body").width() < 600) {
					durationlength = 500;
			} else {
					durationlength = 500;
			}
		//	durationlength

		  point = map.project([lng,lat]);

			map.jumpTo({center:[lng,lat], zoom:10, duration:durationlength})

			var tilechecker = setInterval(function(){
				features = map.queryRenderedFeatures(point);
				if(features!=undefined){
					onrender(),
					clearInterval(tilechecker)
				}
			},500)

			tilechecker


		};

		function onrender(){
				d3.select("#loadingtext").style("display","none")


				d3.select('#onload-text').style('display', 'none');
				d3.selectAll('.container-stats').style('display', 'none');
				d3.select('#postcode-info').style('display', 'block');

				point = map.project([lng,lat]);

				features = map.queryRenderedFeatures(point);

				if(features[0].layer.id != "pollution") {
					j=1;
				} else {
					j=0
				}

                drawStacked(features[j].properties.pollution_total, features[j+1].properties.value);
								d3.select('#num-leaf').text(d3.format(",.0f")(features[j].properties.pollution_total));
								d3.select('#num-coin').text('£'+features[j+1].properties.value);
								d3.select('#yourNuts3').text(features[j+1].properties.AREANM);

                map.setFilter("onekmhover", ["==", "GID", features[j].properties.GID]);
								map.setFilter("state-fills-hover", ["==", "AREACD", features[j+1].properties.AREACD]);

				d3.select("#twitterShare")
					.attr("href","https://twitter.com/intent/tweet?text=Removal of pollution by vegetation saves an estimated £" + features[j+1].properties.value + " per person in "+ features[j+1].properties.AREANM + " " + ParentURL);

		};



		function onMove(e) {
			map.getCanvasContainer().style.cursor = 'pointer';
			dataLayer.push({
                     'event': 'mapHoverSelect',
                     'selected': e.lngLat
                   })
		};


		function onLeave() {
				hideaxisVal();
		};

		function onClick(e) {

										features = map.queryRenderedFeatures(e.point);

										if(features[0].layer.id != "pollution") {
											j=1;
										} else {
											j=0
										}

										if(typeof features[j+1].properties.value === "undefined") {
											features[j+1].properties.value = 0;
											d3.select('#num-coin').text('no value');
											d3.select('#yourNuts3').text('no value');
										}
										else {
											features[j+1].properties.value = features[j+1].properties.value;
											d3.select('#num-coin').text('£'+features[j+1].properties.value);
											d3.select('#yourNuts3').text(features[j+1].properties.AREANM);
											map.setFilter("state-fills-hover", ["==", "AREACD", features[j+1].properties.AREACD]);
										}

										drawStacked(features[j].properties.pollution_total, features[j+1].properties.value);
										if(value==='value') {
											setAxisVal(features[j].properties[pollutant]);
										} if(value==='hectare') {
											setAxisVal(features[j+1].properties.value);
										}

										d3.select('#onload-text').style('display', 'none');
										d3.selectAll('.container-stats').style('display', 'none');
										d3.select('#postcode-info').style('display', 'block');

		                				map.setFilter("onekmhover", ["==", "GID", features[j].properties.GID]);

										d3.select('#num-leaf').text(d3.format(",.0f")(features[j].properties.pollution_total));

										d3.select("#twitterShare")
										.attr("href","https://twitter.com/intent/tweet?text=Removal of pollution by vegetation saves an estimated £" + features[j+1].properties.value + " per person in "+ features[j+1].properties.AREANM + " " + ParentURL);

										dataLayer.push({
																	 'event': 'mapClickSelect',
																	 'selected': e.lngLat
																 })


		        };

		function disableMouseEvents() {
				map.off("mousemove", "area", onMove);
				map.off("mouseleave", "area", onLeave);
		}

		function enableMouseEvents() {
				map.on("mousemove", "area", onMove);
				map.on("mouseleave", "area", onLeave);
		}

		function selectArea(code) {
			$("#areaselect").val(code).trigger("chosen:updated");
		}

		function zoomToArea(code) {

			specificpolygon = areas.features.filter(function(d) {return d.properties.AREACD == code})

			specific = turf.extent(specificpolygon[0].geometry);

			map.fitBounds([[specific[0],specific[1]], [specific[2], specific[3]]], {
  				padding: {top: 150, bottom:150, left: 100, right: 100}
			});

		}

		function resetZoom() {
			map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]]);
		}

		function setAxisVal(code) {
			d3.select("#currLine")
				.style("opacity", function(){if(!isNaN(code)) {return 1} else{return 0}})
				.transition()
				.duration(400)
				.attr("x1", function(){if(!isNaN(code)) {return x_key(code)} else{return x_key(0)}})
				.attr("x2", function(){if(!isNaN(code)) {return x_key(code)} else{return x_key(0)}});

			d3.select("#currVal")
				.text(function(){if(!isNaN(code))  {return displayformat(code)} else {return "Data unavailable"}})
				.style("opacity",1)
				.transition()
				.duration(400)
				.attr("x", function(){if(!isNaN(code)) {return x_key(code)} else{return x(0)}});
		}

		function hideaxisVal() {
			d3.select("#currLine")
				.style("opacity",0)

			d3.select("#currVal").text("")
				.style("opacity",0)
		}

		function createKey(config){
			// remove existing key when changing pollutant
			d3.select('#keydiv').selectAll('*').remove();

			var breaks = config;

			keywidth = $("#keydiv").width();
			bodywidth = $("body").width();

			if(bodywidth < 600) {
				d3.select("#postcodetext").text("Enter your postcode");
			}

			var svgkey = d3.select("#keydiv")
				.append("svg")
				.attr("id", "key")
				.attr("width", keywidth)
				.attr("height",65);

			var colour = [["#f6e8c3"],["#B5C9BF"],["#91B2A1"],["#6D9B84"],["#498467"]]//,["#266D4A"]]



			var colourblue = [["#eff3ff"],["#bdd7e7"],["#6baed6"],["#3182bd"],["#08519c"]]
			if(value==='hectare'){
				colour=colourblue
			}

			var color = d3.scaleThreshold()
			   .domain(breaks)
			   .range(colour);

			// Set up scales for legend
			x_key = d3.scaleLinear()
				.domain([breaks[0], breaks[5]]) /*range for data*/
				.range([0,keywidth-32]); /*range for pixels*/


			var xAxis = d3.axisBottom(x_key)
				.tickSize(15)
				.tickValues([breaks[0], breaks[5]])

			var g2 = svgkey.append("g").attr("id","horiz")
				.attr("transform", "translate(15,30)");

			keyhor = d3.select("#horiz");

			g2.selectAll("rect")
				.data(color.range().map(function(d,i) {

				  return {
					x0: i ? x_key(color.domain()[i+1]) : x_key.range()[0],
					x1: i < color.domain().length ? x_key(color.domain()[i+1]) : x_key.range()[1],
					z: d
				  };
				}))
			  .enter().append("rect")
				.attr("class", "blocks")
				.attr("height", 8)
				.attr("x", function(d) {
					 return d.x0; })
				.attr("width", function(d) {return d.x1 - d.x0; })
				.style("opacity",0.8)
				.style("fill", function(d) { return d.z; });


			g2.append("line")
				.attr("id", "currLine")
				.attr("x1", x_key(10))
				.attr("x2", x_key(10))
				.attr("y1", -10)
				.attr("y2", 8)
				.attr("stroke-width","2px")
				.attr("stroke","#000")
				.attr("opacity",0);

			g2.append("text")
				.attr("id", "currVal")
				.attr("x", x_key(10))
				.attr("y", -15)
				.attr("fill","#000")
				.text("");

			keyhor.selectAll("rect")
				.data(color.range().map(function(d, i) {
				  return {
					x0: i ? x_key(color.domain()[i]) : x_key.range()[0],
					x1: i < color.domain().length ? x_key(color.domain()[i+1]) : x_key.range()[1],
					z: d
				  };
				}))
				.attr("x", function(d) { return d.x0; })
				.attr("width", function(d) { return d.x1 - d.x0; })
				.style("fill", function(d) { return d.z; });

			keyhor.call(xAxis).append("text")
				.attr("id", "caption")
				.attr("x", -63)
				.attr("y", -20)
				.text("");

			keyhor.append("rect")
				.attr("id","keybar")
				.attr("width",8)
				.attr("height",0)
				.attr("transform","translate(15,0)")
				.style("fill", "#ccc")
				.attr("x",x_key(0));


			if(dvc.dropticks) {
				d3.select("#horiz").selectAll("text").attr("transform",function(d,i){
						// if there are more that 4 breaks, so > 5 ticks, then drop every other.
						if(i % 2){return "translate(0,10)"} }
				);
			}
			//Temporary	hardcode unit text
			dvc.unittext = "change in life expectancy";

			keyunitvalue=$('input[name=button]:checked').val()

			if(value==='value') {
				d3.select("#keydiv").append("p").attr("id","keyunit").style("margin-top","-10px").style("margin-left","10px").text(dvc.varunit);
			}
			if(value==='hectare') {
				d3.select("#keydiv").append("p").attr("id","keyunit").style("margin-top","-10px").style("margin-left","10px").text(dvc.varunit2);
			}

	} // Ends create key
	// run createKey with breaks
	createKey(breaksData);


	function addFullscreen() {

		currentBody = d3.select("#map").style("height");
		d3.select(".mapboxgl-ctrl-fullscreen").on("click", setbodyheight)

	}

	function setbodyheight() {
		d3.select("#map").style("height","100%");

		document.addEventListener('webkitfullscreenchange', exitHandler, false);
		document.addEventListener('mozfullscreenchange', exitHandler, false);
		document.addEventListener('fullscreenchange', exitHandler, false);
		document.addEventListener('MSFullscreenChange', exitHandler, false);

	}

	function switchMe(valueButton) {

		if(valueButton === 'hectare') {
			// value = 'value';
			map.setPaintProperty('area', 'fill-opacity', 0.7);
			map.setPaintProperty('state-fills-hover', 'line-color', "rgba(0,0,0,1)");
			map.setPaintProperty('pollution', 'fill-opacity', 0);
			map.setPaintProperty('onekmhover', 'line-opacity', 0);
			defineBreaks();
			setupScales();
			// createKey(breaksData);
		} if(valueButton==='value') {
			// value = 'hectare';
			map.setPaintProperty('area', 'fill-opacity', 0.0);
			map.setPaintProperty('state-fills-hover', 'line-color', "rgba(0,0,0,0)")
			map.setPaintProperty('pollution', 'fill-opacity', 0.7);
			map.setPaintProperty('onekmhover', 'line-opacity', 0.7);
			createKey(breaksData);
		}
	}


	function exitHandler() {

			if (document.webkitIsFullScreen === false)
			{
				shrinkbody();
			}
			else if (document.mozFullScreen === false)
			{
				shrinkbody();
			}
			else if (document.msFullscreenElement === false)
			{
				shrinkbody();
			}
		}

	function shrinkbody() {
		d3.select("#map").style("height",currentBody);
		pymChild.sendHeight();
	}

	function geolocate() {

		var options = {
		  enableHighAccuracy: true,
		  timeout: 5000,
		  maximumAge: 0
		};

		navigator.geolocation.getCurrentPosition(success, error, options);
	}

	function social() {
		d3.select("#social")
		.append("div")
		.attr("id", "share")
		.style("width","100%")
		.style("height", "60px")
		//.style("float", "left")
		.style("text-align","center");

	d3.select("#share")
		.append("p")
		.style('margin-top',"10px")
		.style('margin-right',"20px")
		.style("font-weight","bold")
		.style("text-align","center")
		.style("color","#666")
		.text("Share your results")


	ParentURL = (window.location != window.parent.location)
	            ? document.referrer
	            : document.location;

	//appending the buttons
	d3.select("#share").append("a")
		.attr("id","facebookShare")
		.attr("href","https://www.facebook.com/sharer/sharer.php?u=" + ParentURL)
		.attr("target","_blank")
		.style("height","25px")
		.style("width","25px")
		.style("background","#fff")
		.style("margin-top","5px")
		.style("margin-right","7px")
		.style("margin-bottom","5px")
		.style("opacity","0.7")
		.attr("title","Facebook")
		.append("img")
		.style("height","25px")
		.style("width","25px")
		.attr("src","./images/facebook-blue.png");

	d3.select("#share").append("a")
		.attr("id","twitterShare")
		.attr("href","https://twitter.com/intent/tweet?text=Explore how pollution is removed by vegetation across the UK " + ParentURL)
		.attr("target","_blank")
		.style("height","25px")
		.style("width","25px")
		.style("background","#fff")
		.style("margin-top","5px")
		.style("margin-right","7px")
		.style("margin-bottom","5px")
		.style("opacity","0.7")
		.attr("title","Twitter")
		.append("img")
		.style("height","25px")
		.style("width","25px")
		.attr("src","./images/twitter-blue.png");


	//on mouseover
	d3.select("#facebookShare").on("mouseover", function() {
		d3.select("#facebookShare").style("opacity","1");
	});
	d3.select("#twitterShare").on("mouseover", function() {
		d3.select("#twitterShare").style("opacity","1");
	});

	//on mouseout
	d3.select("#facebookShare").on("mouseout", function() {
		d3.select("#facebookShare").style("opacity","0.7");
	});
	d3.select("#twitterShare").on("mouseout", function() {
		d3.select("#twitterShare").style("opacity","0.7");
	});

}


		function selectlist(datacsv) {

			var areacodes =  datacsv.map(function(d) { return d.AREACD; });
			var areanames =  datacsv.map(function(d) { return d.AREANM; });
			var menuarea = d3.zip(areanames,areacodes).sort(function(a, b){ return d3.ascending(a[0], b[0]); });

			// Build option menu for occupations
			var optns = d3.select("#selectNav").append("div").attr("id","sel").append("select")
				.attr("id","areaselect")
				.attr("style","width:98%")
				.attr("class","chosen-select");


			optns.append("option")
				.attr("value","first")
				.text("");

			optns.selectAll("p").data(menuarea).enter().append("option")
				.attr("value", function(d){ return d[1]})
				.text(function(d){ return d[0]});

			myId=null;

			$('#areaselect').chosen({width: "98%", allow_single_deselect:true}).on('change',function(evt,params){

					if(typeof params != 'undefined') {

							disableMouseEvents();

							map.setFilter("state-fills-hover", ["==", "AREACD", params.selected]);

							selectArea(params.selected);
							setAxisVal(params.selected);

							zoomToArea(params.selected);

					}
					else {
							enableMouseEvents();
							hideaxisVal();
							onLeave();
							resetZoom();
					}

			});

	};

	}



} else {

	//provide fallback for browsers that don't support webGL
	d3.select('#map').remove();
	d3.select('body').append('p').html("Unfortunately your browser does not support WebGL. <a href='https://www.gov.uk/help/browsers' target='_blank>'>If you're able to please upgrade to a modern browser</a>")

}
