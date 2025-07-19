// Metabolic Network Dashboard JavaScript

// Global variables
let cy;
let currentSpecies = null;
let currentNetwork = null;
let currentMetrics = null;
let labelsVisible = true;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Metabolic Network Dashboard initialized');
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Initialize Cytoscape
    initializeCytoscape();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load first species by default
    const speciesButtons = document.querySelectorAll('.btn-outline-primary');
    if (speciesButtons.length > 0) {
        loadSpecies('c.sativa');
    }
});

// Real-time clock
function startRealTimeUpdates() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Initialize Cytoscape.js
function initializeCytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node[type="metabolite"]',
                style: {
                    'background-color': '#e74c3c',
                    'label': 'data(label)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-wrap': 'wrap',
                    'text-max-width': '80px',
                    'font-size': '10px',
                    'font-weight': 'bold',
                    'width': '40px',
                    'height': '40px',
                    'border-width': '2px',
                    'border-color': '#fff',
                    'border-opacity': 1
                }
            },
            {
                selector: 'node[type="enzyme"]',
                style: {
                    'background-color': '#3498db',
                    'label': 'data(label)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-wrap': 'wrap',
                    'text-max-width': '100px',
                    'font-size': '9px',
                    'font-weight': 'bold',
                    'width': '50px',
                    'height': '30px',
                    'shape': 'rectangle',
                    'border-width': '2px',
                    'border-color': '#fff',
                    'border-opacity': 1
                }
            },
            {
                selector: 'edge[type="substrate"]',
                style: {
                    'width': 3,
                    'line-color': '#f39c12',
                    'target-arrow-color': '#f39c12',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(reaction)',
                    'font-size': '8px',
                    'text-rotation': 'autorotate',
                    'text-margin-y': '-10px'
                }
            },
            {
                selector: 'edge[type="product"]',
                style: {
                    'width': 3,
                    'line-color': '#27ae60',
                    'target-arrow-color': '#27ae60',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(reaction)',
                    'font-size': '8px',
                    'text-rotation': 'autorotate',
                    'text-margin-y': '-10px'
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-color': '#f39c12',
                    'border-width': '3px',
                    'border-opacity': 1
                }
            },
            {
                selector: 'edge:selected',
                style: {
                    'width': 5,
                    'line-color': '#f39c12'
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: 'end',
            animationDuration: 1000,
            nodeDimensionsIncludeLabels: true,
            fit: true,
            padding: 50
        }
    });
    
    // Add event listeners to Cytoscape
    setupCytoscapeEvents();
}

// Setup Cytoscape event listeners
function setupCytoscapeEvents() {
    // Node click events
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        showNodeDetails(node);
    });
    
    // Edge click events
    cy.on('tap', 'edge', function(evt) {
        const edge = evt.target;
        showEdgeDetails(edge);
    });
    
    // Background click to deselect
    cy.on('tap', function(evt) {
        if (evt.target === cy) {
            hideDetails();
        }
    });
    
    // Mouse over events for tooltips
    cy.on('mouseover', 'node', function(evt) {
        const node = evt.target;
        showNodeTooltip(node, evt.renderedPosition);
    });
    
    cy.on('mouseout', 'node', function(evt) {
        hideTooltip();
    });
}

// Load species data
function loadSpecies(species) {
    console.log(`Loading species: ${species}`);
    
    // Update button states
    updateSpeciesButtons(species);
    
    // Show loading state
    showLoading();
    
    // Load network data
    fetch(`/api/network/${species}`)
        .then(response => response.json())
        .then(data => {
            currentNetwork = data;
            currentSpecies = species;
            loadNetworkData(data);
        })
        .catch(error => {
            console.error('Error loading network:', error);
            showError('Failed to load network data');
        });
    
    // Load metrics
    fetch(`/api/metrics/${species}`)
        .then(response => response.json())
        .then(data => {
            currentMetrics = data;
            displayMetrics(data);
        })
        .catch(error => {
            console.error('Error loading metrics:', error);
        });
}

// Update species selection buttons
function updateSpeciesButtons(selectedSpecies) {
    const buttons = document.querySelectorAll('.btn-outline-primary');
    buttons.forEach(button => {
        if (button.onclick.toString().includes(selectedSpecies)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Load network data into Cytoscape
function loadNetworkData(network) {
    // Clear existing elements
    cy.elements().remove();
    
    // Add nodes
    network.nodes.forEach(node => {
        cy.add({
            group: 'nodes',
            data: {
                id: node.id,
                label: node.label,
                type: node.type,
                kegg_id: node.kegg_id,
                formula: node.formula,
                mass: node.mass,
                pathway: node.pathway,
                protein_id: node.protein_id,
                ec_number: node.ec_number,
                reaction: node.reaction
            }
        });
    });
    
    // Add edges
    network.edges.forEach(edge => {
        cy.add({
            group: 'edges',
            data: {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: edge.type,
                reaction: edge.reaction
            }
        });
    });
    
    // Apply layout
    const layout = cy.layout({
        name: 'cose',
        animate: 'end',
        animationDuration: 1000,
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 50
    });
    
    layout.run();
    
    // Display disconnected components
    displayDisconnectedComponents(network);
    
    // Hide loading
    hideLoading();
    
    // Show sections
    document.getElementById('metrics-section').style.display = 'block';
    document.getElementById('disconnected-section').style.display = 'block';
}

// Display network metrics
function displayMetrics(metrics) {
    const metricsContent = document.getElementById('metrics-content');
    
    const metricsHTML = `
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.total_metabolites || 0}</div>
                <div class="metric-label">Total Metabolites</div>
                <div class="metric-description">Compounds in network</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.total_enzymes || 0}</div>
                <div class="metric-label">Total Enzymes</div>
                <div class="metric-description">Proteins in network</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.total_edges || 0}</div>
                <div class="metric-label">Total Reactions</div>
                <div class="metric-description">Metabolic reactions</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.network_density ? metrics.network_density.toFixed(3) : 0}</div>
                <div class="metric-label">Network Density</div>
                <div class="metric-description">Connection density</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.disconnected_metabolites || 0}</div>
                <div class="metric-label">Disconnected Metabolites</div>
                <div class="metric-description">Unconnected compounds</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.disconnected_enzymes || 0}</div>
                <div class="metric-label">Disconnected Enzymes</div>
                <div class="metric-description">Unconnected proteins</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.number_of_components || 0}</div>
                <div class="metric-label">Network Components</div>
                <div class="metric-description">Connected subgraphs</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <div class="metric-value">${metrics.largest_component_size || 0}</div>
                <div class="metric-label">Largest Component</div>
                <div class="metric-description">Main network size</div>
            </div>
        </div>
    `;
    
    metricsContent.innerHTML = metricsHTML;
}

// Display disconnected components
function displayDisconnectedComponents(network) {
    // Display disconnected metabolites
    const metabolitesTable = document.getElementById('disconnected-metabolites-table').getElementsByTagName('tbody')[0];
    metabolitesTable.innerHTML = '';
    
    network.disconnected_metabolites.forEach(metabolite => {
        const row = metabolitesTable.insertRow();
        row.innerHTML = `
            <td><strong>${metabolite.name}</strong></td>
            <td>${metabolite.pathway || 'Unknown'}</td>
            <td>${metabolite.formula || 'N/A'}</td>
        `;
    });
    
    // Display disconnected enzymes
    const enzymesTable = document.getElementById('disconnected-enzymes-table').getElementsByTagName('tbody')[0];
    enzymesTable.innerHTML = '';
    
    network.disconnected_enzymes.forEach(enzyme => {
        const row = enzymesTable.insertRow();
        row.innerHTML = `
            <td><strong>${enzyme.name}</strong></td>
            <td>${enzyme.ec_number || 'N/A'}</td>
            <td>${enzyme.pathway || 'Unknown'}</td>
        `;
    });
}

// Show node details
function showNodeDetails(node) {
    const data = node.data();
    let details = '';
    
    if (data.type === 'metabolite') {
        details = `
            <h6>Metabolite: ${data.label}</h6>
            <p><strong>KEGG ID:</strong> ${data.kegg_id || 'N/A'}</p>
            <p><strong>Formula:</strong> ${data.formula || 'N/A'}</p>
            <p><strong>Mass:</strong> ${data.mass || 'N/A'}</p>
            <p><strong>Pathway:</strong> ${data.pathway || 'Unknown'}</p>
        `;
    } else if (data.type === 'enzyme') {
        details = `
            <h6>Enzyme: ${data.label}</h6>
            <p><strong>Protein ID:</strong> ${data.protein_id || 'N/A'}</p>
            <p><strong>EC Number:</strong> ${data.ec_number || 'N/A'}</p>
            <p><strong>Reaction:</strong> ${data.reaction || 'N/A'}</p>
            <p><strong>Pathway:</strong> ${data.pathway || 'Unknown'}</p>
        `;
    }
    
    showDetailsPanel(details);
}

// Show edge details
function showEdgeDetails(edge) {
    const data = edge.data();
    const details = `
        <h6>Reaction: ${data.reaction || 'Unknown'}</h6>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>From:</strong> ${data.source}</p>
        <p><strong>To:</strong> ${data.target}</p>
    `;
    
    showDetailsPanel(details);
}

// Show details panel
function showDetailsPanel(content) {
    // Remove existing details panel
    const existingPanel = document.querySelector('.network-info');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create new details panel
    const panel = document.createElement('div');
    panel.className = 'network-info';
    panel.innerHTML = content;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-1';
    closeBtn.onclick = hideDetails;
    panel.appendChild(closeBtn);
    
    document.getElementById('cy').appendChild(panel);
}

// Hide details panel
function hideDetails() {
    const panel = document.querySelector('.network-info');
    if (panel) {
        panel.remove();
    }
}

// Show node tooltip
function showNodeTooltip(node, position) {
    const data = node.data();
    const tooltip = document.createElement('div');
    tooltip.className = 'cytoscape-tooltip';
    tooltip.innerHTML = `
        <strong>${data.label}</strong><br>
        Type: ${data.type}<br>
        ${data.pathway ? `Pathway: ${data.pathway}` : ''}
    `;
    
    tooltip.style.left = position.x + 10 + 'px';
    tooltip.style.top = position.y - 10 + 'px';
    
    document.body.appendChild(tooltip);
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.querySelector('.cytoscape-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Network control functions
function resetView() {
    cy.fit();
    cy.center();
}

function toggleLabels() {
    labelsVisible = !labelsVisible;
    
    if (labelsVisible) {
        cy.nodes().style('label', 'data(label)');
    } else {
        cy.nodes().style('label', '');
    }
}

function exportNetwork() {
    if (!currentNetwork) {
        showError('No network data to export');
        return;
    }
    
    const dataStr = JSON.stringify(currentNetwork, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSpecies}_metabolic_network.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess('Network exported successfully');
}

// Utility functions
function showLoading() {
    const cyContainer = document.getElementById('cy');
    cyContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="loading"></div> Loading network...</div>';
}

function hideLoading() {
    // Cytoscape will handle the display
}

function showSuccess(message) {
    showAlert(message, 'success');
}

function showError(message) {
    showAlert(message, 'danger');
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + R to reset view
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            resetView();
        }
        
        // Ctrl/Cmd + E to export
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            exportNetwork();
        }
        
        // L to toggle labels
        if (event.key === 'l' || event.key === 'L') {
            event.preventDefault();
            toggleLabels();
        }
    });
}

// Search functionality
function searchNetwork(query) {
    if (!query) {
        cy.nodes().removeClass('node-highlight');
        return;
    }
    
    const nodes = cy.nodes();
    nodes.removeClass('node-highlight');
    
    nodes.forEach(node => {
        const data = node.data();
        if (data.label.toLowerCase().includes(query.toLowerCase()) ||
            (data.pathway && data.pathway.toLowerCase().includes(query.toLowerCase()))) {
            node.addClass('node-highlight');
        }
    });
}

// Network analysis functions
function highlightPathway(pathway) {
    cy.nodes().removeClass('node-highlight');
    
    cy.nodes().forEach(node => {
        const data = node.data();
        if (data.pathway === pathway) {
            node.addClass('node-highlight');
        }
    });
}

function showConnectedComponents() {
    const components = cy.elements().components();
    console.log(`Network has ${components.length} connected components`);
    
    components.forEach((component, index) => {
        console.log(`Component ${index + 1}: ${component.nodes().length} nodes, ${component.edges().length} edges`);
    });
}

// Performance monitoring
function logPerformance() {
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    }
}

// Log performance on page load
window.addEventListener('load', logPerformance); 