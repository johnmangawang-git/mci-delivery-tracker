// Analytics charts
let bookingsChart, costsChart, originChart, costBreakdownChart;

async function initAnalyticsCharts(period = 'month') {
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

    // Initialize chart filters
    initChartFilters();

    // Load actual data
    const data = await loadAnalyticsData(period);

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

// Helper function to process data by day
function processDataByDay(deliveries) {
    // Group by day
    const bookingsByDay = {};
    const costsByDay = {};
    const originCount = {};
    
    deliveries.forEach(delivery => {
        const date = delivery.deliveryDate || delivery.timestamp;
        if (date) {
            // Format date as MM/DD
            const dateObj = new Date(date);
            const dayKey = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            
            bookingsByDay[dayKey] = (bookingsByDay[dayKey] || 0) + 1;
            
            const cost = typeof delivery.additionalCosts === 'number' ? delivery.additionalCosts : 0;
            costsByDay[dayKey] = (costsByDay[dayKey] || 0) + cost;
            
            const origin = delivery.origin || 'Unknown';
            originCount[origin] = (originCount[origin] || 0) + 1;
        }
    });
    
    // Cost breakdown - categorize additional costs
    const costBreakdown = {
        'Fuel Surcharge': 0,
        'Toll Fees': 0,
        'Helper': 0, // Changed from 'Urgent Delivery'
        'Special Handling': 0,
        'Other': 0
    };
    
    // Process individual cost items if available
    deliveries.forEach(delivery => {
        if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
            delivery.additionalCostItems.forEach(item => {
                const description = item.description.toLowerCase();
                const amount = item.amount;
                
                // Map descriptions to categories
                if (description.includes('gas') || description.includes('fuel')) {
                    costBreakdown['Fuel Surcharge'] += amount;
                } else if (description.includes('toll')) {
                    costBreakdown['Toll Fees'] += amount;
                } else if (description.includes('helper') || description.includes('urgent') || description.includes('delivery')) {
                    costBreakdown['Helper'] += amount; // Changed from 'Urgent Delivery'
                } else if (description.includes('special') || description.includes('handling')) {
                    costBreakdown['Special Handling'] += amount;
                } else {
                    costBreakdown['Other'] += amount;
                }
            });
        } else if (typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
            // Fallback to old method if individual items not available
            costBreakdown['Other'] += delivery.additionalCosts;
        }
    });
    
    // Prepare data for charts
    const days = Object.keys(bookingsByDay);
    const bookingValues = days.map(day => bookingsByDay[day] || 0);
    const costValues = days.map(day => costsByDay[day] || 0);
    
    const originLabels = Object.keys(originCount);
    const originValues = originLabels.map(label => originCount[label] || 0);
    
    const costBreakdownLabels = Object.keys(costBreakdown);
    const costBreakdownValues = costBreakdownLabels.map(label => costBreakdown[label] || 0);
    
    return {
        bookingsData: {
            labels: days,
            values: bookingValues
        },
        costsData: {
            labels: days,
            values: costValues
        },
        originData: {
            labels: originLabels,
            values: originValues
        },
        costBreakdownData: {
            labels: costBreakdownLabels,
            values: costBreakdownValues
        }
    };
}

// Helper function to process data by week
function processDataByWeek(deliveries) {
    // Group by week
    const bookingsByWeek = {};
    const costsByWeek = {};
    const originCount = {};
    
    deliveries.forEach(delivery => {
        const date = delivery.deliveryDate || delivery.timestamp;
        if (date) {
            // Format week as "Week of MM/DD"
            const dateObj = new Date(date);
            const startOfWeek = new Date(dateObj);
            startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
            const weekKey = `Week of ${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
            
            bookingsByWeek[weekKey] = (bookingsByWeek[weekKey] || 0) + 1;
            
            const cost = typeof delivery.additionalCosts === 'number' ? delivery.additionalCosts : 0;
            costsByWeek[weekKey] = (costsByWeek[weekKey] || 0) + cost;
            
            const origin = delivery.origin || 'Unknown';
            originCount[origin] = (originCount[origin] || 0) + 1;
        }
    });
    
    // Cost breakdown - categorize additional costs
    const costBreakdown = {
        'Fuel Surcharge': 0,
        'Toll Fees': 0,
        'Helper': 0, // Changed from 'Urgent Delivery'
        'Special Handling': 0,
        'Other': 0
    };
    
    // Process individual cost items if available
    deliveries.forEach(delivery => {
        if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
            delivery.additionalCostItems.forEach(item => {
                const description = item.description.toLowerCase();
                const amount = item.amount;
                
                // Map descriptions to categories
                if (description.includes('gas') || description.includes('fuel')) {
                    costBreakdown['Fuel Surcharge'] += amount;
                } else if (description.includes('toll')) {
                    costBreakdown['Toll Fees'] += amount;
                } else if (description.includes('helper') || description.includes('urgent') || description.includes('delivery')) {
                    costBreakdown['Helper'] += amount; // Changed from 'Urgent Delivery'
                } else if (description.includes('special') || description.includes('handling')) {
                    costBreakdown['Special Handling'] += amount;
                } else {
                    costBreakdown['Other'] += amount;
                }
            });
        } else if (typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
            // Fallback to old method if individual items not available
            costBreakdown['Other'] += delivery.additionalCosts;
        }
    });
    
    // Prepare data for charts
    const weeks = Object.keys(bookingsByWeek);
    const bookingValues = weeks.map(week => bookingsByWeek[week] || 0);
    const costValues = weeks.map(week => costsByWeek[week] || 0);
    
    const originLabels = Object.keys(originCount);
    const originValues = originLabels.map(label => originCount[label] || 0);
    
    const costBreakdownLabels = Object.keys(costBreakdown);
    const costBreakdownValues = costBreakdownLabels.map(label => costBreakdown[label] || 0);
    
    return {
        bookingsData: {
            labels: weeks,
            values: bookingValues
        },
        costsData: {
            labels: weeks,
            values: costValues
        },
        originData: {
            labels: originLabels,
            values: originValues
        },
        costBreakdownData: {
            labels: costBreakdownLabels,
            values: costBreakdownValues
        }
    };
}

// Helper function to process data by month
function processDataByMonth(deliveries) {
    // Group by month
    const bookingsByMonth = {};
    const costsByMonth = {};
    const originCount = {};
    
    deliveries.forEach(delivery => {
        const date = delivery.deliveryDate || delivery.timestamp;
        if (date) {
            const month = new Date(date).toLocaleString('default', { month: 'short' });
            bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
            
            const cost = typeof delivery.additionalCosts === 'number' ? delivery.additionalCosts : 0;
            costsByMonth[month] = (costsByMonth[month] || 0) + cost;
            
            const origin = delivery.origin || 'Unknown';
            originCount[origin] = (originCount[origin] || 0) + 1;
        }
    });
    
    // Cost breakdown - categorize additional costs
    const costBreakdown = {
        'Fuel Surcharge': 0,
        'Toll Fees': 0,
        'Helper': 0, // Changed from 'Urgent Delivery'
        'Special Handling': 0,
        'Other': 0
    };
    
    // Process individual cost items if available
    deliveries.forEach(delivery => {
        if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
            delivery.additionalCostItems.forEach(item => {
                const description = item.description.toLowerCase();
                const amount = item.amount;
                
                // Map descriptions to categories
                if (description.includes('gas') || description.includes('fuel')) {
                    costBreakdown['Fuel Surcharge'] += amount;
                } else if (description.includes('toll')) {
                    costBreakdown['Toll Fees'] += amount;
                } else if (description.includes('helper') || description.includes('urgent') || description.includes('delivery')) {
                    costBreakdown['Helper'] += amount; // Changed from 'Urgent Delivery'
                } else if (description.includes('special') || description.includes('handling')) {
                    costBreakdown['Special Handling'] += amount;
                } else {
                    costBreakdown['Other'] += amount;
                }
            });
        } else if (typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
            // Fallback to old method if individual items not available
            costBreakdown['Other'] += delivery.additionalCosts;
        }
    });
    
    // Prepare data for charts
    const months = Object.keys(bookingsByMonth);
    const bookingValues = months.map(month => bookingsByMonth[month] || 0);
    const costValues = months.map(month => costsByMonth[month] || 0);
    
    const originLabels = Object.keys(originCount);
    const originValues = originLabels.map(label => originCount[label] || 0);
    
    const costBreakdownLabels = Object.keys(costBreakdown);
    const costBreakdownValues = costBreakdownLabels.map(label => costBreakdown[label] || 0);
    
    return {
        bookingsData: {
            labels: months,
            values: bookingValues
        },
        costsData: {
            labels: months,
            values: costValues
        },
        originData: {
            labels: originLabels,
            values: originValues
        },
        costBreakdownData: {
            labels: costBreakdownLabels,
            values: costBreakdownValues
        }
    };
}

function initChartFilters() {
    // Bookings chart period filters
    document.querySelectorAll('#bookingsChart').forEach(chart => {
        const container = chart.closest('.card-body');
        if (container) {
            container.querySelectorAll('.chart-filters .btn').forEach(button => {
                button.addEventListener('click', function () {
                    const period = this.dataset.period;
                    const filterContainer = this.closest('.chart-filters');

                    filterContainer.querySelectorAll('.btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');

                    console.log(`Changed bookings chart period to: ${period}`);
                    updateBookingsChart(period);
                });
            });
        }
    });

    // Costs chart period filters
    document.querySelectorAll('#costsChart').forEach(chart => {
        const container = chart.closest('.card-body');
        if (container) {
            container.querySelectorAll('.chart-filters .btn').forEach(button => {
                button.addEventListener('click', function () {
                    const period = this.dataset.period;
                    const filterContainer = this.closest('.chart-filters');

                    filterContainer.querySelectorAll('.btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');

                    console.log(`Changed costs chart period to: ${period}`);
                    updateCostsChart(period);
                });
            });
        }
    });

    // Origin chart period filters
    document.querySelectorAll('#originChart').forEach(chart => {
        const container = chart.closest('.card-body');
        if (container) {
            container.querySelectorAll('.chart-filters .btn').forEach(button => {
                button.addEventListener('click', function () {
                    const period = this.dataset.period;
                    const filterContainer = this.closest('.chart-filters');

                    filterContainer.querySelectorAll('.btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');

                    console.log(`Changed origin chart period to: ${period}`);
                    updateOriginChart(period);
                });
            });
        }
    });

    // Cost breakdown chart period filters
    document.querySelectorAll('#costBreakdownChart').forEach(chart => {
        const container = chart.closest('.card-body');
        if (container) {
            container.querySelectorAll('.chart-filters .btn').forEach(button => {
                button.addEventListener('click', function () {
                    const period = this.dataset.period;
                    const filterContainer = this.closest('.chart-filters');

                    filterContainer.querySelectorAll('.btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');

                    console.log(`Changed cost breakdown chart period to: ${period}`);
                    updateCostBreakdownChart(period);
                });
            });
        }
    });
}

// Mock function to load analytics data from Supabase
async function loadAnalyticsData(period = 'month') {
    try {
        // Get the actual data from global variables
        const activeDeliveries = window.activeDeliveries || [];
        const deliveryHistory = window.deliveryHistory || [];
        const allDeliveries = [...activeDeliveries, ...deliveryHistory];
        
        // Process data for charts based on period
        let bookingsData, costsData, originData, costBreakdownData;
        
        switch(period) {
            case 'day':
                ({ bookingsData, costsData, originData, costBreakdownData } = processDataByDay(allDeliveries));
                break;
            case 'week':
                ({ bookingsData, costsData, originData, costBreakdownData } = processDataByWeek(allDeliveries));
                break;
            case 'month':
            default:
                ({ bookingsData, costsData, originData, costBreakdownData } = processDataByMonth(allDeliveries));
                break;
        }
        
        return {
            bookings: bookingsData,
            costs: costsData,
            origin: originData,
            costBreakdown: costBreakdownData
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
    
    // Load new data for the selected period
    loadAnalyticsData(period).then(data => {
        if (bookingsChart) {
            bookingsChart.data.labels = data.bookings.labels;
            bookingsChart.data.datasets[0].data = data.bookings.values;
            bookingsChart.update();
        }
    });
}

function updateCostsChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating costs chart for ${period}`);
    
    // Load new data for the selected period
    loadAnalyticsData(period).then(data => {
        if (costsChart) {
            costsChart.data.labels = data.costs.labels;
            costsChart.data.datasets[0].data = data.costs.values;
            costsChart.update();
        }
    });
}

function updateOriginChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating origin chart for ${period}`);
    
    // Load new data for the selected period
    loadAnalyticsData(period).then(data => {
        if (originChart) {
            originChart.data.labels = data.origin.labels;
            originChart.data.datasets[0].data = data.origin.values;
            originChart.update();
        }
    });
}

function updateCostBreakdownChart(period) {
    // In a real implementation, this would fetch new data based on period
    console.log(`Updating cost breakdown chart for ${period}`);
    
    // Load new data for the selected period
    loadAnalyticsData(period).then(data => {
        if (costBreakdownChart) {
            costBreakdownChart.data.labels = data.costBreakdown.labels;
            costBreakdownChart.data.datasets[0].data = data.costBreakdown.values;
            costBreakdownChart.update();
        }
    });
}

// Expose function globally
window.initAnalyticsCharts = initAnalyticsCharts;