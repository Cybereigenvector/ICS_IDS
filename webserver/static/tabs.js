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
  
  // Save the active tab to localStorage
  localStorage.setItem('activeTab', tabName);
}

// Initialize the tab on page load
document.addEventListener("DOMContentLoaded", function() {
  // Check if we have a saved tab
  var activeTab = localStorage.getItem('activeTab');
  
  // If we have a saved tab and it exists, open it
  if (activeTab && document.getElementById(activeTab)) {
    // Find the button for this tab
    var tabButtons = document.getElementsByClassName("tab-button");
    for (var i = 0; i < tabButtons.length; i++) {
      if (tabButtons[i].getAttribute("onclick").includes("openTab('" + activeTab + "'")) {
        tabButtons[i].click();
        return;
      }
    }
  }
  
  // Otherwise, get the first tab button and click it (default behavior)
  var firstTab = document.querySelector(".tab-button");
  if (firstTab) {
    firstTab.click();
  }
}); 