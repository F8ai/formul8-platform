// Comprehensive Metabolomics Dashboard JavaScript

// Global variables
let cy;
let currentSpecies = null;
let currentNetwork = null;
let currentMetrics = null;
let labelsVisible = true;
let speciesData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Comprehensive Metabolomics Dashboard initialized');
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Initialize Cytoscape
    initializeCytoscape();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load dashboard summary and species
    loadDashboardSummary();
    loadSpeciesList();
    loadReactionData();
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

// Load dashboard summary
function loadDashboardSummary() {
    fetch('/api/summary')
        .then(response => response.json())
        .then(data => {
            displayDatasetSummary(data);
            displayReactionSummary(data);
        })
        .catch(error => {
            console.error('Error loading dashboard summary:', error);
        });
}

// Load reaction data
function loadReactionData() {
    Promise.all([
        fetch('/api/reaction-metrics').then(response => response.json()),
        fetch('/api/reactions').then(response => response.json())
    ])
    .then(([metrics, reactions]) => {
        displayReactionMetrics(metrics);
        displayReactionCharts(metrics);
    })
    .catch(error => {
        console.error('Error loading reaction data:', error);
    });
}

// Display dataset summary
function displayDatasetSummary(summary) {
    const stats = summary.statistics || {};
    
    document.getElementById('total-compounds').textContent = stats.total_compounds || 0;
    document.getElementById('total-enzymes').textContent = stats.total_enzymes || 0;
    document.getElementById('total-pathways').textContent = stats.total_pathways || 0;
    document.getElementById('total-species').textContent = summary.species_coverage?.length || 0;
}

// Display reaction summary
function displayReactionSummary(summary) {
    const reactionData = summary.reaction_annotations || {};
    
    document.getElementById('total-reactions').textContent = reactionData.total_annotated_reactions || 0;
    document.getElementById('enzymes-with-reactions').textContent = reactionData.enzymes_with_reactions || 0;
    document.getElementById('total-annotated-reactions').textContent = reactionData.total_annotated_reactions || 0;
    
    const annotationRate = reactionData.annotation_rate || 0;
    document.getElementById('annotation-rate').textContent = (annotationRate * 100).toFixed(1) + '%';
}

// Display reaction metrics
function displayReactionMetrics(metrics) {
    console.log('Reaction metrics:', metrics);
}

// Display reaction charts
function displayReactionCharts(metrics) {
    // Display reaction types
    const reactionTypes = metrics.reaction_type_distribution || {};
    const reactionTypesContainer = document.getElementById('reaction-types-chart');
    
    if (Object.keys(reactionTypes).length > 0) {
        reactionTypesContainer.innerHTML = '';
        Object.entries(reactionTypes).forEach(([type, count]) => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary me-2 mb-2';
            badge.textContent = `${type}: ${count}`;
            reactionTypesContainer.appendChild(badge);
        });
    } else {
        reactionTypesContainer.innerHTML = '<p class="text-muted">No reaction type data available</p>';
    }
    
    // Display EC class distribution
    const ecClasses = metrics.ec_class_distribution || {};
    const ecClassContainer = document.getElementById('ec-class-chart');
    
    if (Object.keys(ecClasses).length > 0) {
        ecClassContainer.innerHTML = '';
        Object.entries(ecClasses).forEach(([ecClass, count]) => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-success me-2 mb-2';
            badge.textContent = `EC ${ecClass}: ${count}`;
            ecClassContainer.appendChild(badge);
        });
    } else {
        ecClassContainer.innerHTML = '<p class="text-muted">No EC class data available</p>';
    }
}

// Load species list
function loadSpeciesList() {
    fetch('/api/species')
        .then(response => response.json())
        .then(data => {
            speciesData = data;
            displaySpeciesButtons(data);
            // Load first species by default
            const speciesIds = Object.keys(data);
            if (speciesIds.length > 0) {
                loadSpecies(speciesIds[0]);
            }
        })
        .catch(error => {
            console.error('Error loading species list:', error);
        });
}

// Display species buttons
function displaySpeciesButtons(species) {
    const container = document.getElementById('species-buttons');
    container.innerHTML = '';
    
    Object.entries(species).forEach(([speciesId, speciesInfo]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-outline-primary';
        button.onclick = () => loadSpecies(speciesId);
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-dna me-1';
        
        const text = document.createTextNode(speciesInfo.name);
        
        button.appendChild(icon);
        button.appendChild(text);
        container.appendChild(button);
    });
}

// Initialize Cytoscape with enhanced hover functionality
function initializeCytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            // Metabolite/Compound nodes (small dots)
            {
                selector: 'node[type="metabolite"]',
                style: {
                    'shape': 'circle',
                    'width': 6,
                    'height': 6,
                    'background-color': '#4CAF50',
                    'border-color': '#2E7D32',
                    'border-width': 1,
                    'label': '', // No text labels
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': 0,
                    'z-index': 1,
                    'opacity': 0.8
                }
            },
            // Reaction edges (lines with enzyme info)
            {
                selector: 'edge[type="reaction"]',
                style: {
                    'width': 2,
                    'line-color': '#2196F3',
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#2196F3',
                    'arrow-scale': 0.6,
                    'label': '', // No text labels
                    'font-size': 0
                }
            },
            // Hover effects for nodes
            {
                selector: 'node:hover',
                style: {
                    'width': 12,
                    'height': 12,
                    'border-width': 2,
                    'border-color': '#FFD700',
                    'z-index': 10
                }
            },
            // Hover effects for edges
            {
                selector: 'edge:hover',
                style: {
                    'width': 4,
                    'line-color': '#FFD700',
                    'target-arrow-color': '#FFD700',
                    'z-index': 10
                }
            },
            // Highlighted connected elements
            {
                selector: '.highlighted',
                style: {
                    'width': 10,
                    'height': 10,
                    'border-width': 2,
                    'border-color': '#FFD700',
                    'background-color': '#FFF59D',
                    'z-index': 5
                }
            },
            {
                selector: 'edge.highlighted',
                style: {
                    'width': 3,
                    'line-color': '#FFD700',
                    'target-arrow-color': '#FFD700',
                    'z-index': 5
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: 'end',
            animationDuration: 1000,
            nodeDimensionsIncludeLabels: false,
            fit: true,
            padding: 50
        }
    });

    // Enhanced hover functionality
    let tooltip = null;
    let highlightedElements = [];

    // Create tooltip element
    function createTooltip() {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'cytoscape-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 10px 14px;
                border-radius: 6px;
                font-size: 12px;
                max-width: 350px;
                z-index: 1000;
                pointer-events: none;
                display: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.1);
                backdrop-filter: blur(4px);
                line-height: 1.4;
            `;
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }

    // Show tooltip with metabolite/compound information
    function showNodeTooltip(node, event) {
        const tooltip = createTooltip();
        const data = node.data();
        
        let content = `<strong>${data.label || data.id}</strong><br>`;
        content += `<strong>Type:</strong> Metabolite/Compound<br>`;
        
        if (data.formula) content += `<strong>Formula:</strong> ${data.formula}<br>`;
        if (data.molecular_weight) content += `<strong>MW:</strong> ${data.molecular_weight}<br>`;
        if (data.category) content += `<strong>Category:</strong> ${data.category}<br>`;
        if (data.kegg_id) content += `<strong>KEGG:</strong> ${data.kegg_id}<br>`;
        if (data.pubchem_id) content += `<strong>PubChem:</strong> ${data.pubchem_id}<br>`;
        if (data.source) content += `<strong>Source:</strong> ${data.source}`;
        
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
    }

    // Show tooltip with reaction/enzyme information
    function showEdgeTooltip(edge, event) {
        const tooltip = createTooltip();
        const data = edge.data();
        
        let content = `<strong>Reaction</strong><br>`;
        if (data.reaction_name) content += `<strong>Reaction:</strong> ${data.reaction_name}<br>`;
        if (data.equation) content += `<strong>Equation:</strong> ${data.equation}<br>`;
        if (data.enzyme_name) content += `<strong>Enzyme:</strong> ${data.enzyme_name}<br>`;
        if (data.ec_number) content += `<strong>EC Number:</strong> ${data.ec_number}<br>`;
        content += `<strong>From:</strong> ${data.source}<br>`;
        content += `<strong>To:</strong> ${data.target}<br>`;
        if (data.source) content += `<strong>Data Source:</strong> ${data.source}`;
        
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
    }

    // Hide tooltip
    function hideTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // Clear highlighted elements
    function clearHighlights() {
        highlightedElements.forEach(elem => {
            elem.removeClass('highlighted');
        });
        highlightedElements = [];
    }

    // Highlight connected elements
    function highlightConnected(element) {
        clearHighlights();
        
        if (element.isNode()) {
            // Highlight connected edges (reactions)
            const connectedEdges = element.connectedEdges();
            connectedEdges.addClass('highlighted');
            highlightedElements.push(connectedEdges);
            
            // Highlight connected nodes (other metabolites)
            const connectedNodes = element.neighborhood().nodes();
            connectedNodes.addClass('highlighted');
            highlightedElements.push(connectedNodes);
        } else if (element.isEdge()) {
            // Highlight source and target nodes (substrates and products)
            const sourceNode = element.source();
            const targetNode = element.target();
            sourceNode.addClass('highlighted');
            targetNode.addClass('highlighted');
            highlightedElements.push(sourceNode);
            highlightedElements.push(targetNode);
            
            // Highlight the edge itself
            element.addClass('highlighted');
            highlightedElements.push(element);
        }
    }

    // Node hover events (metabolites/compounds)
    cy.on('mouseover', 'node', function(event) {
        const node = event.target;
        showNodeTooltip(node, event.originalEvent);
        highlightConnected(node);
    });

    cy.on('mouseout', 'node', function(event) {
        hideTooltip();
        clearHighlights();
    });

    // Edge hover events (reactions/enzymes)
    cy.on('mouseover', 'edge', function(event) {
        const edge = event.target;
        showEdgeTooltip(edge, event.originalEvent);
        highlightConnected(edge);
    });

    cy.on('mouseout', 'edge', function(event) {
        hideTooltip();
        clearHighlights();
    });

    // Pan and zoom events
    cy.on('pan', hideTooltip);
    cy.on('zoom', hideTooltip);

    // Click events (optional - for additional interaction)
    cy.on('tap', 'node', function(event) {
        const node = event.target;
        const data = node.data();
        showAlert(`Selected Metabolite: ${data.label || data.id}`, 'info');
    });

    cy.on('tap', 'edge', function(event) {
        const edge = event.target;
        const data = edge.data();
        showAlert(`Reaction: ${data.source} → ${data.target} (${data.enzyme_name || data.enzyme})`, 'info');
    });

    // Background click to clear selection
    cy.on('tap', function(event) {
        if (event.target === cy) {
            hideTooltip();
            clearHighlights();
        }
    });
}

// Load species data
function loadSpecies(species) {
    console.log(`Loading species: ${species}`);
    
    // Update button states
    updateSpeciesButtons(species);
    
    // Show loading state
    showLoading();
    
    // Set a timeout to hide loading if it takes too long
    const loadingTimeout = setTimeout(() => {
        hideLoading();
        showError('Network loading timeout - please try again');
    }, 15000); // 15 second timeout
    
    // Load network data
    fetch(`/api/network/${species}`)
        .then(response => response.json())
        .then(data => {
            clearTimeout(loadingTimeout);
            currentNetwork = data;
            currentSpecies = species;
            loadNetworkData(data);
        })
        .catch(error => {
            clearTimeout(loadingTimeout);
            console.error('Error loading network:', error);
            hideLoading();
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
            showError('Failed to load metrics');
        });
}

// Update species button states
function updateSpeciesButtons(selectedSpecies) {
    const buttons = document.querySelectorAll('#species-buttons .btn');
    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.onclick && button.onclick.toString().includes(selectedSpecies)) {
            button.classList.add('active');
        }
    });
}

// Load network data into Cytoscape
function loadNetworkData(network) {
    console.log('Loading network data:', network);
    
    try {
        // Clear existing elements
        cy.elements().remove();
        
        if (!network.nodes || network.nodes.length === 0) {
            showAlert('No network data available for this species', 'warning');
            hideLoading();
            return;
        }
        
        console.log(`Adding ${network.nodes.length} nodes and ${network.edges.length} edges`);
        
        // Show all nodes and edges
        const debugMode = false;
        const nodesToAdd = debugMode ? network.nodes.slice(0, 100) : network.nodes;
        const edgesToAdd = debugMode ? network.edges.slice(0, 50) : network.edges;
        
        console.log(`Loading full network: ${nodesToAdd.length} nodes and ${edgesToAdd.length} edges`);
        
        // Test: Log first few nodes to verify data
        console.log('First 5 nodes:', nodesToAdd.slice(0, 5).map(n => ({id: n.id, label: n.label})));
        console.log('First 5 edges:', edgesToAdd.slice(0, 5).map(e => ({id: e.id, source: e.source, target: e.target})));
        
        // Add nodes in batches for better performance
        const batchSize = 500; // Larger batches for full network
        for (let i = 0; i < nodesToAdd.length; i += batchSize) {
            const batch = nodesToAdd.slice(i, i + batchSize);
            const elements = batch.map(node => ({
                group: 'nodes',
                data: {
                    id: node.id,
                    label: node.label,
                    type: node.type,
                    category: node.category,
                    source: node.source,
                    formula: node.formula,
                    molecular_weight: node.molecular_weight,
                    ec_number: node.ec_number,
                    kegg_id: node.kegg_id,
                    pubchem_id: node.pubchem_id,
                    uniprot_id: node.uniprot_id
                }
            }));
            cy.add(elements);
            console.log(`Added batch ${Math.floor(i/batchSize) + 1}: ${batch.length} nodes`);
        }
        
        // Now add edges after all nodes are added
        for (let i = 0; i < edgesToAdd.length; i += batchSize) {
            const batch = edgesToAdd.slice(i, i + batchSize);
            
            // Filter out edges with invalid source or target nodes
            const validEdges = batch.filter(edge => {
                const sourceExists = cy.getElementById(edge.source).length > 0;
                const targetExists = cy.getElementById(edge.target).length > 0;
                
                if (!sourceExists || !targetExists) {
                    console.warn(`Skipping invalid edge ${edge.id}: source=${edge.source} (exists: ${sourceExists}), target=${edge.target} (exists: ${targetExists})`);
                    return false;
                }
                return true;
            });
            
            const elements = validEdges.map(edge => ({
                group: 'edges',
                data: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: edge.type,
                    enzyme: edge.enzyme
                }
            }));
            cy.add(elements);
            console.log(`Added batch ${Math.floor(i/batchSize) + 1}: ${validEdges.length} valid edges (filtered out ${batch.length - validEdges.length} invalid edges)`);
        }
        
        console.log('Elements added, applying layout...');
        console.log('Total elements in cy:', cy.elements().length);
        console.log('Total nodes in cy:', cy.nodes().length);
        console.log('Total edges in cy:', cy.edges().length);
        
        // Debug: Check if nodes are visible
        const visibleNodes = cy.nodes(':visible');
        console.log('Visible nodes:', visibleNodes.length);
        
        // Debug: Check node positions
        const nodePositions = cy.nodes().map(node => ({
            id: node.id(),
            position: node.position(),
            visible: node.visible()
        }));
        console.log('First 5 node positions:', nodePositions.slice(0, 5));
        
        // Apply simple grid layout for immediate visibility
        console.log('Starting simple grid layout...');
        const gridLayout = cy.layout({
            name: 'grid',
            cols: Math.ceil(Math.sqrt(nodesToAdd.length)), // Square grid
            rows: Math.ceil(nodesToAdd.length / Math.ceil(Math.sqrt(nodesToAdd.length))),
            animate: false, // No animation for speed
            nodeDimensionsIncludeLabels: false,
            fit: true,
            padding: 50,
            stop: function() {
                console.log('Grid layout completed');
                console.log('Nodes after grid layout:', cy.nodes().length);
                console.log('Edges after grid layout:', cy.edges().length);
                
                // Force fit to ensure all nodes are visible
                cy.fit();
                cy.center();
                
                hideLoading();
                showSuccess(`Loaded ${network.nodes.length} nodes and ${network.edges.length} edges with grid layout`);
            }
        });
        
        gridLayout.run();
        
        // Debug: Take a screenshot after layout to see what's rendered
        setTimeout(() => {
            console.log('Taking debug screenshot...');
            console.log('Current node count:', cy.nodes().length);
            console.log('Current edge count:', cy.edges().length);
            console.log('Viewport:', cy.viewport());
            console.log('Pan:', cy.pan());
            console.log('Zoom:', cy.zoom());
            
            // Try to export the network as image
            try {
                const png = cy.png({
                    full: true,
                    scale: 1,
                    quality: 1
                });
                console.log('Network PNG data length:', png.length);
                
                // Create a download link for debugging
                const link = document.createElement('a');
                link.download = 'network-debug.png';
                link.href = png;
                link.click();
                console.log('Screenshot saved as network-debug.png');
            } catch (error) {
                console.error('Failed to take screenshot:', error);
            }
        }, 5000); // Take screenshot 5 seconds after layout starts
        
        // Display disconnected components
        displayDisconnectedComponents(network);
        
    } catch (error) {
        console.error('Error loading network data:', error);
        hideLoading();
        showError('Failed to load network data: ' + error.message);
    }
}

// Display metrics
function displayMetrics(metrics) {
    console.log('Displaying metrics:', metrics);
    
    const metricsSection = document.getElementById('metrics-section');
    const metricsContent = document.getElementById('metrics-content');
    
    if (!metrics || Object.keys(metrics).length === 0) {
        metricsSection.style.display = 'none';
        return;
    }
    
    metricsSection.style.display = 'block';
    
    const metricsData = [
        {
            title: 'Total Metabolites',
            value: metrics.metabolites || 0,
            description: 'Compounds in network',
            icon: 'fas fa-atom',
            color: 'primary',
            metricType: 'metabolites',
            clickable: true
        },
        {
            title: 'Total Enzymes',
            value: metrics.enzymes || 0,
            description: 'Proteins in network',
            icon: 'fas fa-dna',
            color: 'success',
            metricType: 'enzymes',
            clickable: true
        },
        {
            title: 'Total Reactions',
            value: metrics.reactions || 0,
            description: 'Metabolic reactions',
            icon: 'fas fa-exchange-alt',
            color: 'info',
            metricType: 'reactions',
            clickable: true
        },
        {
            title: 'Network Density',
            value: metrics.connectivity_ratio || 0,
            description: 'Connection density',
            icon: 'fas fa-project-diagram',
            color: 'warning',
            metricType: 'network_density',
            clickable: false
        },
        {
            title: 'Disconnected Metabolites',
            value: metrics.disconnected_metabolites || 0,
            description: 'Unconnected compounds',
            icon: 'fas fa-unlink',
            color: 'danger',
            metricType: 'disconnected_metabolites',
            clickable: true
        },
        {
            title: 'Connected Metabolites',
            value: metrics.connected_metabolites || 0,
            description: 'Connected compounds',
            icon: 'fas fa-link',
            color: 'success',
            metricType: 'connected_metabolites',
            clickable: true
        },
        {
            title: 'Network Components',
            value: metrics.network_components || 0,
            description: 'Connected subgraphs',
            icon: 'fas fa-sitemap',
            color: 'secondary',
            metricType: 'network_components',
            clickable: true
        },
        {
            title: 'Largest Component',
            value: metrics.largest_component || 0,
            description: 'Main network size',
            icon: 'fas fa-expand',
            color: 'dark',
            metricType: 'largest_component',
            clickable: true
        }
    ];
    
    metricsContent.innerHTML = metricsData.map(metric => `
        <div class="col-md-3 mb-3">
            <div class="card text-center ${metric.clickable ? 'clickable-metric' : ''}" 
                 ${metric.clickable ? `onclick="showMetricEntities('${metric.metricType}', '${metric.title}')"` : ''}
                 style="${metric.clickable ? 'cursor: pointer; transition: transform 0.2s ease-in-out;' : ''}">
                <div class="card-body">
                    <i class="${metric.icon} fa-2x text-${metric.color} mb-2"></i>
                    <h4 class="card-title text-${metric.color}">${metric.value}</h4>
                    <h6 class="card-subtitle mb-2 text-muted">${metric.title}</h6>
                    <p class="card-text small">${metric.description}</p>
                    ${metric.clickable ? '<small class="text-muted"><i class="fas fa-mouse-pointer me-1"></i>Click to view</small>' : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add hover effects for clickable metrics
    if (currentSpecies) {
        const clickableCards = document.querySelectorAll('.clickable-metric');
        clickableCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            });
        });
    }
    
    // Show data sources if available
    if (metrics.data_sources && metrics.data_sources.length > 0) {
        const sourcesHtml = metrics.data_sources.map(source => 
            `<span class="badge bg-info me-1">${source}</span>`
        ).join('');
        
        metricsContent.innerHTML += `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-database me-2"></i>
                    <strong>Data Sources:</strong> ${sourcesHtml}
                </div>
            </div>
        `;
    }
}

// Show metric entities in modal
function showMetricEntities(metricType, metricTitle) {
    if (!currentSpecies) {
        showError('No species selected');
        return;
    }
    
    showLoading();
    
    let endpoint = '';
    if (metricType === 'network_components') {
        endpoint = `/api/metrics/${currentSpecies}/network-components`;
    } else {
        endpoint = `/api/metrics/${currentSpecies}/entities/${metricType}`;
    }
    
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.error) {
                showError(data.error);
                return;
            }
            
            let modalContent = '';
            let entities = [];
            
            if (metricType === 'network_components') {
                // Handle network components data
                modalContent = `
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-sitemap me-2"></i>
                            ${metricTitle} - ${currentSpecies}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card bg-light">
                                    <div class="card-body text-center">
                                        <h4 class="text-primary">${data.total_components}</h4>
                                        <p class="mb-0">Total Components</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card bg-light">
                                    <div class="card-body text-center">
                                        <h4 class="text-success">${data.largest_component_size}</h4>
                                        <p class="mb-0">Largest Component</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h6>Component Details:</h6>
                        <div class="accordion" id="componentsAccordion">
                `;
                
                data.components.forEach((component, index) => {
                    modalContent += `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#component${index}">
                                    Component ${component.component_id} (${component.size} metabolites)
                                </button>
                            </h2>
                            <div id="component${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#componentsAccordion">
                                <div class="accordion-body">
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Formula</th>
                                                    <th>Pathway</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                    `;
                    
                    component.metabolites.forEach(metabolite => {
                        modalContent += `
                            <tr>
                                <td>${metabolite.name}</td>
                                <td>${metabolite.formula || 'N/A'}</td>
                                <td>${metabolite.pathway || 'N/A'}</td>
                            </tr>
                        `;
                    });
                    
                    modalContent += `
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                modalContent += `
                        </div>
                    </div>
                `;
            } else {
                // Handle regular entity data
                entities = data.entities || [];
                
                modalContent = `
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-list me-2"></i>
                            ${metricTitle} - ${currentSpecies}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Showing ${entities.length} entities
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Details</th>
                                        <th>Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                entities.forEach(entity => {
                    let details = '';
                    if (entity.type === 'metabolite') {
                        details = entity.formula || entity.pathway || 'N/A';
                    } else if (entity.type === 'enzyme') {
                        details = entity.ec_number || `Reactions: ${entity.reaction_count}` || 'N/A';
                    } else if (entity.type === 'reaction') {
                        details = `${entity.substrate} → ${entity.product}`;
                    }
                    
                    modalContent += `
                        <tr>
                            <td><strong>${entity.name}</strong></td>
                            <td><span class="badge bg-${entity.type === 'metabolite' ? 'primary' : entity.type === 'enzyme' ? 'success' : 'info'}">${entity.type}</span></td>
                            <td>${details}</td>
                            <td><span class="badge bg-secondary">${entity.source || 'Unknown'}</span></td>
                        </tr>
                    `;
                });
                
                modalContent += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
            
            // Create and show modal
            const modalId = 'metricEntitiesModal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.id = modalId;
                modal.innerHTML = `
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            ${modalContent}
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                modal.querySelector('.modal-content').innerHTML = modalContent;
            }
            
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        })
        .catch(error => {
            hideLoading();
            console.error('Error loading metric entities:', error);
            showError('Failed to load metric entities');
        });
}

// Display disconnected components
function displayDisconnectedComponents(network) {
    const disconnectedSection = document.getElementById('disconnected-section');
    const metabolitesTable = document.getElementById('disconnected-metabolites-table').getElementsByTagName('tbody')[0];
    const enzymesTable = document.getElementById('disconnected-enzymes-table').getElementsByTagName('tbody')[0];
    
    // Clear existing data
    metabolitesTable.innerHTML = '';
    enzymesTable.innerHTML = '';
    
    // Add disconnected metabolites
    network.disconnected_metabolites.forEach(metId => {
        const metabolite = network.metabolites[metId];
        if (metabolite) {
            const row = metabolitesTable.insertRow();
            row.innerHTML = `
                <td>${metabolite.name}</td>
                <td>${metabolite.category || 'Unknown'}</td>
                <td><span class="badge bg-${metabolite.source === 'Cannabis Database' ? 'info' : 'success'}">${metabolite.source}</span></td>
                <td>${metabolite.formula || 'N/A'}</td>
            `;
        }
    });
    
    // Add disconnected enzymes
    network.disconnected_enzymes.forEach(enzymeId => {
        const enzyme = network.enzymes[enzymeId];
        if (enzyme) {
            const row = enzymesTable.insertRow();
            row.innerHTML = `
                <td>${enzyme.name}</td>
                <td>${enzyme.ec_number || 'N/A'}</td>
                <td><span class="badge bg-${enzyme.source === 'Cannabis Database' ? 'info' : 'success'}">${enzyme.source}</span></td>
                <td>${enzyme.category || 'Unknown'}</td>
            `;
        }
    });
    
    // Show/hide section based on content
    if (network.disconnected_metabolites.length > 0 || network.disconnected_enzymes.length > 0) {
        disconnectedSection.style.display = 'block';
    } else {
        disconnectedSection.style.display = 'none';
    }
}

// Show node details
function showNodeDetails(node) {
    const data = node.data();
    let content = '';
    
    if (data.type === 'metabolite') {
        content = `
            <h5><i class="fas fa-atom me-2"></i>${data.label}</h5>
            <p><strong>Type:</strong> Metabolite</p>
            <p><strong>Category:</strong> ${data.category || 'Unknown'}</p>
            <p><strong>Source:</strong> <span class="badge bg-${data.source === 'Cannabis Database' ? 'info' : 'success'}">${data.source}</span></p>
            ${data.formula ? `<p><strong>Formula:</strong> ${data.formula}</p>` : ''}
            ${data.molecular_weight ? `<p><strong>Molecular Weight:</strong> ${data.molecular_weight}</p>` : ''}
            ${data.kegg_id ? `<p><strong>KEGG ID:</strong> ${data.kegg_id}</p>` : ''}
            ${data.pubchem_id ? `<p><strong>PubChem ID:</strong> ${data.pubchem_id}</p>` : ''}
            <div class="mt-3">
                <a href="/compound/${data.id}" class="btn btn-primary btn-sm">
                    <i class="fas fa-external-link-alt me-1"></i>View Details
                </a>
            </div>
        `;
    } else if (data.type === 'enzyme') {
        content = `
            <h5><i class="fas fa-dna me-2"></i>${data.label}</h5>
            <p><strong>Type:</strong> Enzyme</p>
            <p><strong>Category:</strong> ${data.category || 'Unknown'}</p>
            <p><strong>Source:</strong> <span class="badge bg-${data.source === 'Cannabis Database' ? 'info' : 'success'}">${data.source}</span></p>
            ${data.ec_number ? `<p><strong>EC Number:</strong> ${data.ec_number}</p>` : ''}
            ${data.substrate ? `<p><strong>Substrate:</strong> ${data.substrate}</p>` : ''}
            ${data.product ? `<p><strong>Product:</strong> ${data.product}</p>` : ''}
            ${data.kegg_id ? `<p><strong>KEGG ID:</strong> ${data.kegg_id}</p>` : ''}
            ${data.uniprot_id ? `<p><strong>UniProt ID:</strong> ${data.uniprot_id}</p>` : ''}
            <div class="mt-3">
                <a href="/enzyme/${data.id}" class="btn btn-primary btn-sm">
                    <i class="fas fa-external-link-alt me-1"></i>View Details
                </a>
            </div>
        `;
    }
    
    showDetailsPanel(content);
}

// Show edge details
function showEdgeDetails(edge) {
    const data = edge.data();
    const content = `
        <h5><i class="fas fa-exchange-alt me-2"></i>Metabolic Reaction</h5>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Enzyme:</strong> ${data.enzyme || 'Unknown'}</p>
        <p><strong>From:</strong> ${data.source}</p>
        <p><strong>To:</strong> ${data.target}</p>
        <div class="mt-3">
            <a href="/reaction/${data.id}" class="btn btn-primary btn-sm">
                <i class="fas fa-external-link-alt me-1"></i>View Reaction Details
            </a>
        </div>
    `;
    
    showDetailsPanel(content);
}

// Show details panel
function showDetailsPanel(content) {
    // Remove existing details panel
    const existingPanel = document.querySelector('.details-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create new details panel
    const panel = document.createElement('div');
    panel.className = 'details-panel position-fixed';
    panel.style.cssText = `
        top: 20px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    
    panel.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">Details</h6>
            <button type="button" class="btn-close" onclick="hideDetails()"></button>
        </div>
        ${content}
    `;
    
    document.body.appendChild(panel);
}

// Hide details panel
function hideDetails() {
    const panel = document.querySelector('.details-panel');
    if (panel) {
        panel.remove();
    }
}

// Show node tooltip
function showNodeTooltip(node, position) {
    const data = node.data();
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip position-fixed';
    tooltip.style.cssText = `
        left: ${position.x + 10}px;
        top: ${position.y - 10}px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    `;
    
    // Create tooltip content based on node type
    let tooltipContent = '';
    if (data.type === 'metabolite') {
        tooltipContent = `🔴 ${data.label || data.id}`;
        if (data.formula) tooltipContent += `\nFormula: ${data.formula}`;
        if (data.category) tooltipContent += `\nCategory: ${data.category}`;
    } else if (data.type === 'enzyme') {
        tooltipContent = `🔵 ${data.label || data.id}`;
        if (data.ec_number) tooltipContent += `\nEC: ${data.ec_number}`;
        if (data.category) tooltipContent += `\nCategory: ${data.category}`;
    } else if (data.type === 'reaction') {
        tooltipContent = `🟡 ${data.label || data.id}`;
        if (data.equation) tooltipContent += `\n${data.equation}`;
    }
    
    tooltip.textContent = tooltipContent;
    tooltip.id = 'node-tooltip';
    
    document.body.appendChild(tooltip);
}

// Show edge tooltip
function showEdgeTooltip(edge, position) {
    const data = edge.data();
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip position-fixed';
    tooltip.style.cssText = `
        left: ${position.x + 10}px;
        top: ${position.y - 10}px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        max-width: 200px;
    `;
    
    let tooltipContent = '';
    if (data.type === 'enzyme_reaction') {
        tooltipContent = `🔗 Enzyme → Reaction\n${data.enzyme || 'Unknown'} → ${data.reaction || 'Unknown'}`;
    } else if (data.type === 'metabolic_reaction') {
        tooltipContent = `⚡ Metabolic Reaction\n${data.source || 'Unknown'} → ${data.target || 'Unknown'}`;
    } else {
        tooltipContent = `🔗 Connection\n${data.source || 'Unknown'} → ${data.target || 'Unknown'}`;
    }
    
    tooltip.textContent = tooltipContent;
    tooltip.id = 'edge-tooltip';
    
    document.body.appendChild(tooltip);
}

// Hide tooltip
function hideTooltip() {
    const nodeTooltip = document.getElementById('node-tooltip');
    const edgeTooltip = document.getElementById('edge-tooltip');
    if (nodeTooltip) {
        nodeTooltip.remove();
    }
    if (edgeTooltip) {
        edgeTooltip.remove();
    }
}

// Reset view
function resetView() {
    cy.fit();
    cy.center();
}

// Toggle labels
function toggleLabels() {
    labelsVisible = !labelsVisible;
    cy.style()
        .selector('node')
        .style({
            'label': labelsVisible ? 'data(label)' : ''
        })
        .update();
}

// Export network
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
    link.download = `metabolic_network_${currentSpecies}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showSuccess('Network exported successfully');
}

// Utility functions
function showLoading() {
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'position-fixed top-50 start-50 translate-middle';
    loadingDiv.style.cssText = `
        background: rgba(255,255,255,0.9);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    loadingDiv.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 mb-0">Loading network data...</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
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
    alertDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 1000;
        min-width: 300px;
    `;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Add any additional event listeners here
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideDetails();
        }
    });
}

// Performance logging
function logPerformance() {
    const startTime = performance.now();
    console.log('Page load time:', startTime - performance.timing.navigationStart, 'ms');
} 