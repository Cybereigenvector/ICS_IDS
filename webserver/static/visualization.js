// PLC Variable Relationship Visualization Script

// Log that the script has loaded
console.log("Visualization script loaded");

// Initialize global variables
let svg, simulation, link, node;
let tooltip;
let showArrows = false;

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

// Function to analyze ST program code and extract variable relationships
function analyzeSTCode() {
    console.log("Analyzing ST code for variable relationships");
    
    // Find the program structure section in the alerts tab
    const alertsTab = document.getElementById("alerts");
    if (!alertsTab) {
        console.warn("Alerts tab not found for ST code analysis");
        return null;
    }
    
    // Get the program structure pre element containing the ST code
    const programStructureSection = alertsTab.querySelector("div pre");
    if (!programStructureSection) {
        console.warn("Program structure section not found");
        return null;
    }
    
    const stCode = programStructureSection.textContent;
    if (!stCode || stCode.trim() === "") {
        console.warn("ST code is empty");
        return null;
    }
    
    console.log("Found ST code, analyzing variable relationships");
    
    // Create a map to store variable influences with code snippets
    const variableInfluences = new Map();
    
    // Get all variables from the DOM
    const variables = extractVariablesFromDOM();
    const allVariables = [
        ...variables.inputs.map(v => v.name),
        ...variables.outputs.map(v => v.name),
        ...variables.memory.map(v => v.name)
    ];
    
    // Initialize the influence map for each variable
    allVariables.forEach(varName => {
        variableInfluences.set(varName, new Map()); // Use a map to store target variables with their code snippets
    });
    
    // Split the ST code into lines for analysis
    const codeLines = stCode.split('\n');
    
    // Analyze each line for variable assignments
    codeLines.forEach((line, lineIndex) => {
        // Skip empty lines, comments, and VAR declarations
        if (line.trim() === "" || line.trim().startsWith('(*') || line.trim().startsWith('VAR') || line.trim().startsWith('END_VAR')) {
            return;
        }
        
        // Look for assignment operations (variable := expression)
        const assignmentMatch = line.match(/(\w+)\s*:=\s*(.*?);/);
        if (assignmentMatch) {
            const targetVar = assignmentMatch[1].trim();
            const expression = assignmentMatch[2].trim();
            const lineNumber = lineIndex + 1; // 1-based line number
            const codeSnippet = line.trim();
            
            // Find all variables in the expression that influence the target
            allVariables.forEach(sourceVar => {
                // Create a regex to match the source variable as a whole word
                const varRegex = new RegExp(`\\b${sourceVar}\\b`);
                if (expression.match(varRegex) && sourceVar !== targetVar) {
                    // The source variable influences the target variable
                    if (!variableInfluences.get(sourceVar).has(targetVar)) {
                        variableInfluences.get(sourceVar).set(targetVar, []);
                    }
                    
                    // Add the code snippet with line number
                    variableInfluences.get(sourceVar).get(targetVar).push({
                        snippet: codeSnippet,
                        lineNumber: lineNumber,
                        type: "assignment"
                    });
                    
                    console.log(`Found influence: ${sourceVar} -> ${targetVar} (line ${lineNumber}): ${codeSnippet}`);
                }
            });
        }
        
        // Look for IF conditions
        if (line.includes("IF") && line.includes("THEN")) {
            const conditionMatch = line.match(/IF\s+(.*?)\s+THEN/);
            if (conditionMatch) {
                const condition = conditionMatch[1].trim();
                const lineNumber = lineIndex + 1; // 1-based line number
                
                // Find all variables in the condition
                const conditionVars = new Set();
                allVariables.forEach(varName => {
                    // Create a regex to match the variable as a whole word
                    const varRegex = new RegExp(`\\b${varName}\\b`);
                    if (condition.match(varRegex)) {
                        conditionVars.add(varName);
                    }
                });
                
                // Look for variables that might be affected by this condition
                // in subsequent lines until END_IF
                let endIfFound = false;
                let i = lineIndex + 1;
                const ifBlock = [line.trim()]; // Store the entire IF block
                const affectedVarsWithLines = new Map(); // Map of affected variables to their assignment lines
                
                while (i < codeLines.length && !endIfFound) {
                    const currentLine = codeLines[i];
                    ifBlock.push(currentLine.trim());
                    
                    if (currentLine.includes("END_IF")) {
                        endIfFound = true;
                    } else if (currentLine.includes(":=")) {
                        const assignMatch = currentLine.match(/(\w+)\s*:=\s*(.*?);/);
                        if (assignMatch) {
                            const targetVar = assignMatch[1].trim();
                            if (allVariables.includes(targetVar)) {
                                if (!affectedVarsWithLines.has(targetVar)) {
                                    affectedVarsWithLines.set(targetVar, []);
                                }
                                affectedVarsWithLines.get(targetVar).push({
                                    line: currentLine.trim(),
                                    lineNumber: i + 1
                                });
                            }
                        }
                    }
                    i++;
                }
                
                // Create relationships between condition variables and affected variables
                conditionVars.forEach(sourceVar => {
                    affectedVarsWithLines.forEach((assignments, targetVar) => {
                        if (sourceVar !== targetVar) {
                            if (!variableInfluences.get(sourceVar).has(targetVar)) {
                                variableInfluences.get(sourceVar).set(targetVar, []);
                            }
                            
                            // Create a code snippet with the IF condition and the assignment
                            assignments.forEach(assignment => {
                                const ifSnippet = ifBlock.join('\n');
                                variableInfluences.get(sourceVar).get(targetVar).push({
                                    snippet: ifSnippet,
                                    lineNumber: lineNumber,
                                    assignmentLine: assignment.lineNumber,
                                    type: "conditional",
                                    highlight: assignment.line
                                });
                                
                                console.log(`Found conditional influence: ${sourceVar} -> ${targetVar} (line ${lineNumber})`);
                            });
                        }
                    });
                });
            }
        }
    });
    
    return variableInfluences;
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
            type: v.type,
            writable: false
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
            type: v.type,
            writable: true
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
            type: v.type,
            writable: true
        });
    });
    
    // Analyze ST code for variable relationships
    const variableInfluences = analyzeSTCode();
    
    if (variableInfluences) {
        console.log("Using analyzed relationships from ST code");
        
        // Create links based on the analyzed variable influences
        for (const [sourceVarName, targetVarsMap] of variableInfluences.entries()) {
            // Only add links if the source variable exists in our node map
            if (nodeMap.has(sourceVarName)) {
                const sourceId = nodeMap.get(sourceVarName);
                
                // Add links to all influenced variables
                for (const [targetVarName, codeSnippets] of targetVarsMap.entries()) {
                    if (nodeMap.has(targetVarName)) {
                        const targetId = nodeMap.get(targetVarName);
                        
                        // Don't create self-loops
                        if (sourceId !== targetId) {
                            links.push({
                                source: sourceId,
                                target: targetId,
                                value: 1,
                                sourceVar: sourceVarName,
                                targetVar: targetVarName,
                                codeSnippets: codeSnippets
                            });
                        }
                    }
                }
            }
        }
    } else {
        console.log("Falling back to default relationship logic");
        
        // Fallback to simple logic (all inputs can influence outputs and memory, memory can influence outputs)
        // This is a simplified model when we can't analyze the ST code
        
        // Connect inputs to outputs
        variables.inputs.forEach(input => {
            const sourceId = nodeMap.get(input.name);
            
            // Connect each input to each output
            variables.outputs.forEach(output => {
                const targetId = nodeMap.get(output.name);
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: 1,
                    sourceVar: input.name,
                    targetVar: output.name,
                    codeSnippets: [{
                        snippet: "Relationship inferred (no code analysis available)",
                        type: "inferred"
                    }]
                });
            });
            
            // Connect each input to each memory variable
            variables.memory.forEach(memory => {
                const targetId = nodeMap.get(memory.name);
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: 1,
                    sourceVar: input.name,
                    targetVar: memory.name,
                    codeSnippets: [{
                        snippet: "Relationship inferred (no code analysis available)",
                        type: "inferred"
                    }]
                });
            });
        });
        
        // Connect memory variables to outputs
        variables.memory.forEach(memory => {
            const sourceId = nodeMap.get(memory.name);
            
            // Connect each memory variable to each output
            variables.outputs.forEach(output => {
                const targetId = nodeMap.get(output.name);
                links.push({
                    source: sourceId,
                    target: targetId,
                    value: 1,
                    sourceVar: memory.name,
                    targetVar: output.name,
                    codeSnippets: [{
                        snippet: "Relationship inferred (no code analysis available)",
                        type: "inferred"
                    }]
                });
            });
        });
    }
    
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

// Toggle arrow visibility
function toggleArrows(show) {
    showArrows = show;
    if (!link) return;
    
    if (show) {
        // Add arrowheads
        link.attr("marker-end", "url(#arrowhead)");
    } else {
        // Remove arrowheads
        link.attr("marker-end", null);
    }
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
            
        // Create or get code snippet container
        let snippetContainer = document.getElementById("code-snippet-container");
        if (!snippetContainer) {
            snippetContainer = document.createElement("div");
            snippetContainer.id = "code-snippet-container";
            snippetContainer.style.cssText = `
                position: fixed;
                background-color: rgba(0, 0, 0, 0.9);
                color: #f1f1f1;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 1000;
                display: none;
                max-width: 500px;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                border-left: 3px solid #0066FC;
            `;
            document.body.appendChild(snippetContainer);
        }
        
        // Create link tooltip
        const linkTooltip = d3.select("body").append("div")
            .attr("class", "link-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("text-align", "center")
            .style("background", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "10");
            
        // Define arrow markers for graph links
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", 25)  // Increase this value to move arrows away from nodes
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 8)  // Make arrow larger
            .attr("markerHeight", 8)  // Make arrow larger
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "#999")
            .style("stroke", "none");

        // Define patterns for writable variables
        const defs = svg.append("defs");
        
        // Striped pattern for writable output variables with red net
        defs.append("pattern")
            .attr("id", "stripes-output")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 8)
            .attr("height", 8)
            .attr("patternTransform", "rotate(45)")
            .append("rect")
            .attr("width", 4)
            .attr("height", 8)
            .attr("transform", "translate(0,0)")
            .attr("fill", colors.output);

        // Red net pattern for output variables
        defs.append("pattern")
            .attr("id", "net-output")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 10)
            .attr("height", 10);
            
        // Add background color to the output net pattern
        defs.select("#net-output")
            .append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", colors.output);
            
        // Add the crosshatch pattern
        defs.select("#net-output")
            .append("path")
            .attr("d", "M0,0 L10,10 M10,0 L0,10")
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .attr("fill", "none");

        // Striped pattern for writable memory variables
        defs.append("pattern")
            .attr("id", "stripes-memory")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 8)
            .attr("height", 8)
            .attr("patternTransform", "rotate(45)")
            .append("rect")
            .attr("width", 4)
            .attr("height", 8)
            .attr("transform", "translate(0,0)")
            .attr("fill", colors.memory);
            
        // Red net pattern for memory variables
        defs.append("pattern")
            .attr("id", "net-memory")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 10)
            .attr("height", 10);
            
        // Add background color to the memory net pattern
        defs.select("#net-memory")
            .append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", colors.memory);
            
        // Add the crosshatch pattern
        defs.select("#net-memory")
            .append("path")
            .attr("d", "M0,0 L10,10 M10,0 L0,10")
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .attr("fill", "none");
            
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
            
        svg.call(zoom);
        
        // Create g element to hold the visualization
        const g = svg.append("g");

        // Create links - moved inside the g container to be affected by zoom
        link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("class", "vis-link")
            .attr("stroke", "#999")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                // Highlight the link
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("stroke", "#0066FC")
                    .attr("stroke-width", 3)
                    .attr("stroke-opacity", 1);
                
                // Show tooltip with variable names
                linkTooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                linkTooltip.html(`<strong>${d.sourceVar}</strong> → <strong>${d.targetVar}</strong><br><span style="font-size:10px">Click to see code</span>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                // Return link to normal appearance
                d3.select(this)
                    .transition()
                    .duration(500)
                    .attr("stroke", "#999")
                    .attr("stroke-width", 1)
                    .attr("stroke-opacity", 0.4);
                
                // Hide tooltip
                linkTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                // When a link is clicked, show the code snippets
                event.preventDefault();
                event.stopPropagation(); // Prevent event from bubbling up
                
                const snippets = d.codeSnippets;
                if (snippets && snippets.length > 0) {
                    let snippetHTML = `<h3>${d.sourceVar} → ${d.targetVar}</h3>`;
                    snippetHTML += `<div class="code-snippet-content">`;
                    
                    snippets.forEach((snippet, index) => {
                        if (snippet.type === "inferred") {
                            snippetHTML += `<div class="snippet-item">
                                <p class="snippet-info">This relationship is inferred based on variable types.</p>
                                <pre class="snippet-code inferred">${snippet.snippet}</pre>
                            </div>`;
                        } else {
                            let codeDisplay = snippet.snippet;
                            if (snippet.type === "conditional" && snippet.highlight) {
                                // If it's a conditional, we can highlight the specific assignment line
                                const lines = snippet.snippet.split('\n');
                                const highlightedLines = lines.map(line => {
                                    if (line.includes(snippet.highlight)) {
                                        return `<span class="highlight-line">${line}</span>`;
                                    }
                                    return line;
                                });
                                codeDisplay = highlightedLines.join('\n');
                            }
                            
                            snippetHTML += `<div class="snippet-item">
                                <p class="snippet-info">Line ${snippet.lineNumber} - ${snippet.type === "assignment" ? "Direct Assignment" : "Conditional Relationship"}</p>
                                <pre class="snippet-code">${codeDisplay}</pre>
                            </div>`;
                        }
                        
                        // Add a separator between snippets
                        if (index < snippets.length - 1) {
                            snippetHTML += `<hr style="border: 0; border-top: 1px dashed #555; margin: 10px 0;">`;
                        }
                    });
                    
                    snippetHTML += `</div>
                        <div class="snippet-footer">
                            <button id="close-snippet" style="padding: 5px 10px; background: #333; color: white; border: none; border-radius: 3px; cursor: pointer;">Close</button>
                        </div>`;
                    
                    // Show the snippet container
                    snippetContainer.innerHTML = snippetHTML;
                    
                    // Add a pointer element to visually connect the snippet to the clicked location
                    const pointerHTML = '<div class="snippet-pointer"></div>';
                    snippetContainer.insertAdjacentHTML('afterbegin', pointerHTML);
                    
                    // Position the container - align with cursor
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const snippetWidth = 450; // Approximate width - will be constrained by max-width in CSS
                    const snippetHeight = 300; // Approximate height - constrained by max-height

                    // Default position is to the right of the cursor
                    let left = event.pageX + 15;
                    let top = event.pageY - 20;
                    let pointerClass = "left-pointer";
                    
                    // Check if snippet would go off the right edge of the viewport
                    if (left + snippetWidth > viewportWidth - 20) {
                        // Place to the left of the cursor instead
                        left = event.pageX - snippetWidth - 15;
                        pointerClass = "right-pointer";
                    }
                    
                    // Check if snippet would go off the bottom of the viewport
                    if (top + snippetHeight > viewportHeight - 20) {
                        top = viewportHeight - snippetHeight - 20;
                    }
                    
                    // Check if snippet would go off the top of the viewport
                    if (top < 20) {
                        top = 20;
                    }

                    // Set position of the container
                    snippetContainer.style.display = "block";
                    snippetContainer.style.left = left + "px";
                    snippetContainer.style.top = top + "px";
                    
                    // Update pointer class based on which side it's on
                    const pointerElement = snippetContainer.querySelector('.snippet-pointer');
                    if (pointerElement) {
                        pointerElement.className = "snippet-pointer " + pointerClass;
                    }
                    
                    // Add event listener to close button
                    document.getElementById("close-snippet").addEventListener("click", function() {
                        snippetContainer.style.display = "none";
                    });
                    
                    // Also close the snippet when clicking outside
                    document.addEventListener('click', function closeSnippetOnClickOutside(e) {
                        if (e.target.id !== 'code-snippet-container' && !snippetContainer.contains(e.target)) {
                            snippetContainer.style.display = "none";
                            document.removeEventListener('click', closeSnippetOnClickOutside);
                        }
                    });
                }
            });
            
        // Apply arrowheads if showArrows is true
        if (showArrows) {
            link.attr("marker-end", "url(#arrowhead)");
        }
        
        // Add some CSS styles for the snippet container
        const style = document.createElement('style');
        style.textContent = `
            #code-snippet-container {
                max-height: 400px;
                overflow-y: auto;
                position: fixed; /* Fixed positioning to prevent scroll issues */
                z-index: 1000;
                background-color: rgba(0, 0, 0, 0.9);
                color: #f1f1f1;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                display: none;
                max-width: 500px;
                white-space: pre-wrap;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                border-left: 3px solid #0066FC;
            }
            .code-snippet-content {
                margin: 10px 0;
            }
            .snippet-item {
                margin-bottom: 10px;
            }
            .snippet-info {
                margin: 0 0 5px 0;
                color: #aaa;
                font-style: italic;
            }
            .snippet-code {
                margin: 0;
                padding: 8px;
                background-color: #1E1E1E;
                border-radius: 3px;
                overflow-x: auto;
            }
            .highlight-line {
                background-color: rgba(255, 255, 0, 0.2);
                display: inline-block;
                width: 100%;
            }
            .snippet-code.inferred {
                color: #888;
                font-style: italic;
            }
            /* Pointer styling */
            .snippet-pointer {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: rotate(45deg);
                background-color: rgba(0, 0, 0, 0.9);
            }
            .left-pointer {
                left: -6px;
                top: 20px;
            }
            .right-pointer {
                right: -6px;
                top: 20px;
            }
            /* Styling for heading */
            #code-snippet-container h3 {
                margin-top: 5px;
                margin-bottom: 10px;
                color: #0066FC;
                font-size: 14px;
                font-weight: bold;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
            }
            /* Footer styling */
            .snippet-footer {
                border-top: 1px solid #333;
                padding-top: 8px;
                margin-top: 10px;
                text-align: right;
            }
        `;
        document.head.appendChild(style);
        
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
        
        // Create node groups
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
                tooltip.html(`<strong>${d.name}</strong><br>Type: ${d.type}<br>Location: ${d.location}<br>${d.writable ? '<span style="color:red">Writable</span>' : 'Read-only'}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                // Highlight the node
                d3.select(this).select("circle")
                    .transition()
                    .duration(200)
                    .attr("r", 12)
                    .attr("stroke-width", d.writable ? 3 : 1.5);
            })
            .on("mouseout", function(event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                // Return to normal size
                d3.select(this).select("circle")
                    .transition()
                    .duration(200)
                    .attr("r", 8)
                    .attr("stroke-width", d.writable ? 2 : 1);
            });
        
        // Add circles for nodes with special styling for writable variables
        node.append("circle")
            .attr("r", 8)
            .attr("fill", function(d) {
                if (d.writable) {
                    // Use net patterns for writable variables
                    if (d.group === "output") {
                        return "url(#net-output)";
                    } else if (d.group === "memory") {
                        return "url(#net-memory)";
                    }
                }
                return colors[d.group] || "#999";
            })
            .attr("stroke", d => d.writable ? "#FF0000" : "#FFFFFF")
            .attr("stroke-width", d => d.writable ? 2 : 1);
        
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
            
            // Calculate endpoints for links to leave space for arrows
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    // Shorten the line by 10 units (node radius + a bit of space)
                    return dist === 0 ? d.target.x : d.source.x + dx * (dist - 12) / dist;
                })
                .attr("y2", d => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    // Shorten the line by 10 units (node radius + a bit of space)
                    return dist === 0 ? d.target.y : d.source.y + dy * (dist - 12) / dist;
                });
            
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
            // Add "Variable Influence" option if it doesn't exist
            if (!document.getElementById("show-arrows-option")) {
                const arrowsOption = document.createElement("option");
                arrowsOption.id = "show-arrows-option";
                arrowsOption.value = "arrows";
                arrowsOption.text = "Variable Influence";
                filterSelect.appendChild(arrowsOption);
            } else {
                // Update existing option text
                document.getElementById("show-arrows-option").text = "Variable Influence";
            }
            
            filterSelect.addEventListener("change", function() {
                const filter = this.value;
                
                if (filter === "arrows") {
                    // Toggle arrows on
                    toggleArrows(true);
                    // Keep all nodes visible
                    node.style("display", "block");
                    link.style("display", "block");
                    return;
                } else {
                    // Toggle arrows off
                    toggleArrows(false);
                }
                
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
    generateDummyData,
    toggleArrows
}; 