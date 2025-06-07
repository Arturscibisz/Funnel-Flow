document.addEventListener('DOMContentLoaded', () => {
  // Toggle sidebar on mobile
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
  
  // Theme toggle functionality
  const themeToggle = document.querySelector('.theme-toggle');
  const toggleIcon = document.querySelector('.toggle-icon');
  
  if (themeToggle) {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      toggleIcon.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      
      if (document.body.classList.contains('light-mode')) {
        toggleIcon.textContent = '☀️';
        localStorage.setItem('theme', 'light');
      } else {
        toggleIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
      }
    });
  }
  
  // Initialize charts
  initCharts();
  
  // Add subtle hover effects to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'var(--box-shadow)';
    });
  });
});

function initCharts() {
  // Set global Chart.js options
  Chart.defaults.color = '#b3b3b3';
  Chart.defaults.font.family = "'Inter', sans-serif";
  
  // Funnel Overview Chart
  const funnelOverviewCtx = document.getElementById('funnelOverviewChart');
  if (funnelOverviewCtx) {
    new Chart(funnelOverviewCtx, {
      type: 'line',
      data: {
        labels: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'],
        datasets: [
          {
            label: 'Odwiedzający',
            data: [1200, 1900, 1500, 2000, 2400, 1800, 2200],
            borderColor: '#8a2be2',
            backgroundColor: 'rgba(138, 43, 226, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Konwersje',
            data: [120, 190, 150, 200, 240, 180, 220],
            borderColor: '#ff1493',
            backgroundColor: 'rgba(255, 20, 147, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            beginAtZero: true
          }
        }
      }
    });
  }
  
  // Traffic Sources Chart
  const trafficSourcesCtx = document.getElementById('trafficSourcesChart');
  if (trafficSourcesCtx) {
    new Chart(trafficSourcesCtx, {
      type: 'doughnut',
      data: {
        labels: ['Organic', 'Social', 'Referral', 'Direct', 'Email'],
        datasets: [{
          data: [35, 25, 15, 15, 10],
          backgroundColor: [
            '#8a2be2',
            '#ff1493',
            '#4ade80',
            '#fbbd24',
            '#3b82f6'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }
  
  // Device Conversions Chart
  const deviceConversionsCtx = document.getElementById('deviceConversionsChart');
  if (deviceConversionsCtx) {
    new Chart(deviceConversionsCtx, {
      type: 'bar',
      data: {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{
          label: 'Konwersje',
          data: [65, 30, 5],
          backgroundColor: [
            'rgba(138, 43, 226, 0.7)',
            'rgba(255, 20, 147, 0.7)',
            'rgba(74, 222, 128, 0.7)'
          ],
          borderColor: [
            'rgba(138, 43, 226, 1)',
            'rgba(255, 20, 147, 1)',
            'rgba(74, 222, 128, 1)'
          ],
          borderWidth: 1
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
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.raw}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }
  
  // Update charts on theme change
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isLightMode = document.body.classList.contains('light-mode');
        
        // Update chart colors based on theme
        Chart.defaults.color = isLightMode ? '#666666' : '#b3b3b3';
        
        // Force charts to update
        Chart.instances.forEach(chart => {
          if (chart.config.type === 'line' || chart.config.type === 'bar') {
            chart.options.scales.x.grid.color = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
            chart.options.scales.y.grid.color = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
          }
          
          chart.update();
        });
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
}
