// Declare global variables to hold data for countries and capita
var globalDataCountries;
var globalDataCapita;
var globalData;
const yearColorScale = d3.scaleSequential(d3.interpolateBlues)
  .domain([2010, 2019])
  .range(["#ffffff", "#08306b"]);
  // .range(["#dddd00", "#08306b"]);
  ;


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
    
    // Store the CSV data into globalDataCapita
    globalDataCapita = results[1];
    globalData = results[2];

    // Convert incomeperperson and alcconsumption data to numbers
    globalDataCapita.forEach(function (d) {
      d.incomeperperson = +d.incomeperperson;
      d.alcconsumption = +d.alcconsumption;
    });
    
    // Call functions to create the choropleth map and scatter plot
    createYearFilter();
    createChoroplethMap();
    createTernaryPlot();
    createParallelCoordinates();
    createScatterPlot();
    createTreeMap();
    // createClevelandDotPlot();
  });
}

function createYearFilter() {
  currentData = globalData

  // Create a legend for the choropleth map
  const svg2 = d3
    .select("#yearSelector")
    .append("svg")
    // .attr("width", width)
    .attr("height", 30)
    .attr("width", width + margin.left + margin.right)
    .attr("style", "position: relative; left: 50%; transform: translateX(-50%); background-color: transparent burlywood;")
    ;


  // Create a gradient for the legend color scale
  const defs = svg2.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "horizontalColorScaleGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", d3.interpolateBlues(0));

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d3.interpolateBlues(1));


  // // Create the legend rectangle filled with the color scale gradient
  const legend = svg2.append("g")
  // .attr("width", "-webkit-fill-available")
  ;//.attr("transform", `translate(0, 40)`);
  const legendHeight = 30;
  const legendWidth = width;

  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("x", legendWidth/8)
    .style("fill", "url(#horizontalColorScaleGradient)")
    .attr("stroke", yearColorScale(2019))
    .attr("stroke-width", 2)
    ;

  // Create a color scale for the Year values
  const colorScale = d3
    .scaleLog()
    .domain([
      d3.min(currentData, (d) => d.Year),
      d3.max(currentData, (d) => d.Year),
    ])
    .range([0, 1]);

  // Add tick marks and labels to the legend
  for (let index = 0; index <= 1; index += 0.25) {
    legend
      .append("text")
      .attr("x", legendWidth * index + legendWidth/10)
      .attr("y", legendHeight*0.75)
      .text(Math.round(colorScale.invert(index)));
  } 
}


// Function to create the choropleth map
function createChoroplethMap() {
  // Filter the data to remove entries with missing incomeperperson values
  currentData = globalDataCapita.filter(function (d) {
    return d.incomeperperson != "";
  });
  currentData = globalData;
  // console.log(currentData)

  // Create a title for the choropleth map
  const chartTitle = d3
    .select("#choroplethTitle")
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top)
    .text("Income per person");
    
  // Create an SVG element to hold the map
  const svg = d3
    .select("#choropleth")
    .append("svg")
    .attr("width", width*1.3 + margin.left + margin.right)
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
      d3.max(currentData, (d) => d.Total),
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
    .attr("id", "inactive")
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
    .attr("id", "active")
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

function getYearAverageData(data) {
  // average values of current data where same coutry but differente year
  const averageData = [];
  data.forEach((element) => {
    const country = element.Country;
    const cities = element.Cities;
    const towns = element.Towns;
    const urban = element.Urban;
    const rural = element.Rural;
    const totalEmissions = element["Total Emissions"];

    const index = averageData.findIndex((d) => d.Country == country);

    if (index == -1) {

      averageData.push({
        Country: country,
        Cities: cities,
        Towns: towns,
        Urban: urban,
        Rural: rural,
        "Total emissions": totalEmissions,
      });
    }
    else {
      averageData[index].Cities = (averageData[index].Cities + cities)/2;
      averageData[index].Towns = (averageData[index].Towns + towns)/2;
      averageData[index].Urban = (averageData[index].Urban + urban)/2;
      averageData[index].Rural = (averageData[index].Rural + rural)/2;
      averageData[index]["Total emissions"] = (averageData[index]["Total emissions"] + totalEmissions)/2;
    }
  });
  // console.log(averageData.filter(d => d.Country == "Russia"));
  return averageData;
}

function createParallelCoordinates() {
  // Filter the data to remove entries with missing values
  currentData = globalData.filter(function (d) {
    return d.Cities !== ".." && d.Rural !== ".." && d.Urban !== ".." && d.Towns !== ".." && d["Total Emissions"] !== "..";
  });

  averageData = getYearAverageData(currentData);

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
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", "-webkit-fill-available")
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
      .domain([0,90])
      .range([height, 0]);
  }

  const xVerticalScale = d3
    .scaleBand()
    .domain([0,90])
    .range([0, height])
    .padding(0.845);
    ;
  const xVerticalAxis2 = d3
    .scaleLinear()
    .domain([0,90])
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

  // var histogram = d3.histogram()
  // .value(function(d) { return d["Cities"]; })
  // .domain(yScale["Cities"].domain())
  // .thresholds(10);

  // And apply this function to data to get the bins

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

  // const yHistogramScale = d3
  //     .scaleLinear()
  //     .domain([0, d3.max(bins, d => d.length)])
  //     .range([0, 100]);




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
    console.log(filters)
    applyFilters();
  }

  const applyFilters = function () {

    d3.selectAll('.choro.data.active')
      .style('stroke-opacity', d => (selected(d) ? 1 : 0))
      .style('fill-opacity', d => (selected(d) ? 1 : 0))
      ;
    
    d3.selectAll('.parallel.data')
      .style('stroke-opacity', d => (selected(d) ? 1 : 0));
    
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

function createTernaryPlot() {
  currentData = globalData.filter(function (d) {
    return d.Cities !== ".." && d.Rural !== ".." && d.Urban !== ".." && d.Towns !== "..";
  });

  // Create an SVG element to hold the ternary plot
  const svg = d3
    .select("#ternaryPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("style", "position: relative; left: 50%; transform: translateX(-50%); background-color: transparent white;")

  markers = svg
    .append("g")
    .attr("transform", `translate(${margin.left/1.6},${margin.top*1.75})`);
  
  overlay = svg
    .append("g")
    .attr("transform", `translate(${margin.left/1.6},${margin.top*1.75})`);

  // Create zoom behavior for the map
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", zoomed);

  // Apply zoom behavior to the SVG element
  svg.call(zoom);

  // Function to handle the zoom event
  function zoomed(event) {
    markers.attr("transform", event.transform);
  }


  // Define the vertices of the ternary plot triangle
  const vertices = [
    { x: 0, y: height },
    { x: width, y: height },
    { x: width / 2, y: 0 },
  ];

  // Create a ternary scale for the triangle vertices
  const ternaryScale = d3
    .scaleLinear()
    .domain([0, width])
    .range([0, width]);

  // Create a path for the ternary plot triangle
  const trianglePath = d3
    .line()
    .x((d) => ternaryScale(d.x))
    .y((d) => ternaryScale(d.y))
    .curve(d3.curveLinearClosed);

  overlay
    .append("path")
    .datum(vertices)
    .attr("class", "triangle")
    .attr("d", trianglePath)
    .attr("fill", "none")
    .attr("stroke", "black");

  // Create scales for the ternary coordinates

  const maxY = d3.max(currentData, (d) => convertToTernary(d).y)
  const minY = d3.min(currentData, (d) => convertToTernary(d).y)
  const maxYVals = d3.max([maxY, Math.abs(minY)])

  const maxX = d3.max(currentData, (d) => convertToTernary(d).x)
  const minX = d3.min(currentData, (d) => convertToTernary(d).x)
  const maxXVals = d3.max([maxX, Math.abs(minX)])

  const xScale = d3.scaleLinear() //.scaleLog()
  .domain([d3.min(currentData, (d) => convertToTernary(d).x),d3.max(currentData, (d) => convertToTernary(d).x)])
  .domain([-0.1,0.1])
  .range([0, width]);
  const yScale = d3.scaleLinear() //.scaleLog()
  .domain([d3.min(currentData, (d) => convertToTernary(d).y),d3.max(currentData, (d) => convertToTernary(d).y)])
  .domain([-0.5,0.2])
  .range([0, height]);

  const citiesScale = d3.scaleLog()
  .domain([d3.min(currentData, (d) => d.Cities), d3.max(currentData, (d) => d.Cities)])
  .range([0,1])

  const ruralScale = d3.scaleLog()
  .domain([d3.min(currentData, (d) => d.Rural), d3.max(currentData, (d) => d.Rural)])
  .range([0,1])

  const ruralCitiesRatio = d3.scaleLog()
  .domain([d3.min(currentData, (d) => d.Cities / d.Rural), d3.max(currentData, (d) => d.Cities / d.Rural)])
  .range([1,0])

  const urbanScale = d3.scaleLog()
  .domain([d3.min(currentData, (d) => d.Urban), d3.max(currentData, (d) => d.Urban)])
  .range([0,1])

  // Function to convert data to ternary coordinates
  function convertToTernary(data) {

    const sin = Math.sin(30)
    const cos =  Math.cos(30)

    const total = data.Cities + data.Towns + data.Rural

    const left = data.Cities / total
    const right = data.Towns / total
    const top = data.Rural / total

    const LeftLeft = Math.abs( cos * left )
    const LeftDown = Math.abs( sin * left )
    
    const RightRight = Math.abs( cos * right )
    const RightDown = Math.abs( sin * right )

    const TopUp = top * 2

    const ternaryY = (TopUp - LeftDown - RightDown) //* data.Total/5
    const ternaryX = (RightRight - LeftLeft) //* data.Total/5

    // console.log(
    //   "0.5 + "+TopUp+" - "+LeftDown+" - "+RightDown+"\n"+
    //   ternaryX + " " + ternaryY)


    
    // const ternaryY = urbanScale(data.Urban);
    // const ternaryX = ((ruralCitiesRatio(data.Cities / data.Rural)-0.5)*(urbanScale(data.Urban)))+0.5;

    // console.log("Rural: " + data.Rural + "\nUrban: " + data.Urban + "\nCities: " + data.Cities);
    // console.log("ternaryX: " + ternaryX + "\nternaryY: " + ternaryY + "\ntotal: " + total);
    // console.log("Ratio: " + data.Cities / data.Rural)
    // console.log(ternaryX + " " + ternaryY)
    return { x: ternaryX, y: ternaryY };
  }

  const colorScale = d3
    .scaleLog()
    .domain([
      d3.min(currentData, (d) => d.Year),
      d3.max(currentData, (d) => d.Year),
    ])
    .range([0, 1]);
  



  // Add lines to the ternary plot representing each data point
  function getNextData(data) {
    // return data from next year if < 2020
    if (data.Year < 2019) {
      return globalData.filter(function (d) {
        return d.Country == data.Country && d.Year == data.Year + 1;
      })[0];
    } else {
      return data;
    }
  }

  markers
    .selectAll(".line")
    .data(currentData)
    .enter()
    .append("line")
    .attr("class", "ternary line data")
    .attr("x1", (d) => xScale(convertToTernary(d).x))
    .attr("y1", (d) => yScale(convertToTernary(d).y))
    .attr("x2", (d) => xScale(convertToTernary(getNextData(d)).x))
    .attr("y2", (d) => yScale(convertToTernary(getNextData(d)).y))
    .attr("stroke", (d) => yearColorScale(d.Year + 1))
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.0)
    .on("click", handleMouseClick)
    .append("title")
    .text((d) => d.Country);
  
  // Add circles to the ternary plot representing each data point
  markers
    .selectAll(".circle")
    .data(currentData)
    .enter()
    .append("circle")
    .attr("class", "ternary circle data")
    .attr("id", "selectable")
    .attr("cx", (d) => xScale(convertToTernary(d).x))
    .attr("cy", (d) => yScale(convertToTernary(d).y))
    .attr("Rural", (d) => d.Rural)
    .attr("Urban", (d) => d.Urban)
    .attr("Cities", (d) => d.Cities)
    .attr("Country", (d) => d.Country)
    .attr("Year", (d) => d.Year)
    .attr("r", 1.5)
    .attr("fill", (d) => yearColorScale(d.Year))
    .attr("fill-opacity", 0.33)
    .attr("stroke", "black")
    .attr("stroke-width", 0.75)
    .attr("stroke-opacity", 0.33)
    .on("click", handleMouseClick)
    .append("title")
    .text((d) => d.Country + " " + d.Year + "\n Towns: " + d.Towns + "\n Rural: " + d.Rural + "\n Urban: " + d.Urban + "\n Cities: " + d.Cities);


  // Add tick marks and labels for the ternary axes

  for (let index = 0.25; index <= 1.75; index += 0.25) {
    markers
      .append("line")
      .attr("class", "ternary axis")
      .attr("x1", width/2 * index)
      .attr("y1", height)
      .attr("x2", width/2 + width/4 * index)
      .attr("y2", 0 + height/2 * index)
      .attr("stroke", "black")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 0.5);
      
    markers
      .append("line")
      .attr("class", "ternary axis")
      .attr("x2", width/4 * index)
      .attr("y1", height)
      .attr("x1", width/2 * index)
      .attr("y2", 0 + height/2 * (2 - index))
      .attr("stroke", "black")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 0.5);
      
    markers
      .append("line")
      .attr("class", "ternary axis")
      .attr("x2", width/2 - height/3.28 * index)
      .attr("y1", height/2 * index)
      .attr("x1", width/2 + height/3.28 * index)
      .attr("y2", height/2 * index)
      .attr("stroke", "black")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 0.5);
  } 




  // Add labels for the axes
  overlay
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", margin.top - 30)
    .style("text-anchor", "middle")
    .text("Rural");

  overlay
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height + 60)
    .attr("y", -margin.left + 240)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-60)")
    .text("Cities");
    
  overlay
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", width + 65)
    .attr("y", margin.top + height - 535)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(60)")
    .text("Suburban");
}



// Function to create the scatter plot
function createScatterPlot() {
  // Filter the data to remove entries with missing incomeperperson or alcconsumption values
  currentData = globalData.filter(function (d) {
    return d["GDP"] != 0 && d["GDP"] != ".." && d["Age: All Ages"] != "..";
  });
  
  // Create an SVG element to hold the scatter plot
  const svg = d3
    .select("#scatterPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create x and y scales for the scatter plot
  const xScale = d3
    .scaleLog()
    .domain([
      d3.min(currentData, (d) => d["GDP"]),
      d3.max(currentData, (d) => d["GDP"]),
    ])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(currentData, (d) => d["Age: All Ages"]),
      d3.max(currentData, (d) => d["Age: All Ages"]),
    ])
    .range([height, 0]);

  // Add circles to the scatter plot representing each country
  svg
    .selectAll(".circle")
    .data(currentData, (d) => d.country)
    .enter()
    .append("circle")
    .attr("class", "circle data")
    .attr("id", "selectable")
    .attr("cx", (d) => xScale(d["GDP"]))
    .attr("cy", (d) => yScale(d["Age: All Ages"]))
    .attr("r", 2.5)
    .attr("fill", "steelblue")
    .attr("stroke", "black")
    // on("click", handleMouseClick)
    .append("title")
    .text((d) => d.Country + " " + d["Age: All Ages"]);

  // Create tick marks and labels for the x and y axes
  var xTicks = [];
  var yTicks = [];
  for (let index = 0; index <= 1; index += 0.25) {
    xTicks.push(Math.round(xScale.invert(index * width)));
    yTicks.push(Math.round(yScale.invert(index * height)));
  }

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickFormat((d) => d)
        .tickValues(xTicks)
        .tickSizeOuter(0)
    );

  svg
    .append("g")
    .attr("class", "y-axis")
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat((d) => d)
        .tickValues(yTicks)
        .tickSizeOuter(0)
    );

  // Add labels for the x and y axes
  svg
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 20)
    .style("text-anchor", "middle")
    .text("GDP");

  svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 30)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Age: All Ages");
}

function createTreeMap() {
  currentData = getYearAverageData(globalData)

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


