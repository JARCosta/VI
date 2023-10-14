// Declare global variables to hold data for countries and capita
var globalDataCountries;
var globalData;
var filteredData;
var country_selection = [];
var applyFilters;

var year_range = [2010, 2019];


var parallelColorScale;


var choroLegendCreated = false;

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
    // createChoroplethMap();
    // createParallelCoordinates();
    // createTreeMap();
    // createStreamGraph();
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
    const totalEmissions = element.Total_Emissions;

    const index = averageData.findIndex((d) => d.Year == year);

    if(cities == "..") {
      cities = 0;
    }
    if (index == -1) {
      averageData.push({
        Year: year,
        Cities: cities,
        Towns: towns,
        Urban: urban,
        Rural: rural,
        Total_Emissions: totalEmissions,
      });
    }
    else {
      if (cities != ".." && cities != NaN) {
        averageData[index].Cities = (averageData[index].Cities + cities)/2;
      }
      if (towns != "..") {
        averageData[index].Towns = (averageData[index].Towns + towns)/2;
      }
      if (urban != "..") {
        averageData[index].Urban = (averageData[index].Urban + urban)/2;
      }
      if (rural != "..") {
        averageData[index].Rural = (averageData[index].Rural + rural)/2;
      }
      if(totalEmissions != ".."){
        averageData[index].Total_Emissions = (averageData[index].Total_Emissions + totalEmissions)/2;
      }
    }
  });
  return averageData;
}


function createLineShart() {
  currentData = getYearAverageData(globalData)

  var filters = {};
  // console.log(currentData);

  const svg = d3
    .select("#lineChart")
    .append("svg")
    .attr("width", 820)
    .attr("height", 40)
    ;
  
  const xScale = d3.scaleLinear()
    .domain([d3.min(currentData, (d) => d.Year), d3.max(currentData, (d) => d.Year)])
    .range([15, 800]);
  
  const yScale = d3.scaleLinear()
    .domain([d3.min(currentData, (d) => d["Total_Emissions"]), d3.max(currentData, (d) => d["Total_Emissions"])])
    .range([30, 3]);
  
  const line = d3.line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d["Total_Emissions"]))
    ;


  const path = svg
    .append("g")
    .attr("class", "line")
    .append("path")
    .datum(currentData)
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    ;
  
  const years = svg
    .append("g")
    .attr("class", "years")
    .selectAll("text")
    .data(currentData)
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.Year))
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text((d) => d.Year)
    .attr("fill", "black")
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
      year_range =  event.selection.map(d => xScale.invert(d));
      filteredData = globalData.filter(d => d.Year >= year_range[0] && d.Year <= year_range[1]);
      d3.select("#choropleth").selectAll("svg").remove();
      createChoroplethMap();
      d3.select("#parallelCoordinates").selectAll("svg").remove();
      createParallelCoordinates();
      d3.select("#streamGraph").selectAll("svg").remove();
      createStreamGraph();
      d3.select("#treeMap").selectAll("svg").remove();
      createTreeMap();
    } else {
      year_range = [2010, 2019];
    }
  }
}

// Function to create the choropleth map
function createChoroplethMap() {
  currentData = filteredData;
  // console.log(currentData);

  if(!choroLegendCreated){ 
    // Create a title for the choropleth map
    const chartTitle = d3
    .select("#choroplethTitle")
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top)
    .text("Average AQI Values per country");
  }
    
  // Create an SVG element to hold the map
  const svg = d3
    .select("#choropleth")
    .append("svg")
    .attr("width", width*1.6 + margin.left + margin.right)
    .attr("height", height + margin.bottom)
    .attr("style", "position: relative; left: 50%; transform: translateX(-50%); background-color: transparent white; width: -webkit-fill-available;")
    ;

  // Create a group to hold the map elements
  const mapGroup = svg.append("g")
    .attr("transform", `translate(${margin.left*0.1},-${margin.top*1})`)
    .attr("style", `scale: 1.5`)
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
    .on("click", handleMouseClick)
    .append("title")
    .text((d) => d.properties.name);

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
    .attr("fill-opacity", 1)
    .attr("active", true)
    .on("click", handleMouseClick)
    .append("title")
    .text((d) => d.properties.name);
  



  // Set the fill color of each country based on its Total value

  
  
  mapGroup
    .selectAll(".inactive")
    .attr("fill", "#fff0db");
  mapGroup
    .selectAll(".active")
    .attr("fill", "#fff0db");
  
  
  currentData.forEach((element) => {
    mapGroup
      .selectAll(".active")
      .filter(function (d) {
        return d.properties.name == element.Country;
      })
      .attr("fill", function (d) {
        return element.Total != ".." ? d3.interpolateRgbBasis(["lightgreen", "yellow", "red"])(colorScale(element.Total)) : "#fff0db";
      });
      // console.log(element.Total);
  });

  // Create zoom behavior for the map
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    // .translateExtent([
    //   [0, width],
    //   [height*1.8, 0],
    // ])
    .on("zoom", zoomed);

  // Apply zoom behavior to the SVG element
  svg.call(zoom);

  // Function to handle the zoom event
  function zoomed(event) {
    mapGroup.attr("transform", event.transform);
  }

  if (!choroLegendCreated) {
    // Create a legend for the choropleth map
    const svg2 = d3
      .select("#choroplethLabel")
      .append("svg")
      .attr("width", width * 0.2)
      .attr("height", height);

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
      .attr("stop-color", d3.interpolateRgbBasis(["lightgreen", "yellow", "red"])(0));
    
    gradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", d3.interpolateRgbBasis(["lightgreen", "yellow", "red"])(0.5));

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.interpolateRgbBasis(["lightgreen", "yellow", "red"])(1));

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
        .attr("y", legendHeight * index)
        .text(Math.round(colorScale.invert(index)));
    }
  }
  choroLegendCreated = true;
}

function getCountryAverageData(data) {
  // average values of current data where same coutry but differente year
  const averageData = [];

  const temp = data.filter(d => d.Year >= year_range[0] && d.Year <= year_range[1]);

  temp.forEach((element) => {
    const country = element.Country;
    const cities = element.Cities;
    const towns = element.Towns;
    const urban = element.Urban;
    const rural = element.Rural;
    const totalEmissions = element.Total_Emissions;

    const index = averageData.findIndex((d) => d.Country == country);

    if (index == -1) {

      averageData.push({
        Country: country,
        Cities: cities,
        Towns: towns,
        Urban: urban,
        Rural: rural,
        Total_Emissions: totalEmissions,
      });
    }
    else {
      averageData[index].Cities = (averageData[index].Cities + cities)/2;
      averageData[index].Towns = (averageData[index].Towns + towns)/2;
      averageData[index].Urban = (averageData[index].Urban + urban)/2;
      averageData[index].Rural = (averageData[index].Rural + rural)/2;
      if(totalEmissions != ".."){
        averageData[index].Total_Emissions = (averageData[index].Total_Emissions + totalEmissions)/2;
      }
    }
  });
  // console.log(averageData);
  return averageData;
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
  const dimensions = ["Cities", "Towns", "Urban", "Rural"];

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
      .style('stroke-opacity', d => (selected(d) && ( country_selection[d.Country] == true || count_trues() == 0 ) ? 1 : 0));
    
  }
    
  const selected = function (d) {

    if(d.properties != undefined){
      var country = d.properties.name;
      // console.log(country);
      var data = averageData.filter(d => d.Country == country);
      
      d = data[0];
      if(d == undefined) return false;
    }

    const _filters = Object.entries(filters);
    return _filters.every(f => {
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
  



  const colorScale = d3.interpolateRgbBasis(["lightgreen", "yellow", "red"])
  ;


  // Inactive data
  svg.append('g').attr('class', 'inactive').selectAll('path')
    .data(averageData)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('stroke', 'lightgrey')
    .attr("stroke-opacity", 0.25)
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .style("transform", "scale(2,1)")
    .append("title")
    .text((d) => d.Country)
    ;
  
  // Active data
  svg.append('g').attr('class', 'active').selectAll('path')
    .data(averageData)
    .enter()
    .append('path')
    .attr("class", "parallel data")
    .attr("id", "selectable")
    .attr('d', path)
    .attr('stroke', (d) => colorScale((d.Cities+d.Towns+d.Urban+d.Rural)/d3.max(averageData, d => (d.Cities+d.Towns+d.Urban+d.Rural))))
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .style("transform", "scale(2,1)")
    .append("title")
    .text((d) => d.Country)
    ;
  
  // Vertical axis for the features
  const featureAxisG = svg.selectAll('g.feature')
    .data(dimensions)
    .enter()
    .append('g')
    .attr('class', 'feature')
    .attr('transform', d => ('translate(' + xScale(d)*2 + ',0)'))
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

  yAxis = [];
  for (const dim of dimensions) {
    yAxis[dim] = svg
      .append("g")
      .attr("class", "yAxis")
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
      
      .attr("fill", "lightgrey")
      .attr("fill-opacity", 0.2)
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .text((d) => d.title);
    counter++;
  }

}

function createTreeMap() {
  currentData = getCountryAverageData(filteredData)

  const width = 400;
  const height = 400;

  // Create an SVG element to hold the tree map
  const svg = d3
    .select("#treeMap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${0},${0})`);



  // // Create main background rectangles
  // svg
  //   .append("rect")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("fill", "white")
  //   .attr("fill-opacity", 0.25)
  //   ;
}

function createStreamGraph() {
  currentData = getCountryAverageData(filteredData)

  const width = 600;
  const height = 400;

  // Create an SVG element to hold the tree map
  const svg = d3
    .select("#streamGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${0},${0})`);



  // // Create main background rectangles
  // svg
  //   .append("rect")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("fill", "white")
  //   .attr("fill-opacity", 0.25)
  //   ;
}
