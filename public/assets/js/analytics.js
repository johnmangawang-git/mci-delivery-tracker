// Analytics charts
let bookingsChart, costsChart, originChart, costBreakdownChart;

function initAnalyticsCharts() {
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

    // Mock data for charts
    const data = {
        bookings: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            values: [285, 302, 318, 327, 335, 342, 338, 341, 345, 347]
        },
        costs: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            values: [3280, 3520, 3750, 3890, 4020, 4150, 4180, 4210, 4250, 4280]
        },
        origin: {
            labels: ['MCI Alabang', 'MCI Cebu', 'MCI Davao', 'Other'],
            values: [45, 28, 20, 7]
        },
        costBreakdown: {
            labels: ['Fuel Surcharge', 'Toll Fees', 'Urgent Delivery', 'Special Handling', 'Other'],
            values: [45, 25, 15, 10, 5]
        }
    };

    // Bookings Chart - Total bookings per month/week/day
    const bookingsCtx = document.getElementById('bookingsOverTimeChart');
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
window.initAnalyticsCharts = initAnalyticsCharts;                            'rgba(52, 152, 219, 0.8)',
                            'rgba(155, 89, 182, 0.8)',
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(149, 165, 166, 0.8)'
                        ],
                        borderColor: [
                            'rgba(243, 156, 18, 1)',
                            'rgba(52, 152, 219, 1)',
                            'rgba(155, 89, 182, 1)',
                            'rgba(46, 204, 113, 1)',
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

        // Initialize chart filters
        initChartFilters();
    });
}

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
        // In a real implementation, this would fetch data from Supabase
        // For demo purposes, we'll use mock data
        return {
            bookings: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                values: [285, 302, 318, 327, 335, 342, 338, 341, 345, 347]
            },
            costs: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                values: [3280, 3520, 3750, 3890, 4020, 4150, 4180, 4210, 4250, 4280]
            },
            origin: {
                labels: ['MCI Alabang', 'MCI Cebu', 'MCI Davao', 'Other'],
                values: [45, 28, 20, 7]
            },
            costBreakdown: {
                labels: ['Fuel Surcharge', 'Toll Fees', 'Urgent Delivery', 'Special Handling', 'Other'],
                values: [45, 25, 15, 10, 5]
            }
        };
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Failed to load analytics data');
        return {
            bookings: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            costs: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            origin: {
                labels: ['MCI Alabang', 'MCI Cebu', 'MCI Davao', 'Other'],
                values: [0, 0, 0, 0]
            },
            costBreakdown: {
                labels: ['Fuel Surcharge', 'Toll Fees', 'Urgent Delivery', 'Special Handling', 'Other'],
                values: [0, 0, 0, 0, 0]
            }
        };
    }
}

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