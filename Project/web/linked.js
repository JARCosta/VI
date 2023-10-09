
// Function to handle mouseover event
function handleMouseOver(event, item) {
  // Select all elements with class "data" and filter based on the item's properties
  d3.selectAll(".country.data")
    .filter(function (d) {
      // Check if "properties" exist in both item and d objects
      if ("properties" in item) {
        if ("properties" in d) return item.properties.name == d.properties.name;
        else return item.properties.name == d.Country;
      } else if ("properties" in d) {
        return item.Country == d.properties.name;
      } else {
        return item.Country == d.Country;
      }
    })
    .attr("stroke-opacity", 1)
    .attr("fill-opacity", 1)
    .attr("stroke", "red")
    .attr("z-index",-1)
    .attr("position","relative")
    .raise()
    ;

  d3.selectAll(".line")
    .filter(function (d) {
      // Check if "properties" exist in both item and d objects
      if ("properties" in item) {
        if ("properties" in d) return item.properties.name == d.properties.name;
        else return item.properties.name == d.Country;
      } else if ("properties" in d) {
        return item.Country == d.properties.name;
      } else {
        return item.Country == d.Country;
      }
    })
    .attr("stroke-opacity", 1)
    .attr("fill-opacity", 1)
    // .attr("stroke", "red")
    .attr("z-index",-1)
    .attr("position","relative")
    .raise()
    ;

    d3.selectAll(".circle.data")
    .filter(function (d) {
      // Check if "properties" exist in both item and d objects
      if ("properties" in item) {
        if ("properties" in d) return item.properties.name == d.properties.name;
        else return item.properties.name == d.Country;
      } else if ("properties" in d) {
        return item.Country == d.properties.name;
      } else {
        return item.Country == d.Country;
      }
    })
    .attr("stroke-opacity", 1)
    .attr("fill-opacity", 1)
    .attr("stroke", "red")
    .attr("z-index",-1)
    .attr("position","relative")
    .raise()
    ;


}

// Function to handle mouseout event
function handleMouseOut(event, item) {
  // Filter the current data to remove entries with missing incomeperperson values
  currentData = globalDataCapita.filter(function (d) {
    return d.incomeperperson != "";
  });

  // Create a color scale for the incomeperperson values
  const colorScale = d3
    .scaleLog()
    .domain([
      d3.min(currentData, (d) => d.incomeperperson),
      d3.max(currentData, (d) => d.incomeperperson),
    ])
    .range([0, 1]);

  // Reset the fill color of all elements with class "country data" to black
  d3.selectAll(".country.data").attr("fill", "black");

  // Set the fill color of each country based on its incomeperperson value
  currentData.forEach((element) => {

    d3.selectAll(".country.data")
    .filter(function (d) {
      return d.properties.name == element.country;
    })

    d3.selectAll(".country.data")
      .filter(function (d) {
        return d.properties.name == element.country;
      })
      .attr("fill", d3.interpolateBlues(colorScale(element.incomeperperson)));
  });


  ternaryData = globalData

  const yearColorScale = d3
    .scaleLinear()
    .domain([
      d3.min(ternaryData, (d) => d.Year),
      d3.max(ternaryData, (d) => d.Year),
    ])
    .range([0, 1]);

  // Reset the fill color of all elements with class "circle data" to steelblue
  // d3.selectAll("circle.data").attr("fill", "steelblue");

  // Set the fill color of each country based on its incomeperperson value
  ternaryData.forEach((element) => {
    // console.log(element);
    d3.selectAll("circle.data")
      // .filter(function (d) {
      //   return d.properties.Country == element.Country;
      // })
      .attr("fill", d3.interpolateBlues(yearColorScale(element.Year)));
  });
}