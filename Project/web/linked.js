
// Function to handle mouseover event
function handleMouseClick(event, item) {
  // Select all elements with class "country.data" and filter based on the item's properties

  if(item.properties != undefined) {

    if(country_selection[item.properties.name] != true) {
      country_selection[item.properties.name] = true;
      country_selection.length += 1;
    } else {
      country_selection[item.properties.name] = false;
      country_selection.length -= 1;
    }
  } else if (item.data != undefined) {
    // console.log(item.data)
    if(country_selection[item.data.Country] != true) {
      country_selection[item.data.Country] = true;
    } else {
      country_selection[item.data.Country] = false;
    }
  }

  // d3.selectAll("#selectable")
  //   .filter(function (d) {
  //     if(d.properties != undefined) {
  //       return country_selection[d.properties.name] == true;
  //     } else {
  //       return country_selection[d.Country] == true;
  //     }
  //   })
  //   .attr("fill-opacity", 1)
  //   .attr("stroke-opacity", 1);

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



  d3.selectAll(".treeMap.data").filter(function (d) {
    return country_selection[d.data.Country] != true;
  })
  .attr("fill-opacity", 0)

  d3.selectAll(".treeMap.data").filter(function (d) {
    // console.log(country_selection)
    return country_selection[d.data.Country] == true;
  })
  .attr("fill-opacity", 1)

  const test = d3.selectAll("#selectable")
    .filter(function (d) {
      return country_selection[d.Country] == true;
    })
  
  applyFilters();
  d3.selectAll("#streamGraph").select("svg").remove();
  createStreamGraph();

}