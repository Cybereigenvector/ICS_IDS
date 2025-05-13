// Tab Switching Functionality
function openTab(tabName) {
  // Hide all tab contents
  var tabContents = document.getElementsByClassName("tab-content");
  for (var i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }
  
  // Remove active class from all buttons
  var tabButtons = document.getElementsByClassName("tab-button");
  for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
  
  // Show the selected tab content
  document.getElementById(tabName).style.display = "block";
  
  // Add active class to the clicked button
  event.currentTarget.classList.add("active");
}

// Initialize the default tab on page load
document.addEventListener("DOMContentLoaded", function() {
  // Get the first tab button and click it
  var firstTab = document.querySelector(".tab-button");
  if (firstTab) {
    firstTab.click();
  }
}); 