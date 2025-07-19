// Metabolomics Data Dashboard JavaScript

// Global variables
let refreshInterval;
let currentTimeInterval;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Metabolomics Data Dashboard initialized');
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Load charts
    loadCharts();
    
    // Set up auto-refresh
    setupAutoRefresh();
    
    // Initialize tooltips
    initializeTooltips();
});

// Real-time clock
function startRealTimeUpdates() {
    updateCurrentTime();
    currentTimeInterval = setInterval(updateCurrentTime, 1000);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Load interactive charts
function loadCharts() {
    loadGenomeComparisonChart();
    loadFileStatusChart();
}

function loadGenomeComparisonChart() {
    fetch('/api/charts/genome-comparison')
        .then(response => response.text())
        .then(html => {
            document.getElementById('genome-comparison-chart').innerHTML = html;
            console.log('Genome comparison chart loaded');
        })
        .catch(error => {
            console.error('Error loading genome comparison chart:', error);
            showError('Failed to load genome comparison chart');
        });
}

function loadFileStatusChart() {
    fetch('/api/charts/file-status')
        .then(response => response.text())
        .then(html => {
            document.getElementById('file-status-chart').innerHTML = html;
            console.log('File status chart loaded');
        })
        .catch(error => {
            console.error('Error loading file status chart:', error);
            showError('Failed to load file status chart');
        });
}

// Auto-refresh functionality
function setupAutoRefresh() {
    // Refresh data every 30 seconds
    refreshInterval = setInterval(refreshData, 30000);
}

function refreshData() {
    console.log('Refreshing dashboard data...');
    
    // Refresh charts
    loadCharts();
    
    // Refresh stats
    refreshStats();
    
    // Show refresh indicator
    showRefreshIndicator();
}

function refreshStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            updateStatsDisplay(data);
        })
        .catch(error => {
            console.error('Error refreshing stats:', error);
        });
}

function updateStatsDisplay(stats) {
    // Update the stats cards with new data
    Object.keys(stats).forEach(species => {
        const stat = stats[species];
        const card = document.querySelector(`[data-species="${species}"]`);
        if (card) {
            // Update protein count
            const proteinElement = card.querySelector('.protein-count');
            if (proteinElement) {
                proteinElement.textContent = stat.protein_count;
            }
            
            // Update gene count
            const geneElement = card.querySelector('.gene-count');
            if (geneElement) {
                geneElement.textContent = stat.gene_count;
            }
        }
    });
}

// Download functionality
function downloadSpecies(species) {
    console.log(`Starting download for ${species}`);
    
    // Show loading state
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="loading"></span> Downloading...';
    button.disabled = true;
    
    fetch(`/download/${species}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showSuccess(`Download started for ${species}`);
                // Refresh data after a delay
                setTimeout(() => {
                    refreshData();
                }, 5000);
            } else {
                showError(`Download failed: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Download error:', error);
            showError('Download failed. Please try again.');
        })
        .finally(() => {
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
        });
}

// Utility functions
function showSuccess(message) {
    showAlert(message, 'success');
}

function showError(message) {
    showAlert(message, 'danger');
}

function showWarning(message) {
    showAlert(message, 'warning');
}

function showAlert(message, type) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of container
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showRefreshIndicator() {
    // Add a subtle refresh indicator
    const navbar = document.querySelector('.navbar');
    const indicator = document.createElement('div');
    indicator.className = 'refresh-indicator';
    indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 123, 255, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 2000);
}

// Initialize tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Search and filter functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterTableRows(searchTerm);
        });
    }
}

function filterTableRows(searchTerm) {
    const tableRows = document.querySelectorAll('tbody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export functionality
function exportData(format = 'csv') {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            if (format === 'csv') {
                exportToCSV(data);
            } else if (format === 'json') {
                exportToJSON(data);
            }
        })
        .catch(error => {
            console.error('Export error:', error);
            showError('Export failed');
        });
}

function exportToCSV(data) {
    let csv = 'Species,Genome Size (MB),Chromosomes,Proteins,Genes,SwissProt Hits,TrEMBL Hits\n';
    
    Object.keys(data).forEach(species => {
        const stat = data[species];
        csv += `${stat.name},${stat.genome_size_mb},${stat.chromosomes},${stat.protein_count},${stat.gene_count},${stat.swissprot_hits},${stat.trembl_hits}\n`;
    });
    
    downloadFile(csv, 'metabolomics_data.csv', 'text/csv');
}

function exportToJSON(data) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'metabolomics_data.json', 'application/json');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + R to refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        refreshData();
    }
    
    // Ctrl/Cmd + E to export
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        exportData('csv');
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (currentTimeInterval) {
        clearInterval(currentTimeInterval);
    }
});

// Add CSS for refresh indicator animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.8); }
    }
    
    .refresh-indicator {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);

// Performance monitoring
function logPerformance() {
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    }
}

// Log performance on page load
window.addEventListener('load', logPerformance); 