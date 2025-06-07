import { initAuth, getCurrentUser, logoutUser, hasRole } from './auth.js';
import { checkConnection, getTablesInfo, getSystemLogs } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Inicjalizacja autoryzacji
  const authState = await initAuth();
  
  if (!authState.loggedIn) {
    // Jeśli użytkownik nie jest zalogowany, przekieruj do strony logowania
    window.location.href = 'index.html';
    return;
  }
  
  // Pobierz dane zalogowanego użytkownika
  const user = getCurrentUser();
  
  // Aktualizuj interfejs na podstawie danych użytkownika
  updateUserInterface(user);
  
  // Inicjalizacja funkcji dashboardu
  initDashboard();
  
  // Obsługa wylogowania
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const result = await logoutUser();
      if (result.success) {
        window.location.href = 'index.html';
      } else {
        console.error('Błąd podczas wylogowania:', result.error);
        alert('Wystąpił błąd podczas wylogowania. Spróbuj ponownie.');
      }
    });
  }
});

// Funkcja do aktualizacji interfejsu na podstawie danych użytkownika
function updateUserInterface(user) {
  // Aktualizuj nazwę użytkownika
  const userNameElements = document.querySelectorAll('.user-name');
  userNameElements.forEach(element => {
    element.textContent = `${user.firstName} ${user.lastName}`;
  });
  
  // Aktualizuj avatar użytkownika
  const userAvatarElements = document.querySelectorAll('.user-avatar');
  userAvatarElements.forEach(element => {
    if (user.avatarUrl) {
      element.src = user.avatarUrl;
    } else {
      // Domyślny avatar z inicjałami
      element.style.display = 'none';
      const parent = element.parentElement;
      const initials = document.createElement('div');
      initials.classList.add('avatar-initials');
      initials.textContent = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
      parent.appendChild(initials);
    }
  });
  
  // Aktualizuj nazwę firmy
  const companyElements = document.querySelectorAll('.user-company');
  companyElements.forEach(element => {
    element.textContent = user.company || 'FunnelFlow Sp. z o.o.';
  });
  
  // Aktualizuj role użytkownika
  const roleElements = document.querySelectorAll('.user-role');
  if (user.roles && user.roles.length > 0) {
    const roleName = user.roles[0].name;
    roleElements.forEach(element => {
      element.textContent = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    });
  }
  
  // Ukryj elementy dostępne tylko dla superadmina
  if (!hasRole('superadmin')) {
    const superadminElements = document.querySelectorAll('.superadmin-only');
    superadminElements.forEach(element => {
      element.style.display = 'none';
    });
  }
}

// Funkcja inicjalizująca dashboard
async function initDashboard() {
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
  
  // Inicjalizacja sekcji dla superadmina
  if (hasRole('superadmin')) {
    initSuperadminDashboard();
  }
}

// Funkcja inicjalizująca dashboard dla superadmina
async function initSuperadminDashboard() {
  // Sprawdź połączenie z Supabase
  const connectionStatus = await checkConnection();
  updateConnectionStatus(connectionStatus);
  
  // Pobierz informacje o tabelach
  const tablesInfo = await getTablesInfo();
  updateTablesInfo(tablesInfo);
  
  // Pobierz logi systemowe
  const logs = getSystemLogs();
  updateSystemLogs(logs);
  
  // Inicjalizuj filtry logów
  initLogFilters();
}

// Funkcja aktualizująca status połączenia
function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connection-status');
  const responseTimeElement = document.getElementById('response-time');
  
  if (statusElement && responseTimeElement) {
    if (status.connected) {
      statusElement.textContent = 'Połączono';
      statusElement.classList.add('status-connected');
      responseTimeElement.textContent = `${status.responseTime} ms`;
    } else {
      statusElement.textContent = 'Rozłączono';
      statusElement.classList.add('status-disconnected');
      responseTimeElement.textContent = 'N/A';
    }
  }
}

// Funkcja aktualizująca informacje o tabelach
function updateTablesInfo(info) {
  // Aktualizuj statystyki
  const totalSizeElement = document.getElementById('total-size');
  const usageElement = document.getElementById('storage-usage');
  const tableCountElement = document.getElementById('table-count');
  const recordCountElement = document.getElementById('record-count');
  
  if (totalSizeElement) totalSizeElement.textContent = info.totalSize;
  if (usageElement) {
    usageElement.textContent = `${info.usagePercentage}%`;
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
      progressBar.style.width = `${info.usagePercentage}%`;
      
      // Zmień kolor paska postępu w zależności od wykorzystania
      if (info.usagePercentage > 90) {
        progressBar.style.backgroundColor = 'var(--color-danger)';
      } else if (info.usagePercentage > 70) {
        progressBar.style.backgroundColor = 'var(--color-warning)';
      }
    }
  }
  if (tableCountElement) tableCountElement.textContent = info.tableCount;
  if (recordCountElement) recordCountElement.textContent = info.recordCount.toLocaleString();
  
  // Aktualizuj tabelę z informacjami o tabelach
  const tableBody = document.querySelector('.tables-table tbody');
  if (tableBody && info.tables) {
    tableBody.innerHTML = '';
    
    info.tables.forEach(table => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${table.name}</td>
        <td>${table.records.toLocaleString()}</td>
        <td>${table.size}</td>
        <td>${table.lastModified}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }
}

// Funkcja aktualizująca logi systemowe
function updateSystemLogs(logs) {
  const logsContainer = document.querySelector('.logs-container');
  if (logsContainer) {
    logsContainer.innerHTML = '';
    
    logs.forEach(log => {
      const logItem = document.createElement('div');
      logItem.classList.add('log-item');
      logItem.classList.add(`log-${log.level}`);
      
      logItem.innerHTML = `
        <div class="log-time">${log.time}</div>
        <div class="log-level">${log.level.toUpperCase()}</div>
        <div class="log-source">${log.source}</div>
        <div class="log-message">${log.message}</div>
      `;
      
      logsContainer.appendChild(logItem);
    });
  }
}

// Funkcja inicjalizująca filtry logów
function initLogFilters() {
  const logLevelFilter = document.getElementById('log-level-filter');
  
  if (logLevelFilter) {
    logLevelFilter.addEventListener('change', () => {
      const level = logLevelFilter.value;
      const logs = getSystemLogs(level);
      updateSystemLogs(logs);
    });
  }
}
