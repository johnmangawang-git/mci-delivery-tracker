// Analytics charts
let bookingsChart, costsChart, originChart, costBreakdownChart;

async function initAnalyticsCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is not loaded');
        return;
    }
    
    // Destroy existing charts if they exist
    if (bookingsChart) {
        bookingsChart.destroy();
        bookingsChart = null;
    }
    if (costsChart) {
        costsChart.destroy();
        costsChart = null;
    }
    if (originChart) {
        originChart.destroy();
        originChart = null;
    }
    if (costBreakdownChart) {
        costBreakdownChart.destroy();
        costBreakdownChart = null;
    }

    // Update dashboard metrics
    updateDashboardMetrics();

    // Load actual data
    const data = await loadAnalyticsData();

    // Bookings Chart - Total bookings per month/week/day
    const bookingsCtx = document.getElementById('bookingsChart');
    if (bookingsCtx) {
        bookingsChart = new Chart(bookingsCtx, {
            type: 'bar',
            data: {
                labels: data.bookings.labels,
                datasets: [{
                    label: 'Bookings',
                    data: data.bookings.values,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 50
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Additional Costs Chart
    const costsCtx = document.getElementById('costsChart');
    if (costsCtx) {
        costsChart = new Chart(costsCtx, {
            type: 'line',
            data: {
                labels: data.costs.labels,
                datasets: [{
                    label: 'Additional Costs (₱)',
                    data: data.costs.values,
                    backgroundColor: 'rgba(243, 156, 18, 0.2)',
                    borderColor: 'rgba(243, 156, 18, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(243, 156, 18, 1)',
                    pointRadius: 4,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
                                return `₱${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return `₱${value.toLocaleString()}`;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Origin Chart - Booking origin distribution (pie chart)
    const originCtx = document.getElementById('originChart');
    if (originCtx) {
        originChart = new Chart(originCtx, {
            type: 'doughnut',
            data: {
                labels: data.origin.labels,
                datasets: [{
                    data: data.origin.values,
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(231, 76, 60, 0.8)',
                        'rgba(155, 89, 182, 0.8)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(155, 89, 182, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Cost Breakdown Chart - Additional cost breakdown
    const costBreakdownCtx = document.getElementById('costBreakdownChart');
    if (costBreakdownCtx) {
        costBreakdownChart = new Chart(costBreakdownCtx, {
            type: 'pie',
            data: {
                labels: data.costBreakdown.labels,
                datasets: [{
                    data: data.costBreakdown.values,
                    backgroundColor: [
                        'rgba(243, 156, 18, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(149, 165, 166, 0.8)'
                    ],
                    borderColor: [
                        'rgba(243, 156, 18, 1)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(155, 89, 182, 1)',
                        'rgba(149, 165, 166, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                }
            }
        });
    }
}

// Expose function globally
window.initAnalyticsCharts = initAnalyticsCharts;

function initChartFilters() {
    // Bookings chart period filters
    document.querySelectorAll('#bookingsChart ~ .chart-filters .btn').forEach(button => {
        button.addEventListener('click', function () {
            const period = this.dataset.period;
            const container = this.closest('.chart-filters');

            container.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // In a real implementation, this would update the chart data
            console.log(`Changed bookings chart period to: ${period}`);
            updateBookingsChart(period);
        });
    });

    // Costs chart period filters
    document.querySelectorAll('#costsChart ~ .chart-filters .btn').forEach(button => {
        button.addEventListener('click', function () {
            const period = this.dataset.period;
            const container = this.closest('.chart-filters');

            container.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // In a real implementation, this would update the chart data
            console.log(`Changed costs chart period to: ${period}`);
            updateCostsChart(period);
        });
    });

    // Origin chart period filters
    document.querySelectorAll('#originChart ~ .chart-filters .btn').forEach(button => {
        button.addEventListener('click', function () {
            const period = this.dataset.period;
            const container = this.closest('.chart-filters');

            container.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // In a real implementation, this would update the chart data
            console.log(`Changed origin chart period to: ${period}`);
            updateOriginChart(period);
        });
    });

    // Cost breakdown chart period filters
    document.querySelectorAll('#costBreakdownChart ~ .chart-filters .btn').forEach(button => {
        button.addEventListener('click', function () {
            const period = this.dataset.period;
            const container = this.closest('.chart-filters');

            container.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // In a real implementation, this would update the chart data
            console.log(`Changed cost breakdown chart period to: ${period}`);
            updateCostBreakdownChart(period);
        });
    });
}

// Mock function to load analytics data from Supabase
async function loadAnalyticsData() {
    try {
        // Get the actual data from global variables
        const activeDeliveries = window.activeDeliveries || [];
        const deliveryHistory = window.deliveryHistory || [];
        const allDeliveries = [...activeDeliveries, ...deliveryHistory];
        
        // Process data for charts
        // Bookings chart - group by month
        const bookingsByMonth = {};
        allDeliveries.forEach(delivery => {
            const date = delivery.deliveryDate || delivery.timestamp;
            if (date) {
                const month = new Date(date).toLocaleString('default', { month: 'short' });
                bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
            }
        });
        
        // Costs chart - group by month
        const costsByMonth = {};
        allDeliveries.forEach(delivery => {
            const date = delivery.deliveryDate || delivery.timestamp;
            if (date) {
                const month = new Date(date).toLocaleString('default', { month: 'short' });
                const cost = typeof delivery.additionalCosts === 'number' ? delivery.additionalCosts : 0;
                costsByMonth[month] = (costsByMonth[month] || 0) + cost;
            }
        });
        
        // Origin chart - count by origin
        const originCount = {};
        allDeliveries.forEach(delivery => {
            const origin = delivery.origin || 'Unknown';
            originCount[origin] = (originCount[origin] || 0) + 1;
        });
        
        // Cost breakdown - categorize additional costs
        const costBreakdown = {
            'Fuel Surcharge': 0,
            'Toll Fees': 0,
            'Urgent Delivery': 0,
            'Special Handling': 0,
            'Other': 0
        };
        
        // For now, we'll put all additional costs in "Other" since we don't have cost descriptions
        let totalAdditionalCosts = 0;
        allDeliveries.forEach(delivery => {
            if (typeof delivery.additionalCosts === 'number') {
                totalAdditionalCosts += delivery.additionalCosts;
            }
        });
        
        if (totalAdditionalCosts > 0) {
            costBreakdown['Other'] = totalAdditionalCosts;
        }
        
        // Prepare data for charts
        const months = Object.keys(bookingsByMonth);
        const bookingValues = months.map(month => bookingsByMonth[month] || 0);
        const costValues = months.map(month => costsByMonth[month] || 0);
        
        const originLabels = Object.keys(originCount);
        const originValues = originLabels.map(label => originCount[label] || 0);
        
        const costBreakdownLabels = Object.keys(costBreakdown);
        const costBreakdownValues = costBreakdownLabels.map(label => costBreakdown[label] || 0);
        
        return {
            bookings: {
                labels: months,
                values: bookingValues
            },
            costs: {
                labels: months,
                values: costValues
            },
            origin: {
                labels: originLabels,
                values: originValues
            },
            costBreakdown: {
                labels: costBreakdownLabels,
                values: costBreakdownValues
            }
        };
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Failed to load analytics data');
        // Return empty data as fallback
        return {
            bookings: {
                labels: [],
                values: []
            },
            costs: {
                labels: [],
                values: []
            },
            origin: {
                labels: [],
                values: []
            },
            costBreakdown: {
                labels: [],
                values: []
            }
        };
    }
}

// Function to update the dashboard metrics
function updateDashboardMetrics() {
    try {
        // Get the actual data from global variables
        const activeDeliveries = window.activeDeliveries || [];
        const deliveryHistory = window.deliveryHistory || [];
        
        // Calculate metrics from actual data
        const totalBookings = activeDeliveries.length + deliveryHistory.length;
        
        // Calculate total distance
        let totalDistance = 0;
        [...activeDeliveries, ...deliveryHistory].forEach(delivery => {
            if (delivery.distance) {
                // Extract numeric value from distance string (e.g., "12.5 km" -> 12.5)
                const distanceMatch = delivery.distance.match(/(\d+\.?\d*)/);
                if (distanceMatch) {
                    totalDistance += parseFloat(distanceMatch[1]) || 0;
                }
            }
        });
        
        // Calculate total additional costs
        let totalAdditionalCost = 0;
        [...activeDeliveries, ...deliveryHistory].forEach(delivery => {
            if (typeof delivery.additionalCosts === 'number') {
                totalAdditionalCost += delivery.additionalCosts;
            }
        });
        
        // Calculate average cost per booking
        const avgCostPerBooking = totalBookings > 0 ? totalAdditionalCost / totalBookings : 0;
        
        // Update the UI elements
        const totalBookingsElement = document.querySelector('.metric-card:nth-child(1) .metric-value');
        const totalDistanceElement = document.querySelector('.metric-card:nth-child(2) .metric-value');
        const totalAdditionalCostElement = document.querySelector('.metric-card:nth-child(3) .metric-value');
        const avgCostPerBookingElement = document.querySelector('.metric-card:nth-child(4) .metric-value .crossed-out');
        
        if (totalBookingsElement) {
            totalBookingsElement.textContent = totalBookings;
        }
        
        if (totalDistanceElement) {
            totalDistanceElement.textContent = `${totalDistance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
        }
        
        if (totalAdditionalCostElement) {
            totalAdditionalCostElement.textContent = `₱${totalAdditionalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        }
        
        if (avgCostPerBookingElement) {
            avgCostPerBookingElement.textContent = `₱${avgCostPerBooking.toFixed(2)}`;
        }
        
        console.log('Dashboard metrics updated:', {
            totalBookings,
            totalDistance,
            totalAdditionalCost,
            avgCostPerBooking
        });
    } catch (error) {
        console.error('Error updating dashboard metrics:', error);
    }
}

// Expose function globally
window.updateDashboardMetrics = updateDashboardMetrics;

// Update chart functions (for demo purposes)
function updateBookingsChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating bookings chart for ${period}`);
}

function updateCostsChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating costs chart for ${period}`);
}

function updateOriginChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating origin chart for ${period}`);
}

function updateCostBreakdownChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating cost breakdown chart for ${period}`);
}

// Expose function globally
window.initAnalyticsCharts = initAnalyticsCharts;