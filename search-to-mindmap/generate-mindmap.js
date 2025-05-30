import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI client will be initialized when needed
let openai;

// Generate mind map structure from search results
async function extractMindMapStructure(searchPayload, query) {
  // Initialize OpenAI client on first use
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  const systemPrompt = `You are a knowledge organization expert creating mind maps from search results.
  Analyze the content and create a comprehensive, hierarchical mind map structure.
  Focus on organizing information in a logical, easy-to-understand visual hierarchy.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `Create a mind map from these search results about "${query}":
        
        ${JSON.stringify(searchPayload.map(r => ({
          title: r.metadata?.title || r.title,
          content: r.markdown?.substring(0, 1500),
          url: r.url
        })), null, 2)}
        
        Return a JSON object with:
        1. title: Mind map title
        2. description: Brief description
        3. data: The hierarchical data structure with:
           - name: Node name
           - description: Node description (optional)
           - value: Node importance (1-100)
           - children: Array of child nodes (recursive structure)
        4. metadata: Object containing:
           - totalNodes: Total number of nodes
           - keyInsights: Array of key insights
           - relatedTopics: Array of related topics
        
        Structure the data hierarchically with the main topic as root, major categories as primary branches, and detailed concepts as sub-branches. Each node should have a meaningful description.`
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

// Generate HTML for the mind map
function generateHTML(mindMapData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mindMapData.title} - Interactive Mindmap</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #ffffff;
            overflow: hidden;
        }
        
        #container {
            width: 100vw;
            height: 100vh;
            position: relative;
            background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f0f 100%);
        }
        
        .controls {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .control-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 16px;
            margin: 5px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }
        
        .info-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .info-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #61dafb;
        }
        
        .info-description {
            font-size: 0.9rem;
            line-height: 1.5;
            color: #e0e0e0;
        }
        
        .node {
            cursor: pointer;
        }
        
        .node circle {
            stroke-width: 3px;
            transition: all 0.3s;
        }
        
        .node:hover circle {
            stroke-width: 5px;
            filter: drop-shadow(0 0 10px currentColor);
        }
        
        .node text {
            font-size: 12px;
            pointer-events: none;
            fill: white;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
        }
        
        .link {
            fill: none;
            stroke: #4a5568;
            stroke-width: 2px;
            opacity: 0.6;
            transition: all 0.3s;
        }
        
        .link:hover {
            stroke-width: 3px;
            opacity: 1;
        }
        
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 0.9rem;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 300px;
        }
        
        .search-box {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 10px 20px;
        }
        
        .search-input {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 15px;
            border-radius: 8px;
            width: 300px;
            font-size: 0.9rem;
        }
        
        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        .legend {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin: 5px 0;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div id="container">
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search nodes..." id="searchInput">
        </div>
        
        <div class="controls">
            <button class="control-btn" onclick="zoomIn()">Zoom In</button>
            <button class="control-btn" onclick="zoomOut()">Zoom Out</button>
            <button class="control-btn" onclick="resetView()">Reset</button>
            <button class="control-btn" onclick="expandAll()">Expand All</button>
            <button class="control-btn" onclick="collapseAll()">Collapse All</button>
        </div>
        
        <div class="info-panel">
            <div class="info-title" id="infoTitle">${mindMapData.title}</div>
            <div class="info-description" id="infoDescription">Click on nodes to explore the mindmap</div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #61dafb;"></div>
                <span>Main Topic</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #fbbf24;"></div>
                <span>Primary Branches</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #a78bfa;"></div>
                <span>Sub-topics</span>
            </div>
        </div>
        
        <div class="tooltip" id="tooltip"></div>
    </div>
    
    <script>
        // Data
        const data = ${JSON.stringify(mindMapData.data)};
        
        // Dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create SVG
        const svg = d3.select("#container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
            
        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on("zoom", zoomed);
            
        svg.call(zoom);
        
        // Create container for zoomable content
        const g = svg.append("g");
        
        // Layout based on style
        let root;
        const style = "radial";
        
        if (style === "radial") {
            // Radial tree layout
            root = d3.hierarchy(data);
            const treeLayout = d3.tree()
                .size([2 * Math.PI, Math.min(width, height) / 2 - 100])
                .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
            
            treeLayout(root);
            
            // Convert to radial coordinates
            root.descendants().forEach(d => {
                const angle = d.x;
                const radius = d.y;
                d.x = centerX + radius * Math.cos(angle - Math.PI / 2);
                d.y = centerY + radius * Math.sin(angle - Math.PI / 2);
            });
        } else if (style === "tree") {
            // Traditional tree layout
            root = d3.hierarchy(data);
            const treeLayout = d3.tree()
                .size([width - 100, height - 200]);
            
            treeLayout(root);
            
            root.descendants().forEach(d => {
                d.x += 50;
                d.y += 100;
            });
        } else {
            // Circular layout
            root = d3.hierarchy(data);
            const pack = d3.pack()
                .size([width - 100, height - 100])
                .padding(20);
            
            pack(root.sum(d => d.value || 50));
            
            root.descendants().forEach(d => {
                d.x += 50;
                d.y += 50;
            });
        }
        
        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain([0, 1, 2, 3])
            .range(["#61dafb", "#fbbf24", "#a78bfa", "#34d399"]);
        
        // Draw links
        const links = g.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d => {
                if (style === "radial") {
                    return "M" + d.source.x + "," + d.source.y +
                           "C" + (d.source.x + d.target.x) / 2 + "," + d.source.y +
                           " " + (d.source.x + d.target.x) / 2 + "," + d.target.y +
                           " " + d.target.x + "," + d.target.y;
                } else {
                    return "M" + d.source.x + "," + d.source.y +
                           "C" + d.source.x + "," + (d.source.y + d.target.y) / 2 +
                           " " + d.target.x + "," + (d.source.y + d.target.y) / 2 +
                           " " + d.target.x + "," + d.target.y;
                }
            });
        
        // Draw nodes
        const nodes = g.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
            .on("click", clicked)
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);
        
        // Add circles
        nodes.append("circle")
            .attr("r", d => Math.max(20 - d.depth * 3, 8))
            .attr("fill", d => colorScale(d.depth))
            .attr("stroke", d => colorScale(d.depth));
        
        // Add labels
        nodes.append("text")
            .attr("dy", "0.3em")
            .attr("x", d => d.children ? -10 : 10)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
            .style("font-size", d => Math.max(14 - d.depth * 2, 10) + "px");
        
        // Functions
        function zoomed(event) {
            g.attr("transform", event.transform);
        }
        
        function zoomIn() {
            svg.transition().call(zoom.scaleBy, 1.3);
        }
        
        function zoomOut() {
            svg.transition().call(zoom.scaleBy, 0.7);
        }
        
        function resetView() {
            svg.transition().call(zoom.transform, d3.zoomIdentity);
        }
        
        function clicked(event, d) {
            document.getElementById("infoTitle").textContent = d.data.name;
            document.getElementById("infoDescription").textContent = d.data.description || "No description available";
            
            // Highlight path
            links.style("stroke", l => {
                if (l.source === d || l.target === d) return "#61dafb";
                return "#4a5568";
            }).style("stroke-width", l => {
                if (l.source === d || l.target === d) return 3;
                return 2;
            });
            
            // Pulse effect
            d3.select(this).select("circle")
                .classed("pulse", true);
        }
        
        function showTooltip(event, d) {
            const tooltip = document.getElementById("tooltip");
            tooltip.style.opacity = "1";
            tooltip.style.left = event.pageX + 10 + "px";
            tooltip.style.top = event.pageY + 10 + "px";
            tooltip.innerHTML = "<strong>" + d.data.name + "</strong><br>" + 
                              (d.data.description || "Depth: " + d.depth);
        }
        
        function hideTooltip() {
            document.getElementById("tooltip").style.opacity = "0";
        }
        
        // Search functionality
        document.getElementById("searchInput").addEventListener("input", function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            nodes.style("opacity", d => {
                if (searchTerm === "") return 1;
                const matches = d.data.name.toLowerCase().includes(searchTerm) ||
                               (d.data.description && d.data.description.toLowerCase().includes(searchTerm));
                return matches ? 1 : 0.2;
            });
            
            links.style("opacity", l => {
                if (searchTerm === "") return 0.6;
                const sourceMatches = l.source.data.name.toLowerCase().includes(searchTerm);
                const targetMatches = l.target.data.name.toLowerCase().includes(searchTerm);
                return (sourceMatches || targetMatches) ? 0.6 : 0.1;
            });
        });
        
        // Expand/Collapse functionality
        function expandAll() {
            nodes.style("display", "block");
            links.style("display", "block");
        }
        
        function collapseAll() {
            nodes.style("display", d => d.depth <= 1 ? "block" : "none");
            links.style("display", l => l.target.depth <= 1 ? "block" : "none");
        }
        
        // Initial animation
        nodes.style("opacity", 0)
            .transition()
            .duration(1000)
            .delay((d, i) => i * 10)
            .style("opacity", 1);
            
        links.style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 0.6);
    </script>
</body>
</html>`;
}

// Main mind map generation function
export async function generateMindMap(searchPayload, query) {
  console.log(`🧠 Found ${searchPayload.length} results`);

  // Extract mind map structure with GPT-4
  const mindMapData = await extractMindMapStructure(searchPayload, query);

  // Generate HTML
  const html = generateHTML(mindMapData);

  // Save files
  const outputDir = path.join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });
  
  await fs.writeFile(path.join(outputDir, 'mindmap.html'), html);
  await fs.writeFile(path.join(outputDir, 'mindmap_data.json'), JSON.stringify(mindMapData, null, 2));

  console.log(`\n✅ Mind map created successfully!`);
  console.log(`📁 Output saved to: ${outputDir}`);
  console.log(`🌐 Open mindmap.html in your browser to explore the interactive mind map`);

  return mindMapData;
}