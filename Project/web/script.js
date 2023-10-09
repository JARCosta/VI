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
    // createScatterPlot();
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
  currentData = globalData
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
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom)
    .attr("style", "position: relative; left: 50%; transform: translateX(-50%); background-color: transparent white;")
    ;

  // Create a group to hold the map elements
  const mapGroup = svg.append("g")
  .attr("transform", `translate(${margin.left/1.6},${margin.top*1.75})`);

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
    .attr("class", "country data")
    .attr("d", path)
    .attr("stroke", "black")
    // .on("mouseover", handleMouseOver) // Function to handle mouseover event
    // .on("mouseout", handleMouseOut)   // Function to handle mouseout event
    .on("click", handleMouseOver)
    .append("title")
    .text((d) => d.properties.name);

  // Set the fill color of each country based on its Total value

  currentData.forEach((element) => {
    mapGroup
      .selectAll("path")
      .attr("fill", "transparent");
      // console.log(element.Total);
  });

  currentData.forEach((element) => {
    mapGroup
      .selectAll("path")
      .filter(function (d) {
        return d.properties.name == element.Country;
      })
      .attr("fill", function (d) {
        return element.Total != ".." ? d3.interpolateBlues(colorScale(element.Total)) : "transparent";
      });
      // console.log(element.Total);
  });

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
    .attr("stop-color", d3.interpolateBlues(0));

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d3.interpolateBlues(1));

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

function createTernaryPlot() {
  currentData = globalData.filter(function (d) {
    return d.Cities !== ".." && d.Rural !== ".." && d.Urban !== "..";
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

    markers
    .append("path")
    .datum(vertices)
    .attr("class", "triangle")
    .attr("d", trianglePath)
    .attr("fill", "none")
    .attr("stroke", "black");

  // Create scales for the ternary coordinates
  const xScale = d3.scaleLinear()
  .domain([d3.min(currentData, (d) => convertToTernary(d).x),d3.max(currentData, (d) => convertToTernary(d).x)])
  .domain([0,1])
  .range([0, width]);
  const yScale = d3.scaleLinear()
  .domain([d3.min(currentData, (d) => convertToTernary(d).y),d3.max(currentData, (d) => convertToTernary(d).y)])
  .domain([0,1])
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

    const ternaryY = 0.5 + TopUp - LeftDown - RightDown
    const ternaryX = 0.5 + RightRight - LeftLeft

    // console.log(
    //   "0.5 + "+TopUp+" - "+LeftDown+" - "+RightDown+"\n"+
    //   ternaryX + " " + ternaryY)


    
    // const ternaryY = urbanScale(data.Urban);
    // const ternaryX = ((ruralCitiesRatio(data.Cities / data.Rural)-0.5)*(urbanScale(data.Urban)))+0.5;

    // console.log("Rural: " + data.Rural + "\nUrban: " + data.Urban + "\nCities: " + data.Cities);
    // console.log("ternaryX: " + ternaryX + "\nternaryY: " + ternaryY + "\ntotal: " + total);
    // console.log("Ratio: " + data.Cities / data.Rural)
    return { x: ternaryX, y: 1 - ternaryY };
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
    .attr("stroke-opacity", 0.33)
    .on("click", handleMouseOver)
    .append("title")
    .text((d) => d.Country);
  
  // Add circles to the ternary plot representing each data point
  markers
    .selectAll(".circle")
    .data(currentData)
    .enter()
    .append("circle")
    .attr("class", "ternary circle data")
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
    .on("click", handleMouseOver)
    .append("title")
    .text((d) => d.Country + " " + d.Year + "\n Rural: " + d.Rural + "\n Urban: " + d.Urban + "\n Cities: " + d.Cities);


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
  markers
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", margin.top - 30)
    .style("text-anchor", "middle")
    .text("Rural");

  markers
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height + 60)
    .attr("y", -margin.left + 240)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-60)")
    .text("Cities");
    
  markers
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
  currentData = globalDataCapita.filter(function (d) {
    return d.incomeperperson != "" && d.alcconsumption != "";
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
      d3.min(currentData, (d) => d.incomeperperson),
      d3.max(currentData, (d) => d.incomeperperson),
    ])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(currentData, (d) => d.alcconsumption),
      d3.max(currentData, (d) => d.alcconsumption),
    ])
    .range([height, 0]);

  // Add circles to the scatter plot representing each country
  svg
    .selectAll(".circle")
    .data(currentData, (d) => d.country)
    .enter()
    .append("circle")
    .attr("class", "circle data")
    .attr("cx", (d) => xScale(d.incomeperperson))
    .attr("cy", (d) => yScale(d.alcconsumption))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .attr("stroke", "black")
    // .on("mouseover", handleMouseOver) // Function to handle mouseover event
    // .on("mouseout", handleMouseOut)   // Function to handle mouseout event
    .append("title")
    .text((d) => d.country);

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
    .text("Income per person");

  svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 30)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Alcohol Consumption");
}

function createClevelandDotPlot() {
  // Filter the data to remove entries with missing femaleemployrate, hivrate or internetuserate values
  currentData = globalDataCapita.filter(function (d) {
    return d.femaleemployrate != "" && d.hivrate != "" && d.internetuserate != "";
  });

  
  // Create an SVG element to hold the scatter plot
  const svg = d3
    .select("#clevelandPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height*4 + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create x and y scales for the scatter plot
  const xScale_femaleemployrate = d3
    .scaleLinear()
    .domain([
      d3.min(currentData, (d) => d.femaleemployrate),
      d3.max(currentData, (d) => d.femaleemployrate),
    ])
    .range([0, width]);

  const xScale_hivrate = d3
    .scaleLinear()
    .domain([
      d3.min(currentData, (d) => d.hivrate),
      d3.max(currentData, (d) => d.hivrate),
    ])
    .range([0, width]);

  const xScale_internetuserate = d3
    .scaleLinear()
    .domain([
      d3.min(currentData, (d) => d.internetuserate),
      d3.max(currentData, (d) => d.internetuserate),
    ])
    .range([0, width]);


  const yScale = d3
    .scaleBand()
    .domain(currentData.map((d) => d.country))
    .range([0, height*4])
    .padding(0.2);

  // Lines
  svg.selectAll("myline")
    .data(currentData)
    .enter()
    .append("line")
      .attr("x1", function(d) { return xScale_femaleemployrate(d.femaleemployrate)+4; })
      .attr("x2", function(d) { return xScale_hivrate(d.hivrate)+4; })
      .attr("y1", function(d) { return yScale(d.country)+4; })
      .attr("y2", function(d) { return yScale(d.country)+4; })
      .attr("stroke", "grey")
      .attr("stroke-width", "1px")
  
  // Lines
  svg.selectAll("myline")
    .data(currentData)
    .enter()
    .append("line")
      .attr("x1", function(d) { return xScale_hivrate(d.hivrate)+4; })
      .attr("x2", function(d) { return xScale_internetuserate(d.internetuserate)+4; })
      .attr("y1", function(d) { return yScale(d.country)+4; })
      .attr("y2", function(d) { return yScale(d.country)+4; })
      .attr("stroke", "grey")
      .attr("stroke-width", "1px")

  // Circles of variable 1
  svg.selectAll("mycircle")
    .data(currentData)
    .enter()
    .append("circle")
      .attr("cx", function(d) { return xScale_femaleemployrate(d.femaleemployrate)+4; })
      .attr("cy", function(d) { return yScale(d.country)+4; })
      .attr("r", "6")
      .style("fill", "#aa0000")

  // Circles of variable 1
  svg.selectAll("mycircle")
    .data(currentData)
    .enter()
    .append("circle")
      .attr("cx", function(d) { return xScale_hivrate(d.hivrate)+4; })
      .attr("cy", function(d) { return yScale(d.country)+4; })
      .attr("r", "6")
      .style("fill", "#00aa00")

  // Circles of variable 1
  svg.selectAll("mycircle")
    .data(currentData)
    .enter()
    .append("circle")
      .attr("cx", function(d) { return xScale_internetuserate(d.internetuserate)+4; })
      .attr("cy", function(d) { return yScale(d.country)+4; })
      .attr("r", "6")
      .style("fill", "#0000aa")



  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height*4})`)
    .call(
      d3
        .axisBottom(xScale_femaleemployrate)
        .tickSizeOuter(0)
    );

  svg
    .append("g")
    .attr("class", "y-axis")
    .call(
      d3
        .axisLeft(yScale)
        .tickSizeOuter(0)
    );

  // Add labels for the x and y axes
  svg
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height*4 + margin.top + 20)
    .style("text-anchor", "middle")
    .text("femaleemployrate");

  svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height*4 / 2)
    .attr("y", -margin.left + 10)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("hivrate");
}
