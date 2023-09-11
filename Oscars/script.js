// Declare a variable to hold the loaded JSON data.
var globalData;

// Define margins for the visualizations. 
const margin = { top: 20, right: 20, bottom: 50, left: 80 };

// Calculate the width and height of the visualizations based on the margins.
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// This function initiates the dashboard and loads the JSON data.
function startDashboard() {
  // Load the JSON data using D3.js.
  d3.json("data.json")
    .then((data) => {
      // Once the data is loaded successfully, store it in the globalData variable.
      globalData = data;

      // Create different visualizations using the loaded data.
      createBarChart(data);
      createScatterPlot(data);
      createLineChart(data);
    })
    .catch((error) => {
      // If there's an error while loading the JSON data, log the error.
      console.error("Error loading the JSON file:", error);
    });
}

// This function updates the visualizations based on the selected data type.
function updateIdioms(data) {
  // Use a switch statement to check which data type is selected.
  switch (data) {
    case "old":
      // If "old" is selected, update the visualizations with data before or equal to 2010.
      updateBarChart(globalData.filter((item) => item.oscar_year <= 2010));
      updateScatterPlot(globalData.filter((item) => item.oscar_year <= 2010));
      updateLineChart(globalData.filter((item) => item.oscar_year <= 2010));
      break;
    case "new":
      // If "new" is selected, update the visualizations with data after 2010.
      updateBarChart(globalData.filter((item) => item.oscar_year > 2010));
      updateScatterPlot(globalData.filter((item) => item.oscar_year > 2010));
      updateLineChart(globalData.filter((item) => item.oscar_year > 2010));
      break;
    default:
      // If no specific data type is selected, update the visualizations with all the data.
      updateBarChart(globalData);
      updateScatterPlot(globalData);
      updateLineChart(globalData);
      break;
  }
}
