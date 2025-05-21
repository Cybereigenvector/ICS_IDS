// PLC Variable Relationship Visualization Script

// Log that the script has loaded
console.log("Visualization script loaded");

// Initialize global variables
let svg, simulation, link, node;
let tooltip;

// Color scheme for nodes
const colors = {
    "input": "#4CAF50",
    "output": "#2196F3",
    "memory": "#FF9800"
};

// Helper function for generating random data (when no real data is available)
function generateDummyData() {
    console.log("Generating dummy test data for visualization");
    
    const inputs = [
        { name: "Input1", location: "%IX0.0", type: "BOOL" },
        { name: "Input2", location: "%IX0.1", type: "BOOL" },
        { name: "AnalogIn", location: "%IW0", type: "INT" }
    ];
    
    const outputs = [
        { name: "Output1", location: "%QX0.0", type: "BOOL" },
        { name: "Output2", location: "%QX0.1", type: "BOOL" }
    ];
    
    const memory = [
        { name: "Counter", location: "%MW0", type: "INT" },
        { name: "Timer", location: "%MW1", type: "TIME" },
        { name: "Status", location: "%MX0.0", type: "BOOL" }
    ];
    
    return { inputs, outputs, memory };
}

// Extract variables from DOM
function extractVariablesFromDOM() {
    console.log("Extracting variables from DOM");
    const variables = {
        inputs: [],
        outputs: [],
        memory: []
    };
    
    try {
        // Check if alerts tab exists
        const alertsTab = document.getElementById("alerts");
        if (!alertsTab || !alertsTab.innerHTML) {
            console.warn("Alerts tab not found or empty, using dummy data");
            return generateDummyData();
        }
        
        console.log("Alerts tab found, extracting variable tables");
        
        // Get all tables in the alerts tab
        const tables = alertsTab.querySelectorAll("table");
        console.log(`Found ${tables.length} tables in alerts tab`);
        
        if (tables.length < 3) {
            console.warn("Not enough tables found in alerts tab, using dummy data");
            return generateDummyData();
        }
        
        // Process input variables (first table)
        const inputTable = tables[0];
        if (inputTable) {
            const rows = inputTable.querySelectorAll("tr:not(:first-child)");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3 && !cells[0].textContent.includes("No input variables found")) {
                    variables.inputs.push({
                        name: cells[0].textContent.trim(),
                        location: cells[1].textContent.trim(),
                        type: cells[2].textContent.trim()
                    });
                }
            });
            console.log(`Found ${variables.inputs.length} input variables`);
        } else {
            console.warn("Input variables table not found");
        }
        
        // Process output variables (second table)
        const outputTable = tables[1];
        if (outputTable) {
            const rows = outputTable.querySelectorAll("tr:not(:first-child)");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3 && !cells[0].textContent.includes("No output variables found")) {
                    variables.outputs.push({
                        name: cells[0].textContent.trim(),
                        location: cells[1].textContent.trim(),
                        type: cells[2].textContent.trim()
                    });
                }
            });
            console.log(`Found ${variables.outputs.length} output variables`);
        } else {
            console.warn("Output variables table not found");
        }
        
        // Process memory variables (third table)
        const memoryTable = tables[2];
        if (memoryTable) {
            const rows = memoryTable.querySelectorAll("tr:not(:first-child)");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3 && !cells[0].textContent.includes("No memory variables found")) {
                    variables.memory.push({
                        name: cells[0].textContent.trim(),
                        location: cells[1].textContent.trim(),
                        type: cells[2].textContent.trim()
                    });
                }
            });
            console.log(`Found ${variables.memory.length} memory variables`);
        } else {
            console.warn("Memory variables table not found");
        }
        
        // If no variables found, use dummy data
        if (variables.inputs.length === 0 && 
            variables.outputs.length === 0 && 
            variables.memory.length === 0) {
            console.warn("No variables found, using dummy data");
            return generateDummyData();
        }
        
        return variables;
    } catch (error) {
        console.error("Error extracting variables:", error);
        return generateDummyData();
    }
}

// Prepare data for D3 visualization
function prepareVisualizationData(variables) {
    console.log("Preparing visualization data");
    const nodes = [];
    const links = [];
    
    // Add all variables as nodes with numeric IDs for D3
    let nodeId = 0;
    const nodeMap = new Map();
    
    // Add inputs
    variables.inputs.forEach(v => {
        const id = nodeId++;
        nodeMap.set(v.name, id);
        nodes.push({
            id: id,
            name: v.name,
            group: "input",
            location: v.location,
            type: v.type
        });
    });
    
    // Add outputs
    variables.outputs.forEach(v => {
        const id = nodeId++;
        nodeMap.set(v.name, id);
        nodes.push({
            id: id,
            name: v.name,
            group: "output",
            location: v.location,
            type: v.type
        });
    });
    
    // Add memory variables
    variables.memory.forEach(v => {
        const id = nodeId++;
        nodeMap.set(v.name, id);
        nodes.push({
            id: id,
            name: v.name,
            group: "memory",
            location: v.location,
            type: v.type
        });
    });
    
    // Create simple connections between variables
    // Link inputs to outputs and memory
    variables.inputs.forEach(input => {
        const sourceId = nodeMap.get(input.name);
        
        // Link to outputs (at least one if available)
        if (variables.outputs.length > 0) {
            const targetId = nodeMap.get(variables.outputs[0].name);
            links.push({
                source: sourceId,
                target: targetId,
                value: 1
            });
        }
        
        // Link to other outputs randomly
        variables.outputs.slice(1).forEach(output => {
            if (Math.random() > 0.7) {
                const targetId = nodeMap.get(output.name);
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: 1
                });
            }
        });
    });
    
    // Link memory variables to both inputs and outputs
    variables.memory.forEach(memory => {
        const sourceId = nodeMap.get(memory.name);
        
        // Connect to some inputs
        variables.inputs.forEach(input => {
            if (Math.random() > 0.8) {
                const targetId = nodeMap.get(input.name);
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: 1
                });
            }
        });
        
        // Connect to some outputs
        variables.outputs.forEach(output => {
            if (Math.random() > 0.7) {
                const targetId = nodeMap.get(output.name);
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: 1
                });
            }
        });
    });
    
    // Update statistics in the UI
    updateStatistics(variables);
    
    return { nodes, links };
}

// Update the statistics table in the UI
function updateStatistics(variables) {
    document.getElementById("input-count").textContent = variables.inputs.length;
    document.getElementById("output-count").textContent = variables.outputs.length;
    document.getElementById("memory-count").textContent = variables.memory.length;
    document.getElementById("total-count").textContent = 
        variables.inputs.length + variables.outputs.length + variables.memory.length;
    
    // Add example variable names
    document.getElementById("input-examples").textContent = 
        variables.inputs.slice(0, 3).map(v => v.name).join(", ") || "-";
    document.getElementById("output-examples").textContent = 
        variables.outputs.slice(0, 3).map(v => v.name).join(", ") || "-";
    document.getElementById("memory-examples").textContent = 
        variables.memory.slice(0, 3).map(v => v.name).join(", ") || "-";
}

// Create and render the D3.js visualization
function createVisualization() {
    console.log("Creating visualization");
    
    try {
        // Show loading indicator
        const loadingIndicator = document.getElementById("vis-loading");
        const noDataMessage = document.getElementById("vis-no-data");
        
        if (loadingIndicator) loadingIndicator.style.display = "block";
        if (noDataMessage) noDataMessage.style.display = "none";
        
        // Get the container element
        const container = document.getElementById("visualization-container");
        if (!container) {
            console.error("Visualization container not found");
            return;
        }
        
        // Get container dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;
        console.log("Container dimensions:", width, "x", height);
        
        // Extract variables and prepare data
        const variables = extractVariablesFromDOM();
        const data = prepareVisualizationData(variables);
        
        console.log("Visualization data:", data.nodes.length, "nodes,", data.links.length, "links");
        
        // If no data, show message and return
        if (data.nodes.length === 0) {
            if (loadingIndicator) loadingIndicator.style.display = "none";
            if (noDataMessage) noDataMessage.style.display = "block";
            return;
        }
        
        // Remove any existing SVG
        d3.select("#visualization-container svg").remove();
        
        // Create SVG element
        svg = d3.select("#visualization-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "visualization-svg");
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
            
        svg.call(zoom);
        
        // Create g element to hold the visualization
        const g = svg.append("g");
        
        // Create tooltip
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        // Create force simulation
        simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .alphaTarget(0)
            .alphaDecay(0.005);
        
        // Create links
        link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("class", "vis-link")
            .attr("stroke", "#999")
            .attr("stroke-width", 1);
        
        // Create nodes
        node = g.append("g")
            .attr("class", "nodes")
            .selectAll(".vis-node")
            .data(data.nodes)
            .enter()
            .append("g")
            .attr("class", "vis-node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`<strong>${d.name}</strong><br>Type: ${d.type}<br>Location: ${d.location}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                // Highlight the node
                d3.select(this).select("circle")
                    .transition()
                    .duration(200)
                    .attr("r", 12);
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                // Return to normal size
                d3.select(this).select("circle")
                    .transition()
                    .duration(200)
                    .attr("r", 8);
            });
        
        // Add circles to nodes
        node.append("circle")
            .attr("r", 8)
            .attr("fill", d => colors[d.group] || "#999");
        
        // Add text labels to nodes
        node.append("text")
            .text(d => d.name)
            .attr("x", 12)
            .attr("y", 4)
            .attr("font-family", "Arial")
            .attr("font-size", "10px")
            .attr("pointer-events", "none");
        
        // Update positions on tick
        simulation.on("tick", () => {
            // Log the first tick
            if (!window.tickLogged) {
                console.log("Force simulation started ticking");
                window.tickLogged = true;
            }
            
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            // Keep nodes within bounds
            node.attr("transform", d => {
                d.x = Math.max(20, Math.min(width - 20, d.x || width/2));
                d.y = Math.max(20, Math.min(height - 20, d.y || height/2));
                return `translate(${d.x},${d.y})`;
            });
        });
        
        // Hide loading after simulation warms up
        setTimeout(() => {
            if (loadingIndicator) loadingIndicator.style.display = "none";
        }, 1500);
        
        // Functions for node dragging
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        // Reset zoom function
        const resetButton = document.getElementById("reset-zoom");
        if (resetButton) {
            resetButton.addEventListener("click", function() {
                console.log("Reset zoom clicked");
                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                );
            });
        }
        
        // Set up filter dropdown
        const filterSelect = document.getElementById("filter-type");
        if (filterSelect) {
            filterSelect.addEventListener("change", function() {
                const filter = this.value;
                
                node.style("display", d => {
                    if (filter === "all") return "block";
                    return d.group === filter ? "block" : "none";
                });
                
                link.style("display", d => {
                    if (filter === "all") return "block";
                    
                    const sourceNode = data.nodes.find(n => n.id === d.source.id);
                    const targetNode = data.nodes.find(n => n.id === d.target.id);
                    
                    if (!sourceNode || !targetNode) return "none";
                    
                    return (sourceNode.group === filter || targetNode.group === filter) ? "block" : "none";
                });
            });
        }
        
    } catch (error) {
        console.error("Error creating visualization:", error);
        document.getElementById("vis-loading").style.display = "none";
        document.getElementById("vis-no-data").style.display = "block";
        document.getElementById("vis-no-data").querySelector("p").textContent = 
            "Error creating visualization: " + error.message;
    }
}

// Initialize visualization when the document is loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded, setting up visualization handlers");
    
    // Listen for tab open event
    const vizTabButton = document.querySelector('button[onclick="openTab(\'visualization\')"]');
    if (vizTabButton) {
        vizTabButton.addEventListener("click", function() {
            console.log("Visualization tab opened");
            // Give the DOM time to update
            setTimeout(createVisualization, 500);
        });
    } else {
        console.warn("Visualization tab button not found");
    }
    
    // Initialize visualization if it's the active tab
    if (localStorage.getItem('activeTab') === 'visualization') {
        console.log("Visualization is active tab on page load");
        // Longer timeout to ensure page is fully loaded
        setTimeout(createVisualization, 1000);
    }
});

// Export functions for debugging
window.vizDebug = {
    createVisualization,
    extractVariablesFromDOM,
    generateDummyData
}; 