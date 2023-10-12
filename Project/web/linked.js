
// Function to handle mouseover event
function handleMouseClick(event, item) {
  // Select all elements with class "country.data" and filter based on the item's properties


  d3.selectAll("#selectable")
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
    .each(function() {
      var selected = d3.select(this).classed("selected"); // Check if already selected
      if (selected) {
        // Country is already selected, so deselect it
        d3.select(this)
          .classed("selected", false)
          .attr("stroke", "black")
          .attr("stroke-opacity", 0.25)
          ;
      } else {
        // Country is not selected, so select it
        d3.select(this)
          .classed("selected", true)
          .attr("stroke", "red")
          .attr("stroke-opacity", 1)
          .raise()
          ;
      }
    });


    var selected = d3.selectAll("#selectable").filter(function (d) {
      var selected = d3.select(this).classed("selected"); // Check if already selected
      return selected;
    })._groups[0].length;
  
    console.log(selected);
}