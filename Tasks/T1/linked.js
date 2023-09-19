// This function is triggered when the mouse pointer is over an element.
function handleMouseOver(event, item) {
  // Select all elements with the class "data" using D3.js
  d3.selectAll(".data")
    // Filter the selection based on a custom condition.
    .filter(function (d) {
      // Return true for elements whose "title" property matches the "title" property of the "item" parameter.
      return item.title == d.title;
    })
    // Change the "fill" attribute of the filtered elements to "red".
    .attr("fill", "red");
}

// This function is triggered when the mouse pointer moves out of an element (mouseout event).
function handleMouseOut(event, item) {
  // Create a color scale using D3.js to map budgets to different shades of blue.
  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    // Set the domain of the color scale to the minimum and maximum budget values in the globalData array.
    .domain([
      d3.min(globalData, (d) => d.budget),
      d3.max(globalData, (d) => d.budget),
    ]);

  // Select all elements with the class "data" using D3.js
  d3.selectAll(".data")
    // Change the "fill" attribute of all the elements to "steelblue".
    .attr("fill", "steelblue");

  // Select all elements with the class "bar" and "data" using D3.js
  d3.selectAll(".bar.data")
    // Change the "fill" attribute of the "bar" elements based on the budget value using the color scale.
    .attr("fill", (d) => colorScale(d.budget));
}