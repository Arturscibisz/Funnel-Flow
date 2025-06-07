import { supabase, checkConnection, getTablesInfo, getSystemLogs } from './js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Przełączanie sidebar na urządzeniach mobilnych
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
  
  // Funkcjonalność przełączania motywu
  const themeToggle = document.querySelector('.theme-toggle');
  const toggleIcon = document.querySelector('.toggle-icon');
  
  if (themeToggle) {
    // Sprawdzenie zapisanego motywu
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
      
      // Aktualizacja wykresów po zmianie motywu
      updateChartsTheme();
    });
  }
  
  // Inicjalizacja wykresów
  initCharts();
  
  // Sprawdzenie połączenia z Supabase
  checkSupabaseConnection();
  
  // Załadowanie danych o tabelach
  loadTablesInfo();
  
  // Załadowanie logów systemowych
  loadSystemLogs();
  
  // Dodanie nasłuchiwania zdarzeń
  const checkConnectionBtn = document.getElementById('check-connection-btn');
  if (checkConnectionBtn) {
    checkConnectionBtn.addEventListener('click', checkSupabaseConnection);
  }
  
  const refreshStorageBtn = document.getElementById('refresh-storage-btn');
  if (refreshStorageBtn) {
    refreshStorageBtn.addEventListener('click', refreshStorageData);
  }
  
  const refreshLogsBtn = document.getElementById('refresh-logs-btn');
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', refreshLogs);
  }
  
  const logLevelSelect = document.getElementById('log-level-select');
  if (logLevelSelect) {
    logLevelSelect.addEventListener('change', filterLogs);
  }
  
  const timePeriodSelect = document.getElementById('time-period-select');
  if (timePeriodSelect) {
    timePeriodSelect.addEventListener('change', updateCharts);
  }
  
  const tableSearchInput = document.getElementById('table-search-input');
  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', filterTables);
  }
  
  // Dodanie efektów hover do kart
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

// Sprawdzenie połączenia z Supabase
async function checkSupabaseConnection() {
  const connectionStatusIcon = document.getElementById('connection-status-icon');
  const connectionStatus = document.getElementById('connection-status');
  const lastCheck = document.getElementById('last-check');
  const responseTime = document.getElementById('response-time');
  
  // Aktualizacja czasu ostatniego sprawdzenia
  const now = new Date();
  const formattedDate = formatDate(now);
  lastCheck.textContent = formattedDate;
  
  // Wyświetlenie stanu ładowania
  connectionStatus.textContent = 'Sprawdzanie...';
  
  try {
    // Sprawdzenie połączenia
    const result = await checkConnection();
    
    if (result.connected) {
      // Aktualizacja UI dla udanego połączenia
      connectionStatusIcon.classList.remove('disconnected');
      connectionStatusIcon.classList.add('connected');
      connectionStatusIcon.innerHTML = `
        <svg class="status-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5l7 7-7 7"></path>
        </svg>
      `;
      connectionStatus.textContent = 'Połączono';
      responseTime.textContent = `${result.responseTime} ms`;
      
      // Wyświetlenie powiadomienia o sukcesie
      showNotification('Połączenie z Supabase działa poprawnie', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Błąd połączenia:', error);
    
    // Aktualizacja UI dla nieudanego połączenia
    connectionStatusIcon.classList.remove('connected');
    connectionStatusIcon.classList.add('disconnected');
    connectionStatusIcon.innerHTML = `
      <svg class="status-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    connectionStatus.textContent = 'Brak połączenia';
    responseTime.textContent = 'N/A';
    
    // Wyświetlenie powiadomienia o błędzie
    showNotification(`Błąd połączenia: ${error.message}`, 'error');
  }
}

// Odświeżenie danych o wykorzystaniu bazy
async function refreshStorageData() {
  const storageUsage = document.getElementById('storage-usage');
  const tableCount = document.getElementById('table-count');
  const recordCount = document.getElementById('record-count');
  const lastUpdate = document.getElementById('last-update');
  const progressFill = document.querySelector('.progress-fill');
  const progressLabel = document.querySelector('.progress-label');
  
  // Wyświetlenie stanu ładowania
  storageUsage.textContent = 'Ładowanie...';
  tableCount.textContent = 'Ładowanie...';
  recordCount.textContent = 'Ładowanie...';
  
  try {
    // Pobranie danych o tabelach
    const tablesInfo = await getTablesInfo();
    
    // Aktualizacja danych
    storageUsage.textContent = `${tablesInfo.totalSize} / ${tablesInfo.totalStorage}`;
    tableCount.textContent = tablesInfo.tableCount.toString();
    recordCount.textContent = tablesInfo.recordCount.toLocaleString('pl-PL');
    
    // Aktualizacja paska postępu
    progressFill.style.width = `${tablesInfo.usagePercentage}%`;
    progressLabel.textContent = `${tablesInfo.usagePercentage}% wykorzystano`;
    
    // Aktualizacja czasu ostatniej aktualizacji
    const now = new Date();
    lastUpdate.textContent = formatDate(now);
    
    // Wyświetlenie powiadomienia o sukcesie
    showNotification('Dane o wykorzystaniu bazy zostały zaktualizowane', 'success');
    
    // Aktualizacja wykresu wykorzystania
    updateStorageChart();
    
    // Aktualizacja tabeli z listą tabel
    loadTablesInfo();
    
  } catch (error) {
    console.error('Błąd odświeżania danych o wykorzystaniu:', error);
    
    // Wyświetlenie powiadomienia o błędzie
    showNotification(`Błąd odświeżania danych: ${error.message}`, 'error');
  }
}

// Załadowanie informacji o tabelach
async function loadTablesInfo() {
  const tablesList = document.getElementById('tables-list');
  
  try {
    // Pobranie danych o tabelach
    const tablesInfo = await getTablesInfo();
    
    // Wyczyszczenie listy tabel
    tablesList.innerHTML = '';
    
    // Wypełnienie listy tabel
    tablesInfo.tables.forEach(table => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${table.name}</td>
        <td>${table.records.toLocaleString('pl-PL')}</td>
        <td>${table.size}</td>
        <td>${table.lastModified}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view-btn" title="Podgląd" data-table="${table.name}">
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="action-btn export-btn" title="Eksport" data-table="${table.name}">
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </td>
      `;
      tablesList.appendChild(row);
    });
    
    // Dodanie nasłuchiwania zdarzeń dla przycisków akcji
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tableName = button.getAttribute('data-table');
        showNotification(`Podgląd tabeli ${tableName} - funkcja w przygotowaniu`, 'info');
      });
    });
    
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tableName = button.getAttribute('data-table');
        showNotification(`Eksport tabeli ${tableName} - funkcja w przygotowaniu`, 'info');
      });
    });
    
  } catch (error) {
    console.error('Błąd ładowania informacji o tabelach:', error);
    tablesList.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center;">Błąd ładowania danych o tabelach</td>
      </tr>
    `;
  }
}

// Załadowanie logów systemowych
function loadSystemLogs(level = 'all') {
  const logsList = document.getElementById('logs-list');
  
  try {
    // Pobranie logów
    const logs = getSystemLogs(level);
    
    // Wyczyszczenie listy logów
    logsList.innerHTML = '';
    
    // Wypełnienie listy logów
    logs.forEach(log => {
      const row = document.createElement('tr');
      row.className = `log-${log.level}`;
      
      let levelText;
      switch (log.level) {
        case 'error':
          levelText = 'BŁĄD';
          break;
        case 'warning':
          levelText = 'OSTRZEŻENIE';
          break;
        case 'info':
          levelText = 'INFO';
          break;
        default:
          levelText = log.level.toUpperCase();
      }
      
      row.innerHTML = `
        <td>${log.time}</td>
        <td><span class="log-level ${log.level}">${levelText}</span></td>
        <td>${log.source}</td>
        <td>${log.message}</td>
      `;
      
      logsList.appendChild(row);
    });
    
  } catch (error) {
    console.error('Błąd ładowania logów systemowych:', error);
    logsList.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center;">Błąd ładowania logów systemowych</td>
      </tr>
    `;
  }
}

// Odświeżenie logów
function refreshLogs() {
  const logLevelSelect = document.getElementById('log-level-select');
  const selectedLevel = logLevelSelect ? logLevelSelect.value : 'all';
  
  // Wyświetlenie stanu ładowania
  const logsList = document.getElementById('logs-list');
  logsList.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center;">Ładowanie logów...</td>
    </tr>
  `;
  
  // Symulacja opóźnienia API
  setTimeout(() => {
    loadSystemLogs(selectedLevel);
    
    // Wyświetlenie powiadomienia o sukcesie
    showNotification('Logi zostały odświeżone', 'success');
  }, 500);
}

// Filtrowanie logów na podstawie wybranego poziomu
function filterLogs() {
  const logLevelSelect = document.getElementById('log-level-select');
  const selectedLevel = logLevelSelect.value;
  
  loadSystemLogs(selectedLevel);
}

// Filtrowanie tabel na podstawie wyszukiwania
function filterTables() {
  const tableSearchInput = document.getElementById('table-search-input');
  const searchTerm = tableSearchInput.value.toLowerCase();
  const tableRows = document.querySelectorAll('.tables-table tbody tr');
  
  tableRows.forEach(row => {
    const tableName = row.querySelector('td:first-child').textContent.toLowerCase();
    row.style.display = tableName.includes(searchTerm) ? '' : 'none';
  });
}

// Aktualizacja wykresów na podstawie wybranego okresu
function updateCharts() {
  const timePeriodSelect = document.getElementById('time-period-select');
  const selectedPeriod = timePeriodSelect.value;
  
  // Aktualizacja wszystkich wykresów z nowym okresem
  updateStorageChart(selectedPeriod);
  updateTablesSizeChart(selectedPeriod);
  updateQueriesChart(selectedPeriod);
  updateUserActivityChart(selectedPeriod);
  
  // Wyświetlenie powiadomienia
  showNotification(`Wykresy zaktualizowane dla okresu: ${timePeriodSelect.options[timePeriodSelect.selectedIndex].text}`, 'success');
}

// Inicjalizacja wykresów
function initCharts() {
  // Ustawienie globalnych opcji Chart.js
  Chart.defaults.color = '#b3b3b3';
  Chart.defaults.font.family = "'Inter', sans-serif";
  
  // Inicjalizacja wszystkich wykresów
  updateStorageChart('week');
  updateTablesSizeChart('week');
  updateQueriesChart('week');
  updateUserActivityChart('week');
}

// Aktualizacja motywu wykresów
function updateChartsTheme() {
  const isLightMode = document.body.classList.contains('light-mode');
  
  // Aktualizacja kolorów wykresów na podstawie motywu
  Chart.defaults.color = isLightMode ? '#666666' : '#b3b3b3';
  
  // Wymuszenie aktualizacji wykresów
  Chart.instances.forEach(chart => {
    if (chart.config.type === 'line' || chart.config.type === 'bar') {
      chart.options.scales.x.grid.color = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      chart.options.scales.y.grid.color = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    }
    
    chart.update();
  });
}

// Aktualizacja wykresu wykorzystania przestrzeni
function updateStorageChart(period = 'week') {
  const ctx = document.getElementById('storageUsageChart');
  if (!ctx) return;
  
  // Usunięcie istniejącego wykresu, jeśli istnieje
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Generowanie etykiet i danych na podstawie wybranego okresu
  let labels, data;
  
  switch (period) {
    case 'day':
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      data = generateRandomData(24, 10, 13);
      break;
    case 'month':
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      data = generateRandomData(30, 8, 15);
      break;
    case 'week':
    default:
      labels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
      data = generateRandomData(7, 9, 14);
  }
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Wykorzystanie (GB)',
        data: data,
        borderColor: '#8a2be2',
        backgroundColor: 'rgba(138, 43, 226, 0.1)',
        tension: 0.4,
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
          beginAtZero: false,
          min: Math.min(...data) - 1,
          max: Math.max(...data) + 1
        }
      }
    }
  });
}

// Aktualizacja wykresu rozmiaru tabel
function updateTablesSizeChart(period = 'week') {
  const ctx = document.getElementById('tablesSizeChart');
  if (!ctx) return;
  
  // Usunięcie istniejącego wykresu, jeśli istnieje
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['users', 'campaigns', 'analytics', 'funnels', 'roles'],
      datasets: [{
        label: 'Rozmiar (MB)',
        data: [2.4, 4.2, 3.8, 1.2, 0.2],
        backgroundColor: [
          'rgba(138, 43, 226, 0.7)',
          'rgba(255, 20, 147, 0.7)',
          'rgba(74, 222, 128, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(96, 165, 250, 0.7)'
        ],
        borderColor: [
          'rgba(138, 43, 226, 1)',
          'rgba(255, 20, 147, 1)',
          'rgba(74, 222, 128, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(96, 165, 250, 1)'
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
          borderWidth: 1
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
          beginAtZero: true
        }
      }
    }
  });
}

// Aktualizacja wykresu zapytań
function updateQueriesChart(period = 'week') {
  const ctx = document.getElementById('queriesChart');
  if (!ctx) return;
  
  // Usunięcie istniejącego wykresu, jeśli istnieje
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Generowanie etykiet i danych na podstawie wybranego okresu
  let labels, readData, writeData;
  
  switch (period) {
    case 'day':
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      readData = generateRandomData(24, 50, 200);
      writeData = generateRandomData(24, 20, 80);
      break;
    case 'month':
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      readData = generateRandomData(30, 100, 500);
      writeData = generateRandomData(30, 50, 200);
      break;
    case 'week':
    default:
      labels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
      readData = generateRandomData(7, 150, 400);
      writeData = generateRandomData(7, 50, 150);
  }
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Odczyt',
          data: readData,
          borderColor: '#8a2be2',
          backgroundColor: 'rgba(138, 43, 226, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Zapis',
          data: writeData,
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

// Aktualizacja wykresu aktywności użytkowników
function updateUserActivityChart(period = 'week') {
  const ctx = document.getElementById('userActivityChart');
  if (!ctx) return;
  
  // Usunięcie istniejącego wykresu, jeśli istnieje
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Generowanie etykiet i danych na podstawie wybranego okresu
  let labels, data;
  
  switch (period) {
    case 'day':
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      data = generateRandomData(24, 5, 30);
      break;
    case 'month':
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      data = generateRandomData(30, 10, 50);
      break;
    case 'week':
    default:
      labels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
      data = generateRandomData(7, 15, 40);
  }
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Aktywni użytkownicy',
        data: data,
        backgroundColor: 'rgba(255, 20, 147, 0.7)',
        borderColor: 'rgba(255, 20, 147, 1)',
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

// Funkcja pomocnicza do generowania losowych danych
function generateRandomData(length, min, max) {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

// Funkcja pomocnicza do formatowania daty
function formatDate(date) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('pl-PL', options);
}

// Funkcja pomocnicza do wyświetlania powiadomień
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.background = type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 
                                 type === 'error' ? 'rgba(248, 113, 113, 0.9)' : 
                                 'rgba(96, 165, 250, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = 'var(--border-radius)';
  notification.style.boxShadow = 'var(--box-shadow)';
  notification.style.zIndex = '1000';
  notification.style.animation = 'fadeIn 0.3s';
  
  // Dodanie keyframes dla animacji, jeśli jeszcze nie dodano
  if (!document.querySelector('#notification-keyframes')) {
    const style = document.createElement('style');
    style.id = 'notification-keyframes';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Ustawienie treści powiadomienia
  notification.textContent = message;
  
  // Dodanie powiadomienia do dokumentu
  document.body.appendChild(notification);
  
  // Usunięcie powiadomienia po 3 sekundach
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
