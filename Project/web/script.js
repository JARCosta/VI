// Declare global variables to hold data for countries and capita
var globalDataCountries;
var globalData;
var filteredData;
var country_selection = [];
var applyFilters, selected;
var histogramData;

var year_range = [2010, 2019];

const AQIcolorScale = d3.interpolateRgbBasis(["lightgreen", "yellow", "orange"]);

var parallelColorScale;


var choroLegendCreated = false;
var paralellLegendCreated = false;
var treeLegendCreated = false;

// Define margin and dimensions for the charts
const margin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 80,
};
const width = 500 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Function to start the dashboard
function startDashboard() {
  // Helper functions to load JSON and CSV files using D3's d3.json and d3.csv
  function loadJSON(file) {
    return d3.json(file);
  }
  function loadCSV(file) {
    return d3.csv(file);
  }

  // Function to import both files (data.json and gapminder.csv) using Promise.all
  function importFiles(file1, file2, file3) {
    return Promise.all([loadJSON(file1), loadCSV(file2), loadJSON(file3)]);
  }

  // File names for JSON and CSV files
  const file1 = "data.json";
  const file2 = "gapminder.csv";
  const file3 = "deaths_emissions_gdp.json";

  // Import the files and process the data
  importFiles(file1, file2, file3).then(function (results) {
    // Store the JSON data into globalDataCountries using topojson.feature
    globalDataCountries = topojson.feature(results[0], results[0].objects.countries);

    globalData = results[2];
    filteredData = globalData;
    
    // Call functions to create the choropleth map and scatter plot
    // createYearFilter();
    createLineShart();
    createChoroplethMap();
    createParallelCoordinates();
    createTreeMap();
    createStreamGraph();
  });
}



function getYearAverageData(data) {

  var averageData = [];

  const temp = data.filter(d => d.Year >= year_range[0] && d.Year <= year_range[1]);

  temp.forEach((element) => {
    const year = element.Year;
    var cities = element.Cities;
    const towns = element.Towns;
    const urban = element.Urban;
    const rural = element.Rural;
    const total = element.Total;
    const totalEmissions = element.Total_Emissions;

    const index = averageData.findIndex((d) => d.Year == year);


    if (index == -1) {
      averageData.push({
        Year: year,
        Cities: cities != ".." ? cities : 0,
        Cities_count: cities != ".." ? 1 : 0,
        Towns: towns,
        Towns_count: 1,
        Urban: urban,
        Urban_count: 1,
        Rural: rural,
        Rural_count: 1,
        Total: total,
        Total_count: 1,
        Total_Emissions: totalEmissions,
        Total_Emissions_count: 1,
      });
    }
    else {
      if (cities != ".." && cities != NaN) {
        averageData[index].Cities = (averageData[index].Cities + cities);
        averageData[index].Cities_count++;
      }
      if (towns != "..") {
        averageData[index].Towns = (averageData[index].Towns + towns);
        averageData[index].Towns_count++;
      }
      if (urban != "..") {
        averageData[index].Urban = (averageData[index].Urban + urban);
        averageData[index].Urban_count++;
      }
      if (rural != "..") {
        averageData[index].Rural = (averageData[index].Rural + rural);
        averageData[index].Rural_count++;
      }
      if(totalEmissions != ".."){
        averageData[index].Total_Emissions = (averageData[index].Total_Emissions + totalEmissions);
        averageData[index].Total_Emissions_count++;
      }
      if(total != ".."){
        averageData[index].Total = (averageData[index].Total + total);
        averageData[index].Total_count++;
      }
    }
  });

  averageData.forEach((element) => {
    averageData[averageData.findIndex((d) => d.Year == element.Year)].Cities = element.Cities / element.Cities_count;
    averageData[averageData.findIndex((d) => d.Year == element.Year)].Towns = element.Towns / element.Towns_count;
    averageData[averageData.findIndex((d) => d.Year == element.Year)].Urban = element.Urban / element.Urban_count;
    averageData[averageData.findIndex((d) => d.Year == element.Year)].Rural = element.Rural / element.Rural_count;
    averageData[averageData.findIndex((d) => d.Year == element.Year)].Total = element.Total / element.Total_count;
    averageData[averageData.findIndex((d) => d.Year == element.Year)].Total_Emissions = element.Total_Emissions / element.Total_Emissions_count;
  });

  const ret = [];
  averageData.forEach((element) => {
    ret.push({
      Year: element.Year,
      Cities: element.Cities,
      Towns: element.Towns,
      Urban: element.Urban,
      Rural: element.Rural,
      Total: element.Total,
      Total_Emissions: element.Total_Emissions,
    });
  });
  
  // console.log(ret);
  return ret;
}


function createLineShart() {
  var tempData;
  if(country_selection.length != 0){
    tempData = globalData.filter(d => country_selection[d.Country] == true);
  } else {
    tempData = globalData;
  }
  tempData = getYearAverageData(tempData)


  console.log(tempData);

  var filters = {};
  // console.log(currentData);

  const width = 585;

  const svg = d3
    .select("#lineChart")
    .append("svg")
    .attr("width", width + 20)
    .attr("height", 40)
    ;
  
  const xScale = d3.scaleLinear()
    .domain([d3.min(tempData, (d) => d.Year), d3.max(tempData, (d) => d.Year)])
    .range([15, width]);
  
  const yScale = d3.scaleLinear()
    .domain([d3.min(tempData, (d) => d["Total_Emissions"]), d3.max(tempData, (d) => d["Total_Emissions"])])
    .range([30, 3]);
  
  const line = d3.line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d["Total_Emissions"]))
    ;


  const path = svg
    .append("g")
    .attr("class", "line")
    .append("path")
    .datum(tempData)
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", "beige")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    ;
  
  const years = svg
    .append("g")
    .attr("class", "years")
    .selectAll("text")
    .data(tempData)
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.Year))
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text((d) => d.Year)
    .attr("fill", "beige")
    .attr("font-size", "10px")
    .attr("font-weight", "bold")
    .attr("transform", "translate(0, 10)")
    ;

  // Add brushing
  const brush = d3.brushX()
    .extent([[15, 0], [800, 40]])
    .on("brush", brushed)
    ;
  


  const gBrush = svg.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, xScale.range())
    ;


  function brushed(event) {
    if (event.sourceEvent && event.sourceEvent.type === "zoom")
    return; // ignore brush-by-zoom
  if (event.selection != null) {
      new_range = [Math.ceil(xScale.invert(event.selection[0])), Math.floor(xScale.invert(event.selection[1]))]
      if (new_range[0] != year_range[0] || new_range[1] != year_range[1]){
        year_range = new_range;
        filteredData = globalData.filter(d => d.Year >= year_range[0] && d.Year <= year_range[1]);
        d3.select("#choropleth").selectAll("svg").remove();
        createChoroplethMap();
        d3.select("#parallelCoordinates").selectAll("svg").remove();
        createParallelCoordinates();
        d3.select("#streamGraph").selectAll("svg").remove();
        createStreamGraph();
        d3.select("#treeMap").selectAll("svg").remove();
        createTreeMap();
      }
    } else {
      year_range = [2010, 2019];
    }
  }
}

// Function to create the choropleth map
function createChoroplethMap() {
  currentData = getCountryAverageData(filteredData);

  const width = 300;

  if(!choroLegendCreated){ 
    // Create a title for the choropleth map
    const chartTitle = d3
    .select("#choroplethTitle")
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top)
    .style("color", "beige")
    .text("Average AQI Values per country");
  }
    
  // Create an SVG element to hold the map
  const svg = d3
    .select("#choropleth")
    .append("svg")
    .attr("width", width*1.45 + margin.left + margin.right)
    .attr("height", height*1.2 + margin.bottom)
    // .attr("style", "position: relative; left: 50%; transform: translateX(-50%); background-color: transparent white; width: -webkit-fill-available;")
    // .attr("style", `scale: 1.5`)
    ;

  // Create a group to hold the map elements
  const mapGroup = svg.append("g")
    .attr("transform", `translate(12.5, -100) scale(1.75)`)
    // .attr("style", `scale: 1.5`)
  ;

  // Create a color scale for the Total values
  const colorScale = d3
    .scaleLog()
    .domain([
      d3.min(currentData, (d) => d.Total),
      90,
    ])
    .range([0, 1]);

  // Create a projection to convert geo-coordinates to pixel values
  const projection = d3
    .geoMercator()
    .fitSize([width, height], globalDataCountries);

  // Create a path generator for the map
  const path = d3.geoPath().projection(projection);

  // Add countries as path elements to the map
  
  const tooltipContainer = d3
    .select("#choropleth")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "beige")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("border", "solid")
    .style("border-width", "2px")
    ;

  mapGroup
    .selectAll(".country")
    .data(globalDataCountries.features)
    .enter()
    .append("path")
    .attr("class", "choro data inactive")
    .attr("d", path)
    .attr("stroke", "steelblue")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 0.25)
    .attr("fill-opacity", 0.5)
    .attr("fill", "#fff0db")
    .on("click", function () { handleMouseClick; applyFilters();})
    ;
  mapGroup
    .selectAll(".country")
    .data(globalDataCountries.features)
    .enter()
    .append("path")
    .attr("class", "choro data active")
    .attr("id", "selectable")
    .attr("d", path)
    .attr("stroke", "steelblue")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 0.25)
    .attr("fill", "none")
    .attr("fill-opacity", 1)
    .attr("active", true)
    .on("click", handleMouseClick)
    ;


  // Set the fill color of each country based on its Total value
  currentData.forEach((element) => {
    mapGroup
      .selectAll(".active")
      .filter(function (d) {
        return d.properties.name == element.Country;
      })
      .attr("fill", function (d) {
        return element.Total != ".." && element.Total > 0 ? AQIcolorScale(colorScale(element.Total)) : "none";
      });
    mapGroup
      .selectAll(".inactive")
      .filter(function (d) {
        return d.properties.name == element.Country;
      })
      .attr("fill", function (d) {
        return element.Total != ".." && element.Total > 0 ? AQIcolorScale(colorScale(element.Total)) : "#fff0db";
      });
    mapGroup
      .selectAll(".choro.data")
      .filter(function (d) {
        return d.properties.name == element.Country;
      })
      .on("mouseover", (event, d) => {
        // console.log(d);
        tooltipContainer.transition().duration(200).style("opacity", 0.9);
        const tr = tooltipContainer//.html(d.properties.name + "\n aaa")
          .style("left", (event.pageX + 28) + "px")
          .style("top", (event.pageY) + "px")
          .append("table");
        tr.append("tr")
          .text(element.Country);
        if (element.Total > 0) {
          tr.append("tr")
            .text("AQI index: " + element.Total.toFixed(1));
        }
      })
      .on("mouseout", () => {
        tooltipContainer.transition().duration(500).style("opacity", 0);
        tooltipContainer.selectAll("table").remove();
      })
      ;
      // console.log(element.Total);
  });

  // Create zoom behavior for the map
  const zoom = d3
    .zoom()
    .scaleExtent([1.75, 8])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", zoomed);

  // Apply zoom behavior to the SVG element
  svg.call(zoom);

  // mapGroup.attr("transform", "translate(12.5, -100) scale(1.75)")

  // Function to handle the zoom event
  function zoomed(event) {
    mapGroup.attr("transform", event.transform);
  }

  if (!choroLegendCreated) {
    // Create a legend for the choropleth map
    const svg2 = d3
      .select("#choroplethLabel")
      .style("position", "relative")
      .append("svg")
      .attr("width", width * 0.15)
      .attr("height", height)
      .attr("transform", `translate(10, 0)`);
      ;

    // Create a gradient for the legend color scale
    const defs = svg2.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "colorScaleGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", AQIcolorScale(1));
      
      gradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", AQIcolorScale(0.5));
      
      gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", AQIcolorScale(0));

    // Create the legend rectangle filled with the color scale gradient
    const legend = svg2.append("g").attr("transform", `translate(0, 40)`);
    const legendHeight = height - 40;
    const legendWidth = 20;

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#colorScaleGradient)");

    // Add tick marks and labels to the legend
    for (let index = 0; index <= 1; index += 0.25) {
      legend
        .append("text")
        .attr("x", legendWidth + 5)
        .attr("y", legendHeight * (1-index) * 0.955 + 12)
        .style("fill", "beige")
        .text(Math.round(colorScale.invert(index)));
    }
  }
  choroLegendCreated = true;
}

function getCountryAverageData(data) {
  // average values of current data where same coutry but differente year
  const averageData = [];

  const temp = data.filter(d => d.Year >= year_range[0] && d.Year <= year_range[1]);

  countries = [];
  temp.forEach((element) => {
    if(!countries.includes(element.Country)){
      countries[element.Country] = [];
      countries[element.Country]["Cities"] = 0;
      countries[element.Country]["Cities_count"] = 0;
      countries[element.Country]["Towns"] = 0;
      countries[element.Country]["Towns_count"] = 0;
      countries[element.Country]["Urban"] = 0;
      countries[element.Country]["Urban_count"] = 0;
      countries[element.Country]["Rural"] = 0;
      countries[element.Country]["Rural_count"] = 0;
      countries[element.Country]["Total"] = 0;
      countries[element.Country]["Total_count"] = 0;
      countries[element.Country]["Total_Emissions"] = 0;
      countries[element.Country]["Total_Emissions_count"] = 0;
      countries[element.Country]["Age-standardized"] = 0;
      countries[element.Country]["Age-standardized_count"] = 0;
      countries[element.Country]["GDP"] = 0;
      countries[element.Country]["GDP_count"] = 0;
    }
  });

  temp.forEach((element) => {
    if(element.Cities != ".."){
      countries[element.Country]["Cities"] += element.Cities;
      countries[element.Country]["Cities_count"]++;
    }
    if(element.Towns != ".."){
      countries[element.Country]["Towns"] += element.Towns;
      countries[element.Country]["Towns_count"]++;
    }
    if(element.Urban != ".."){
      countries[element.Country]["Urban"] += element.Urban;
      countries[element.Country]["Urban_count"]++;
    }
    if(element.Rural != ".."){
      countries[element.Country]["Rural"] += element.Rural;
      countries[element.Country]["Rural_count"]++;
    }
    if(element.Total != ".."){
      countries[element.Country]["Total"] += element.Total;
      countries[element.Country]["Total_count"]++;
    }
    if(element.Total_Emissions != ".."){
      countries[element.Country]["Total_Emissions"] += element.Total_Emissions;
      countries[element.Country]["Total_Emissions_count"]++;
    }
    if(element["Age-standardized"] != ".."){
      countries[element.Country]["Age-standardized"] += element["Age-standardized"];
      countries[element.Country]["Age-standardized_count"]++;
    }
    if(element.GDP != ".."){
      countries[element.Country]["GDP"] += element.GDP;
      countries[element.Country]["GDP_count"]++;
    }
    countries[element.Country]["Continent"] = element.Continent;
  });

  // console.log(["countries",countries]);
  
  var ret = [];
  for (const country in countries) {
    var temp1 = [];
    temp1["Country"] = country;
    temp1["Continent"] = countries[country]["Continent"];
    temp1["Cities"] = countries[country]["Cities"]/countries[country]["Cities_count"];
    temp1["Towns"] = countries[country]["Towns"]/countries[country]["Towns_count"];
    temp1["Urban"] = countries[country]["Urban"]/countries[country]["Urban_count"];
    temp1["Rural"] = countries[country]["Rural"]/countries[country]["Rural_count"];
    temp1["Total"] = countries[country]["Total"]/countries[country]["Total_count"];
    temp1["Total_Emissions"] = countries[country]["Total_Emissions"]/countries[country]["Total_Emissions_count"];
    temp1["Age-standardized"] = countries[country]["Age-standardized"]/countries[country]["Age-standardized_count"];
    temp1["GDP"] = countries[country]["GDP"]/countries[country]["GDP_count"];
    ret.push(temp1);
  }
  
  // console.log(["ret",ret]);
  return ret;
}

function createParallelCoordinates() {
  // Filter the data to remove entries with missing values
  currentData = filteredData.filter(function (d) {
    return d.Cities !== ".." && d.Rural !== ".." && d.Urban !== ".." && d.Towns !== ".." && d["Total_Emissions"] !== "..";
  });

  averageData = getCountryAverageData(currentData);

  // Set the dimensions and margins of the graph
  const margin = { top: 30, right: 10, bottom: 10, left: 30 };
  const width = 600/1.75 - margin.left - margin.right;
  const height = 400*2.35 - margin.top - margin.bottom;
  const padding = 28, brush_width = 20;
  var filters = {};

  // Create a title for the choropleth map
  if (!paralellLegendCreated) {
    const chartTitle = d3
    .select("#parallelCoordinatesTitle")
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top)
    .style("color", "beige")
    .text("Region AQI Values per country");
    paralellLegendCreated = true;
  }

  // Append the SVG object to the body of the page
  const svg = d3
    .select("#parallelCoordinates")
    .append("svg")
    .attr("width", width*1.55 + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    // .attr("style", "position: relative; left: 50%; transform: translateX(-50%); background-color: transparent white; width: -webkit-fill-available;")
    .append("g")
    .attr("transform", `translate(-${height*0.1},${margin.top})`)
    ;

  // Extract the list of dimensions from the data
  const dimensions = ["Cities", "Urban", "Towns", "Rural"];

  // Create a scale for each dimension
  const yScale = {};

  for (const dim of dimensions) {
    yScale[dim] = d3
      .scaleLinear()
      .domain([0,100])
      .range([height, 0]);
  }

  const xVerticalScale = d3
    .scaleBand()
    .domain([0,100])
    .range([0, height])
    .padding(0.87);
    ;
  const xVerticalAxis2 = d3
    .scaleLinear()
    .domain([0,100])
    .range([0, height])
    ;

  // Build the X scale
  const xScale = d3.scalePoint().range([0, width]).padding(1).domain(dimensions);

  function histogram2(data, dim) {
    var histogram = d3.histogram()
    .value(function(d) { return d[dim]; })
    .domain(yScale[dim].domain())
    .thresholds(20);

    var bins = histogram(data);
    return bins;
  }

  var bins = [];
  for (const dim of dimensions) {
    // console.log(averageData);
    bins[dim] = histogram2(averageData, dim);
  }


  var yHistogramScales = []

  for (const dim of dimensions) {
    yHistogramScales[dim] = d3
      .scaleLinear()
      .domain([0, d3.max(bins[dim], d => d.length)])
      .range([0, 100]);
  }

  // Each brush generator
  const brushEventHandler = function (feature, event) {
    if (event.sourceEvent && event.sourceEvent.type === "zoom")
      return; // ignore brush-by-zoom
    if (event.selection != null) {
      filters[feature] = event.selection.map(d => yScale[feature].invert(d));
    } else {
      if (feature in filters)
        delete (filters[feature]);
    }
    applyFilters();
  }

  applyFilters = function () {

    function count_trues() {
      var count = 0;
      for (const d in country_selection) {
        if(country_selection[d] == true) count++;
      }
      return count;
    }

    d3.selectAll('.choro.data.active')
      .style('stroke-opacity', d => (selected(d) && (country_selection[d.properties.name] == true || count_trues() == 0) ? 1 : 0))
      .style('fill-opacity', d => (selected(d) && (country_selection[d.properties.name] == true || count_trues() == 0 ) ? 1 : 0))
      ;
    
    d3.selectAll('.parallel.data')
      .style('stroke-opacity', d => (selected(d) && ( country_selection[d.Country] == true || count_trues() == 0 ) ? 1 : 0))
      ;

    d3.selectAll('.treeMap.data')
      .style('fill-opacity', d => (selected(d) && ( country_selection[d.data.Country] == true || count_trues() == 0 ) ? 1 : 0.5))
      // .style('stroke-width', d => (selected(d) && ( country_selection[d.data.Country] == true || count_trues() == 0 ) ? 2 : 0))
      ;

    averageData.forEach((element) => {
      if(selected(element) && ( country_selection[element.Country] == true || count_trues() == 0 )){
        element.selected = true;
      } else {
        element.selected = false;
      }
    });

    d3.selectAll(".bar.data").remove();

    // console.log(averageData.filter( d => d.selected == true));

    d3.select("#streamGraph").selectAll("svg").remove();
    createStreamGraph();

    
    var counter = 1;
    for (const dim of dimensions) {

      var temp_scales = [];

      temp_scales[dim] = d3
        .scaleLinear()
        .domain([0, d3.max(histogram2(averageData.filter( d => d.selected == true), dim), d => d.length)])
        .range([0, 100]);

      yAxis[dim]
        .append("g").attr('class', 'bars')
        .attr("style", `transform: rotate(-90deg) translate(-${height}px, ${width/2.5 * counter}px);`)
        .selectAll(".rect")
        .data(histogram2(averageData.filter( d => d.selected == true), dim))
        .enter()
        .append("rect")
        .attr("class", "bar data")
        
        .attr("x", (d) => xVerticalAxis2(d.x0))
        .attr("y", 0)
        
        .attr("width", xVerticalScale.bandwidth())
        .attr("height", (d) => temp_scales[dim](d.length))
        
        .attr("fill", "beige")
        .attr("fill-opacity", 0.2)
        .attr("stroke", "beige")
        .attr("stroke-width", 1.5)
        .text((d) => d.title);
      counter++;
    }
  }
    
  selected = function (d) {

    if(d.properties != undefined){
      var country = d.properties.name;
      var data = averageData.filter(d => d.Country == country);
      
      d = data[0];
      if(d == undefined) return false;
    } else {
      if(d.Country == undefined){
        d = d.data;
        // console.log(d);
      }
    }

    const _filters = Object.entries(filters);
    return _filters.every(f => {
      // console.log([d,f[1][1] <= d[f[0]] && d[f[0]] <= f[1][0]]);
      return f[1][1] <= d[f[0]] && d[f[0]] <= f[1][0];
    });
  }


  const yBrushes = {};
  Object.entries(yScale).map(x => {
    let extent = [
      [-(brush_width / 2), 0],
      [brush_width / 2, height]
    ];
    yBrushes[x[0]] = d3.brushY()
      .extent(extent)
      .on("start brush end",(a)=> brushEventHandler(x[0], a))
      ;
  });

  // Create the path function
  const path = (d) => d3.line()(dimensions.map((p) => [xScale(p), yScale[p](d[p])]));


  // console.log(bins);
  




  // Inactive data
  svg.append('g').attr('class', 'inactive').selectAll('path')
    .data(averageData)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('stroke', (d) => AQIcolorScale((d.Cities+d.Towns+d.Urban+d.Rural)/d3.max(averageData, d => (d.Cities+d.Towns+d.Urban+d.Rural))))
    .attr("stroke-opacity", 0.25)
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .style("transform", "scale(2,1)")
    .append("title")
    .text((d) => d.Country)
    ;
  
  yAxis = [];
  for (const dim of dimensions) {
    yAxis[dim] = svg
      .append("g")
      .attr("class", "yAxis")
      .style("fill", "beige")
      ;
  }

  var counter = 1;
  for (const dim of dimensions) {
    yAxis[dim]
      .append("g").attr('class', 'bars')
      .attr("style", `transform: rotate(-90deg) translate(-${height}px, ${width/2.5 * counter}px);`)
      .selectAll(".rect")
      .data(bins[dim])
      .enter()
      .append("rect")
      .attr("class", "bar data")
      
      .attr("x", (d) => xVerticalAxis2(d.x0))
      .attr("y", 0)
      // .attr("country list", (d) => d.)
      .attr("length", (d) => d.length)
      
      .attr("width", xVerticalScale.bandwidth())
      .attr("height", (d) => yHistogramScales[dim](d.length))
      
      .attr("fill", "beige")
      .attr("fill-opacity", 0.2)
      .attr("stroke", "beige")
      .attr("stroke-width", 1.5)
      .text((d) => d.title);
    counter++;
  }

  // add tooltip
  const tooltipContainer = d3
    .select("#parallelCoordinates")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "beige")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("border", "solid")
    .style("border-width", "2px")
    ;

  // Active data
  svg.append('g').attr('class', 'active').selectAll('path')
    .data(averageData)
    .enter()
    .append('path')
    .attr("class", "parallel data")
    .attr("id", "selectable")
    .attr('d', path)
    .attr('stroke', (d) => AQIcolorScale((d.Cities+d.Towns+d.Urban+d.Rural)/d3.max(averageData, d => (d.Cities+d.Towns+d.Urban+d.Rural))))
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .style("transform", "scale(2,1)")
    .on("mouseover", (event, d) => {
      // console.log(d);
      tooltipContainer.transition().duration(200).style("opacity", 0.9);
      const tr = tooltipContainer//.html(d.properties.name + "\n aaa")
        .style("left", (event.pageX + 28) + "px")
        .style("top", (event.pageY) + "px")
        .append("table");
      tr.append("tr")
        .text(d.Country);
      tr.append("tr")
        .text("Cities: " + d.Cities.toFixed(1));
        tr.append("tr")
          .text("Urban: " + d.Urban.toFixed(1));
      tr.append("tr")
        .text("Towns: " + d.Towns.toFixed(1));
      tr.append("tr")
        .text("Rural: " + d.Rural.toFixed(1));
    })
    .on("mouseout", () => {
      tooltipContainer.transition().duration(500).style("opacity", 0);
      tooltipContainer.selectAll("table").remove();
    })
    ;

  // Vertical axis for the features
  const featureAxisG = svg.selectAll('g.feature')
    .data(dimensions)
    .enter()
    .append('g')
    .attr('class', 'feature')
    .attr('transform', d => ('translate(' + xScale(d)*2 + ',0)'))
    .style("fill", "beige")
    .style("color", "beige")
    .style("stroke-width", 1.5)
    ;

  featureAxisG
    .append('g')
    .each(function (d) {
      d3.select(this).call(d3.axisLeft().scale(yScale[d]));

    });

  featureAxisG
  .each(function(d){
    d3.select(this)
      .append('g')
      .attr('class','brush')
      .call(yBrushes[d]);
  });

  featureAxisG
  .append("text")
  .attr("text-anchor", "middle")
  .attr('y', padding/2)
  .attr("transform", "translate(0,-25)")
  .text(d=>d);



}

function createTreeMap() {
  var currentData = getCountryAverageData(filteredData.filter(d => d["Age-standardized"] != ".."));
  // currentData.forEach((element) => {
  //   if(element.Country == "United States of America"){
  //     element.Country = "United States";
  //   }
  // });
  // console.log(currentData);

  // set the dimensions and margins of the graph
  const margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 445+125 - margin.left - margin.right,
    height = 445+75 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3.select("#treeMap")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",`translate(${margin.left}, ${margin.top})`);

  // console.log(currentData.filter(d => {d["Age-standardized"] != ".."; console.log(d.Continent)}));

  const temp = [];
  temp["children"] = [];
  const  continents = ["North America", "South America", "Africa", "Europe", "Oceania", "Asia"];
  for (const i in continents) {
    temp["children"][temp["children"].length] = [];
    temp["children"][temp["children"].length-1]["children"] = currentData.filter(d => d["Age-standardized"] != ".." && d.Continent == continents[i]);
    temp["children"][temp["children"].length-1]["name"] = continents[i];
  }
  // temp["children"] = currentData.filter(d =>  {d["Age-standardized"] != ".."; console.log(d.Continent)});

  // Give the data to this cluster layout:
  const root = d3.hierarchy(temp).sum(function(d){ return d.GDP**1}) // Here the size of each leave is given in the 'value' field in input data
  // console.log(["real", currentData, temp, root]);
  

  // read json data
  // d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_dendrogram_full.json").then( function(data) {
  //   // Give the data to this cluster layout:
  //   const root = d3.hierarchy(data).sum(function(d){ return d.value}) // Here the size of each leave is given in the 'value' field in input data
  //   console.log(["test", data, root]);
  // });

  // Then d3.treemap computes the position of each element of the hierarchy
  d3.treemap()
    .tile(d3.treemapBinary)
    .size([width, height])
    .paddingTop(5)
    .paddingRight(5)
    .paddingInner(1)      // Padding between each rectangle
    //.paddingOuter(6)
    //.padding(20)
    (root)

  // prepare a color scale
  const color = d3.scaleOrdinal()
    // .domain(["boss1", "boss2", "boss3"])
    .range(["cyan", "red", "orange", "black", "yellow", "lightgreen"])
  
  // And a opacity scale
  const opacity = d3.scaleLinear()
    .domain([d3.min(currentData, (d) => d["Age-standardized"])**0.5, d3.max(currentData, (d) => d["Age-standardized"])**0.5])
    .range([0,1])


    if (!treeLegendCreated) {
      // Create a legend for the choropleth map
      const svg2 = d3
        .select("#treeMapLabel")
        .style("position", "relative")
        .append("svg")
        .attr("width", width * 0.1)
        .attr("height", height)
        ;
  
      // Create a gradient for the legend color scale
      const defs = svg2.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "colorScaleGradient2")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
  
      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.interpolateRgbBasis(["beige", "#a20"])(1));
        
      gradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", d3.interpolateRgbBasis(["beige", "#a20"])(0.5));
      
      gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.interpolateRgbBasis(["beige", "#a20"])(0));
  
      // Create the legend rectangle filled with the color scale gradient
      const legend = svg2.append("g").attr("transform", `translate(0, 40)`);
      const legendHeight = height - 40;
      const legendWidth = 20;
  
      legend
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#colorScaleGradient2)");
      
      // Add tick marks and labels to the legend
      for (let index = 0; index <= 1; index += 0.25) {
        legend
          .append("text")
          .attr("x", legendWidth + 5)
          .attr("y", legendHeight * (1-index) * 0.955 + 12)
          .style("fill", "beige")
          .text(Math.round(opacity.invert(index)**2));
      }
    }
    treeLegendCreated = true;
  


  // add tooltip
  const tooltipContainer = d3
    .select("#parallelCoordinates")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "beige")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("border", "solid")
    .style("border-width", "2px")
    ;

  const squares = svg
    .append('g')
    .attr("transform", "translate(0,20)")



  // use this information to add rectangles:
  squares
    .selectAll("rect")
    .data(root.leaves())
    .join("rect")
      .attr("class", "treeMap data")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .attr("aaa", function(d){ return d.data["Age-standardized"] })
      .style("stroke", "beige")
      .style("stroke-width", 0)

      // .style("fill", function(d){ return color(d.data.Continent)} )
      // .style("opacity", function(d){ return opacity(d.data.GDP**0.2)})
      
      .style("fill", function(d){ return (d3.interpolateRgbBasis(["beige", "#a20"])(opacity(d.data["Age-standardized"]**0.5) )) } )

      // .text(function(d){ return (d.data.Country + " " + d.data.Continent) })
      .on("mouseover", (event, d) => {
        // console.log(d);
        tooltipContainer.transition().duration(200).style("opacity", 0.9);
        const tr = tooltipContainer//.html(d.properties.name + "\n aaa")
          .style("left", (event.pageX + 28) + "px")
          .style("top", (event.pageY) + "px")
          .append("table");
        tr.append("tr")
          .text(d.data.Country + ", " + d.data.Continent);
        tr.append("tr")
          .text("GDP: " + (d.data.GDP / 1000000000000 > 1 ?  d3.format(".1f")(d.data.GDP / 1000000000000) + "B" : d3.format(".1f")(d.data.GDP / 1000000) + "M"));
        tr.append("tr")
          .text("Deaths: " + d.data["Age-standardized"].toFixed(1));
      })
      .on("mouseout", () => {
        tooltipContainer.transition().duration(500).style("opacity", 0);
        tooltipContainer.selectAll("table").remove();
      })
      .on("click", handleMouseClick)


  function countryToSize(d) {
    const width = (d.x1 - d.x0)**0.5;
    const height = (d.y1 - d.y0)**0.5;

    const width_ratio = width /// d.data.Country.length;

    const res = width_ratio * height * 0.13;

    if(d.data.Country == "United States" || d.data.Country == "Canada"){
      // console.log([d.data.Country, width_ratio, height, res]);
    }

    return res;

    
  }
  // and to add the text labels
  squares
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0 + 10 + (countryToSize(d))/1.3})    // +20 to adjust position (lower)
      .text(function(d){ 
        if((countryToSize(d)) > 7){
          if (d.data.Country == "United States of America") return "United States";
          return d.data.Country; 
        } else return ""
      })
      // .attr("aaa", function(d){ return d.data["Age-standardized"] })
      .attr("font-size", d => (countryToSize(d)) + "px")
      .attr("fill", "#620")

  // and to add the text labels
  svg
    .selectAll("vals")
    .data(root.leaves())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+35})    // +20 to adjust position (lower)
      // .text(function(d){ return d.data["Age-standardized"] })
      .attr("font-size", "11px")
      .attr("fill", "beige")

  // // Add title for the 3 groups
  // svg
  //   .selectAll("titles")
  //   .data(root.descendants().filter(function(d){return d.depth==1}))
  //   .enter()
  //   .append("text")
  //     .attr("x", function(d){ return d.x0})
  //     .attr("y", function(d){ return d.y0+21})
  //     .text(function(d){ return d.data.name })
  //     .attr("font-size", "19px")
  //     .attr("fill",  function(d){ return color(d.data.name)} )

  // Add title for the 3 groups
  svg
    .append("text")
      .attr("x", 0)
      .attr("y", 14)    // +20 to adjust position (lower)
      .text("GDP and deaths caused by air pollution per country")
      .attr("font-size", "19px")
      .attr("fill",  "beige" )

}

function createStreamGraph() {
// set the dimensions and margins of the graph
const margin = {top: 20, right: 30, bottom: 0, left: 10},
    width = 1200,
    height = 450;

// append the svg object to the body of the page
const svg = d3.select("#streamGraph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

  
  
  
  // // Parse the Data
  // d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered_wide.csv").then(function(data) {
    
  // // List of groups = header of the csv files
  // var keys = data.columns.slice(1)
  // console.log(["test", data]);
    
  var keys = ["Agriculture", "Waste", "Industry", "Manufacturing_and_construction", "Transport", "Electricity_and_heat", "Buildings", "Fugitive_emissions", "Other_fuel_combustion", "Aviation_and_shipping"]

  const convert = function(data) {
    years = [];
    var count = 0;
    data.forEach((element) => {
      const year = element.Year - year_range[0];
      if(years[year] == undefined){
        years[year] = {"Year": element.Year};
        keys.forEach((key) => {
          years[year][key] = 0;
        });
        years[year]["countries"] = [];
      }
      keys.forEach((key) => {
        if(element[key] != ".." && (country_selection.length == 0 || country_selection[element.Country] == true)){
          // console.log(element.Country);
          // console.log([country_selection.length == 0, country_selection[element.Country] == true])
          years[year][key] += element[key];// * (year+20)*0.04;
          years[year]["countries"].push(element.Country);
          count++;
        }
      });
    });
    years.forEach((element) => {
      keys.forEach((key) => {
        element[key] /= count;
      });
    });
    return years;

  }

  const tempData =  filteredData.filter(d => selected(d))

  
  data = convert(tempData);
  // console.log(["test", data]);
  data["columns"] = keys;
  
  // console.log(["real", data, country_selection]);

  // Add X axis
  const x = d3.scaleLinear()
    .domain(year_range)
    .range([ width*0.01, width*0.8 ]);
  svg.append("g")
    .attr("transform", `translate(0, ${height*0.8})`)
    // .call(d3.format(".0f")(x).tickSize(-height*0.6).tickFormat(""))
    .call(d3.axisBottom(x).tickSize(-height*.7).tickValues([2010,2011,2012,2013,2014,2015,2015,2016,2017,2018,2019]).tickFormat(d3.format(".0f")))
    .select(".domain").remove()
  // Customization
  svg.selectAll(".tick line").attr("stroke", "#b8b8b8")

  svg.selectAll("text")
    .attr("fill", "beige")

  // Add X axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width/2)
      .attr("y", height-50 )
      .attr("fill", "beige")
      .text("Time (year)");

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([-d3.max(data, d => d3.sum(keys, k => +d[k])), d3.max(data, d => d3.sum(keys, k => +d[k]))])
    // .domain([-20000000, 20000000])
    .range([ height, 0 ]);

  var temp = d3.schemeSet3;
  temp[5] = "#d9f";
  temp = ["#F2D2BD", "#FF7F50", "#F88379", "#AA336A", "#FFB6C1", "#F3CFC6", "#FAA0A0", "#A95C68"];  

  // color palette
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(temp /* schemeSet3  schemePastel1 */);

  // console.log(d3.schemeSet3);
  
  const colorLegend =  svg.append("g")
    .attr("class", "colorLegend")
    .attr("transform", `translate(${width*0.81}, 0)`);

  var count = keys.length;
  keys.forEach((key, i) => {
    colorLegend
      .append("rect")
      .attr("y", count * 24 + 90)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color(key))
      ;
  
    colorLegend.append("text")
      .attr("x", 15)
      .attr("y", count * 24 + 100)
      .attr("fill", "beige")
      .attr("class", "myArea")
      .attr("id", function (d) { return key })
      .text(keys[i].replace(/_/g, ' '));
      
    
    count--;
  });


  //stack the data?
  const stackedData = d3.stack()
    .offset(d3.stackOffsetSilhouette)
    .keys(keys)
    (data)

  const tooltipContainer = d3
    .select("#streamGraph")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "beige")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("border", "solid")
    .style("border-width", "2px")
    ;

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function(event,d) {
    d3.selectAll(".myArea").style("opacity", .2)
    d3.selectAll(".myArea").style("opacity", .2)
    d3.selectAll("#"+d.key)
      // .style("stroke", "black")
      .style("opacity", 1);
    tooltipContainer.transition().duration(200).style("opacity", 0.9);
    const tr = tooltipContainer//.html(d.properties.name + "\n aaa")
      .style("left", (event.pageX + 28) + "px")
      .style("top", (event.pageY) + "px")
      .append("table");
    tr.append("tr")
      .text(d.key.replace(/_/g, ' '));
    tr.append("tr")
      .text(year_range[0] + ": " + d[0].data[d.key]);
    tr.append("tr")
      .text( year_range[1] + ": " + d[d.length-1].data[d.key]);
    
    
      
  }
  const mousemove = function(event,d,i) {
    grp = d.key
  }
  const mouseleave = function(event,d) {
    d3.selectAll("#"+d.key).style("opacity", 1).style("stroke", "none")
    d3.selectAll("#"+d.key).style("stroke", "none").style("opacity", 1)
    d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
    d3.selectAll(".myArea").style("stroke", "none").style("opacity", 1)
    tooltipContainer.transition().duration(500).style("opacity", 0);
    tooltipContainer.selectAll("table").remove();

   }

  // Area generator
  const area = d3.area()
    .x(function(d) { return x(d.data.Year); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })

  // Show the areas
  svg
    .selectAll("mylayers")
    .data(stackedData)
    .join("path")
      .attr("class", "myArea")
      .attr("id", function (d) { return d.key })
      .style("fill", function(d) { return color(d.key); })
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      // .on("mouseover", (event, d) => {
      //   // console.log(d);
      //   tooltipContainer.transition().duration(200).style("opacity", 0.9);
      //   const tr = tooltipContainer//.html(d.properties.name + "\n aaa")
      //     .style("left", (event.pageX + 28) + "px")
      //     .style("top", (event.pageY) + "px")
      //     .append("table");
      //   tr.append("tr")
      //     .text(element.Country);
      //   if (element.Total > 0) {
      //     tr.append("tr")
      //       .text("AQI index: " + element.Total.toFixed(1));
      //   }
      // })
      // .on("mouseout", () => {
      //   tooltipContainer.transition().duration(500).style("opacity", 0);
      //   tooltipContainer.selectAll("table").remove();
      // })

// })
}
