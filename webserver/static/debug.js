// Debug script for visualization tab
console.log("Debug script loaded");

// Function to check if D3.js is loaded
function checkD3() {
    if (typeof d3 !== 'undefined') {
        console.log("D3.js is loaded, version:", d3.version);
    } else {
        console.error("D3.js is NOT loaded!");
    }
}

// Function to check tab elements
function checkTabElements() {
    console.log("Checking tab elements...");
    
    // Check tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    console.log("Tab buttons found:", tabButtons.length);
    for (let i = 0; i < tabButtons.length; i++) {
        console.log("Button", i, ":", tabButtons[i].textContent, "onclick:", tabButtons[i].getAttribute("onclick"));
    }
    
    // Check tab contents
    const tabContents = document.getElementsByClassName("tab-content");
    console.log("Tab contents found:", tabContents.length);
    for (let i = 0; i < tabContents.length; i++) {
        console.log("Content", i, "id:", tabContents[i].id, "display:", tabContents[i].style.display);
    }
    
    // Check visualization specific elements
    const visualizationTab = document.getElementById("visualization");
    if (visualizationTab) {
        console.log("Visualization tab found");
        console.log("Display:", visualizationTab.style.display);
        console.log("Contents:", visualizationTab.innerHTML.substring(0, 100) + "...");
    } else {
        console.error("Visualization tab NOT found!");
    }
    
    const visualizationContainer = document.getElementById("visualization-container");
    if (visualizationContainer) {
        console.log("Visualization container found");
        console.log("Width:", visualizationContainer.clientWidth, "Height:", visualizationContainer.clientHeight);
    } else {
        console.error("Visualization container NOT found!");
    }
    
    const visualizationSvg = document.getElementById("visualization-svg");
    if (visualizationSvg) {
        console.log("Visualization SVG found");
    } else {
        console.error("Visualization SVG NOT found!");
    }
}

// Function to test D3 visualization
function testD3Visualization() {
    console.log("Testing D3 visualization functionality");
    
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error("D3 is not loaded!");
        return false;
    }
    
    console.log("D3 version:", d3.version);
    
    // Check visualization-related DOM elements
    const container = document.getElementById('visualization-container');
    if (!container) {
        console.error("visualization-container not found");
        return false;
    }
    
    console.log("Visualization container dimensions:", container.clientWidth, "x", container.clientHeight);
    
    // Test if SVG can be created and appended to the container
    try {
        // Remove any existing test SVG
        d3.select("#debug-test-svg").remove();
        
        // Try to append a small test SVG
        const testSvg = d3.select(container)
            .append("svg")
            .attr("id", "debug-test-svg")
            .attr("width", 50)
            .attr("height", 50)
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px")
            .style("z-index", "1000")
            .style("background-color", "rgba(255,0,0,0.2)");
            
        testSvg.append("circle")
            .attr("cx", 25)
            .attr("cy", 25)
            .attr("r", 10)
            .style("fill", "red");
            
        console.log("Test SVG created successfully");
        
        // Clean up after 5 seconds
        setTimeout(() => {
            d3.select("#debug-test-svg").remove();
            console.log("Test SVG removed");
        }, 5000);
        
        return true;
    } catch (e) {
        console.error("Error creating test SVG:", e);
        return false;
    }
}

// Run checks when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded, running checks...");
    setTimeout(() => {
        checkD3();
        checkTabElements();
        testD3Visualization();
        
        // Add click event to visualization tab for testing
        const vizButton = document.querySelector('button[onclick="openTab(\'visualization\')"]');
        if (vizButton) {
            console.log("Found visualization tab button, adding debug event");
            vizButton.addEventListener('click', function() {
                console.log("Visualization tab clicked, testing D3 after delay");
                setTimeout(testD3Visualization, 500);
            });
        }
    }, 1000);
}); 