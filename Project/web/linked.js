
// Function to handle mouseover event
function handleMouseClick(event, item) {
  // Select all elements with class "country.data" and filter based on the item's properties

  if(country_selection[item.properties.name] != true) {
    country_selection[item.properties.name] = true;
  } else {
    country_selection[item.properties.name] = false;
  }

  d3.selectAll("#selectable")
    .filter(function (d) {
      if(d.properties != undefined) {
        return country_selection[d.properties.name] == true;
      } else {
        return country_selection[d.Country] == true;
      }
    })
    .attr("fill-opacity", 1)
    .attr("stroke-opacity", 1);

  d3.selectAll(".choro.data.active").filter(function (d) {
    if(d.properties != undefined) {
      return country_selection[d.properties.name] != true;
    } else {
      return country_selection[d.Country] != true;
    }
  })
  .attr("fill-opacity", 0)
  ;

  d3.selectAll(".parallel.data").filter(function (d) {
    if(d.properties != undefined) {
      return country_selection[d.properties.name] != true;
    } else {
      return country_selection[d.Country] != true;
    }
  })
  .attr("stroke-opacity", 0)
  ;

  const test = d3.selectAll("#selectable")
    .filter(function (d) {
      return country_selection[d.Country] == true;
    })
  applyFilters();

}