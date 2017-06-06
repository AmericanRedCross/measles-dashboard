$.ajax({
	async: true,
  crossDomain: true,
  url: "http://url-to-server.com/form.json",
  method: "GET",
  headers: {
    "authorization": "",
    "cache-control": "no-cache",
	},
	success: function(response){
		init(response);
	}
});

var map;

function init(data){
	data = dataPrep(data);
	console.log(data);
	initMap(data);
	generateDistrictGraph(data);
	generateReasonsChart(data);
	generateRefuseChart(data);
}

function dataPrep(data){

	var districts = ['district_n', 'district_c', 'district_s'];
	data.forEach(function(d){
		districts.forEach(function(dis){
			if(d.intros[dis]!=undefined){
				d.district = d.intros[dis];
			}
		});
		d.trigger = false;
		if(d.inside){
			if(d.inside){
				if(d.inside.inside_trigger1==1 || d.inside.inside_trigger1==2){
					d.trigger = true;
				}
			} else {
				if(d.outside.outside_trigger==1){
					d.trigger = true;
				}
			}
		}
	});
	return data;
}

function initMap(data){

	var baselayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW1lcmljYW5yZWRjcm9zcyIsImEiOiJzdHVRWjA4In0.bnfdwZhKX8tQeMkwY-kknQ', {maxZoom: 20,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'})

	map = L.map('map', {
		center: [0, 0],  //center: [43,20],
		zoom: 2,            //zoom: 5,
		layers: [baselayer]
	});

	var labels = ['No corrective action','Requires corrective action'];

	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend');

        div.innerHTML = "<p></p>";
        for (var i = 0; i < labels.length; i++) {
            div.innerHTML +='<i style="background:' + colors[i] + '"></i> ' + labels[i] + '<br />';
        }

        return div;
    };

	legend.addTo(map);

	createMarkers(data);

}

function createMarkers(data){

	data.forEach(function(d){

		var color = colors[0];
		if(d.trigger){
			var color = colors[1];
		}

		var maxX = d3.max(data,function(d){return d.intros.gps.longitude});
		var maxY = d3.max(data,function(d){return d.intros.gps.latitude});
		var minX = d3.min(data,function(d){return d.intros.gps.longitude});
		var minY = d3.min(data,function(d){return d.intros.gps.latitude});

		map.fitBounds([
			[minY, minX],
			[maxY, maxX]
		]);

		d.marker = L.circleMarker([d.intros.gps.latitude, d.intros.gps.longitude],{
			radius: 5,
			fillColor: color,
			color: color,
			opacity: 1,
			fillOpacity: 1
		});

		d.marker.addTo(map);

		if(d.inside==undefined){
			var content = '<p>Inside</p>';
		} else {
			var content = '<p>Outside</p>';
		}
		content+='<p>Date: '+d.today+'</p>';
		content+='<p>IMEI: '+d.imei+'</p>';

		d.marker.bindPopup(content);
	});

	return data;
}

function generateDistrictGraph(data){

	var chartData = [['x'],['Requires corrective action'],['No corrective action']];
	var tempData = {};
	data.forEach(function(d){
		if(!(d.district in tempData)){
			tempData[d.district] = {'Requires corrective action':0,'No corrective action':0}
		}
		if(d.trigger){
			tempData[d.district]['Requires corrective action']++;
		} else {
			tempData[d.district]['No corrective action']++;
		}
	});

	for(key in tempData){
		chartData[0].push(key);
		chartData[1].push(tempData[key]['Requires corrective action']);
		chartData[2].push(tempData[key]['No corrective action']);
	}

	var chart = c3.generate({
		bindto: '#districtchart',
		padding: {
			left: 60
		},
		data: {
			x: 'x',
			columns:chartData,
			type: 'bar',
			groups: [
				['Requires corrective action', 'No corrective action']
			],
			colors: {
				'Requires corrective action': colors[1],
				'No corrective action': colors[0]
			}
		},
		axis: {
			// rotated: true,
			x: {
				type: 'category',
				tick: {
                	rotate: -45,
                	multiline: false
            	},
            height: 130
			}
		}
	});
}

function generateReasonsChart(data){

	tempData = {};

	data.forEach(function(d){
		if(d.inside!=undefined){
			d.inside.inside_repeat.forEach(function(r){
				if('reason_unvacc' in r){
					var reasons = r['reason_unvacc'].split(' ');
					reasons.forEach(function(reason){
						if(!(reason in tempData)){
							tempData[reason] = 0;
						}
						tempData[reason]++;
					});

				}
			});
		}
	});

	var chartData = [['x'],['values']];

	for(key in tempData){
		chartData[0].push(key);
		chartData[1].push(tempData[key]);
	}

	var chart = c3.generate({
		bindto: '#reasonchart',
		padding: {
			left: 30
		},
		data: {
			x: 'x',
			columns:chartData,
			type: 'bar',
		},
		axis: {
			x: {
				type: 'category',
				tick: {
                	rotate: -45,
                	multiline: false
            	},
        		height: 130
			},
			y: {
				tick: {
									format: d3.format("d")
							}
			}
		},
		legend: {
        show: false
    }
	});
}

function generateRefuseChart(data){

	tempData = {};

	data.forEach(function(d){
		if(d.inside!=undefined){
			d.inside.inside_repeat.forEach(function(r){
				// if('reason_refuse' in r){
				// 	if(!(r['reason_refuse'] in tempData)){
				// 		tempData[r['reason_refuse']] = 0;
				// 	}
				// 	tempData[r['reason_refuse']]++;
				// }
				if('reason_refuse' in r ){
					var refuses = r['reason_refuse'].split(' ');
					refuses.forEach(function(refuse){
						if(!(refuse in tempData)){
							tempData[refuse] = 0;
						}
						tempData[refuse]++;
					});
				}
			});
		}
	});

	console.log(tempData);

	var chartData = [['x'],['values']];

	for(key in tempData){
		chartData[0].push(key);
		chartData[1].push(tempData[key]);
	}

	var chart = c3.generate({
		bindto: '#refusechart',
		padding: {
			left: 30
		},
		data: {
			x: 'x',
			columns:chartData,
			type: 'bar',
		},
		axis: {
			x: {
				type: 'category',
				tick: {
        	rotate: -45,
          multiline: false
        },
				height: 130
			},
			y: {
				tick: {
									format: d3.format("d")
							}
			}
		},
		legend: {
        show: false
    }
	});
}

d3.selectAll(".c3-legend-item-data1 text").text("Changed")

//footer report time
var time = new Date();
var year = time.getFullYear();
var month = time.getMonth()+1;
var date1 = time.getDate();
var hour = time.getHours();
var minutes = time.getMinutes();
var colors = ['#2E7D32','#ff7800'];
document.getElementById('now')
	.innerHTML = "Report Time: "+  year + "-" + month+"-"+date1+" "+hour+":"+minutes;
