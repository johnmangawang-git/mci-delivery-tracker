/**
 * CHART CANVAS FIX
 * Fixes Chart.js "Cannot read properties of null (reading 'ownerDocument')" error
 * Ensures charts only initialize after canvas elements are properly mounted in DOM
 */

console.log('🔧 Loading Chart Canvas Fix...');

(function() {
    'use strict';
    
    /**
     * Wait for DOM element to be available and visible
     */
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            function checkElement() {
                const element = document.getElementById(selector);
                
                if (element && element.offsetParent !== null) {
                    // Element exists and is visible
                    resolve(element);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                    return;
                }
                
                // Check again in next frame
                requestAnimationFrame(checkElement);
            }
            
            checkElement();
        });
    }
    
    /**
     * Safe chart creation with DOM readiness checks
     */
    async function safeCreateChart(canvasId, chartConfig) {
        try {
            console.log(`🎯 Creating chart for canvas: ${canvasId}`);
            
            // Wait for canvas element to be available
            const canvas = await waitForElement(canvasId);
            
            if (!canvas) {
                throw new Error(`Canvas element ${canvasId} not found`);
            }
            
            // Verify Chart.js is loaded
            if (typeof Chart === 'undefined') {
                throw new Error('Chart.js library not loaded');
            }
            
            // Clean up any existing chart on this canvas
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                console.log(`🔄 Destroying existing chart on ${canvasId}`);
                existingChart.destroy();
            }
            
            // Create new chart
            const chart = new Chart(canvas, chartConfig);
            console.log(`✅ Chart created successfully for ${canvasId}`);
            
            return chart;
            
        } catch (error) {
            console.error(`❌ Error creating chart for ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Enhanced cost breakdown chart creation with DOM safety
     */
    async function createSafeCostBreakdownChart(data) {
        const chartConfig = {
            type: 'pie',
            data: {
                labels: data.labels || ['No Data'],
                datasets: [{
                    data: data.values || [1],
                    backgroundColor: data.colors || [
                        'rgba(243, 156, 18, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(149, 165, 166, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                const dataset = context.dataset;
                                const total = dataset.data.reduce((sum, value) => sum + value, 0);
                                const currentValue = dataset.data[context.dataIndex];
                                const percentage = total > 0 ? ((currentValue / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${percentage}% (₱${currentValue.toLocaleString()})`;
                            }
                        }
                    }
                }
            }
        };
        
        const chart = await safeCreateChart('costBreakdownChart', chartConfig);
        
        if (chart) {
            // Store globally for future updates
            window.costBreakdownChart = chart;
        }
        
        return chart;
    }
    
    /**
     * Safe chart update function with DOM validation
     */
    async function safeUpdateCostBreakdownChart(period = 'month') {
        console.log('📊 Safe cost breakdown chart update...', period);
        
        try {
            // Get data first
            let costBreakdownData;
            
            if (typeof window.getSafeCostBreakdownData === 'function') {
                costBreakdownData = await window.getSafeCostBreakdownData(period);
            } else if (typeof window.getCostBreakdownData === 'function') {
                costBreakdownData = await window.getCostBreakdownData(period);
            } else {
                // Fallback data
                costBreakdownData = {
                    labels: ['No Data'],
                    values: [1],
                    colors: ['rgba(149, 165, 166, 0.8)']
                };
            }
            
            // Check if canvas exists and is visible
            const canvas = document.getElementById('costBreakdownChart');
            if (!canvas) {
                console.warn('⚠️ Cost breakdown chart canvas not found');
                return;
            }
            
            if (canvas.offsetParent === null) {
                console.warn('⚠️ Cost breakdown chart canvas not visible');
                return;
            }
            
            // Try to get existing chart
            let chart = window.costBreakdownChart || Chart.getChart(canvas);
            
            if (chart && chart.data && typeof chart.update === 'function') {
                // Update existing chart
                chart.data.labels = costBreakdownData.labels;
                chart.data.datasets[0].data = costBreakdownData.values;
                
                if (costBreakdownData.colors) {
                    chart.data.datasets[0].backgroundColor = costBreakdownData.colors;
                }
                
                chart.update('none'); // Update without animation
                console.log('✅ Cost breakdown chart updated successfully');
                
            } else {
                // Create new chart
                console.log('🔧 Creating new cost breakdown chart...');
                await createSafeCostBreakdownChart(costBreakdownData);
            }
            
        } catch (error) {
            console.error('❌ Error in safe chart update:', error);
            
            // Try to recreate chart as last resort
            try {
                console.log('🔄 Attempting to recreate chart...');
                const fallbackData = {
                    labels: ['No Data'],
                    values: [1],
                    colors: ['rgba(149, 165, 166, 0.8)']
                };
                await createSafeCostBreakdownChart(fallbackData);
            } catch (recreateError) {
                console.error('❌ Failed to recreate chart:', recreateError);
            }
        }
    }
    
    /**
     * Override the original updateCostBreakdownChart function
     */
    function overrideChartFunctions() {
        // Store original function if it exists
        if (typeof window.updateCostBreakdownChart === 'function') {
            window.originalUpdateCostBreakdownChart = window.updateCostBreakdownChart;
        }
        
        // Replace with safe version
        window.updateCostBreakdownChart = safeUpdateCostBreakdownChart;
        
        // Also override the create function
        if (typeof window.createCostBreakdownChart === 'function') {
            window.originalCreateCostBreakdownChart = window.createCostBreakdownChart;
        }
        window.createCostBreakdownChart = createSafeCostBreakdownChart;
        
        console.log('✅ Chart functions overridden with safe versions');
    }
    
    /**
     * Initialize the fix
     */
    function initChartCanvasFix() {
        console.log('🚀 Initializing Chart Canvas Fix...');
        
        // Override functions immediately
        overrideChartFunctions();
        
        // Also override after a delay to catch late-loading scripts
        setTimeout(overrideChartFunctions, 1000);
        setTimeout(overrideChartFunctions, 3000);
        
        console.log('✅ Chart Canvas Fix initialized');
    }
    
    // Export functions globally
    window.safeCreateChart = safeCreateChart;
    window.createSafeCostBreakdownChart = createSafeCostBreakdownChart;
    window.safeUpdateCostBreakdownChart = safeUpdateCostBreakdownChart;
    window.waitForElement = waitForElement;
    
    // Initialize based on document state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChartCanvasFix);
    } else if (document.readyState === 'interactive') {
        // DOM is loaded but resources might still be loading
        setTimeout(initChartCanvasFix, 100);
    } else {
        // Document is fully loaded
        initChartCanvasFix();
    }
    
    console.log('✅ Chart Canvas Fix loaded successfully');
    
})();

// Export module info
window.chartCanvasFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};