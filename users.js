import { supabase } from './js/supabase.js';
import { initAuth, getCurrentUser, hasRole, getAllUsers, registerUser, deleteUser, changeUserRole } from './js/auth.js';

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
  
  // Sprawdź czy użytkownik ma uprawnienia do zarządzania użytkownikami
  if (!hasRole('superadmin') && !hasRole('admin')) {
    // Przekieruj do dashboardu jeśli nie ma uprawnień
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Aktualizuj interfejs na podstawie danych użytkownika
  updateUserInterface(user);
  
  // Inicjalizacja funkcji strony użytkowników
  initUsersPage();
  
  // Pobierz i wyświetl listę użytkowników
  await loadUsers();
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

// Funkcja inicjalizująca stronę użytkowników
function initUsersPage() {
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
  
  // Select all checkbox functionality
  const selectAllCheckbox = document.getElementById('select-all');
  const userCheckboxes = document.querySelectorAll('.users-table tbody input[type="checkbox"]');
  
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      userCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
      });
    });
    
    // Update select all checkbox when individual checkboxes change
    userCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const allChecked = Array.from(userCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(userCheckboxes).some(cb => cb.checked);
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
      });
    });
  }
  
  // Modal functionality
  const addUserBtn = document.querySelector('.add-user-btn');
  const userModal = document.getElementById('user-modal');
  const deleteModal = document.getElementById('delete-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn');
  const cancelBtns = document.querySelectorAll('.cancel-btn');
  const deleteBtns = document.querySelectorAll('.delete-btn');
  const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
  const userForm = document.getElementById('user-form');
  
  // Function to open modal
  function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Function to close modal
  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Open add user modal
  if (addUserBtn && userModal) {
    addUserBtn.addEventListener('click', () => {
      openModal(userModal);
    });
  }
  
  // Close modals
  if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(userModal);
        closeModal(deleteModal);
      });
    });
  }
  
  if (cancelBtns) {
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(userModal);
        closeModal(deleteModal);
      });
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === userModal) {
      closeModal(userModal);
    }
    if (e.target === deleteModal) {
      closeModal(deleteModal);
    }
  });
  
  // Prevent modal close when clicking inside modal content
  const modalContents = document.querySelectorAll('.modal-content');
  modalContents.forEach(content => {
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
  
  // Handle user form submission
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      const company = document.getElementById('company').value;
      const sendInvitation = document.getElementById('send-invitation').checked;
      
      // Simulate form submission
      const submitBtn = userForm.querySelector('.submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Dodawanie...';
      submitBtn.disabled = true;
      
      try {
        // Rejestracja użytkownika
        const result = await registerUser(email, password, {
          firstName,
          lastName,
          company,
          role
        });
        
        if (result.success) {
          // Create success notification
          showNotification(`Użytkownik ${firstName} ${lastName} został dodany pomyślnie${sendInvitation ? ' i zaproszenie zostało wysłane' : ''}`);
          
          // Close modal and reset form
          closeModal(userModal);
          userForm.reset();
          
          // Odśwież listę użytkowników
          await loadUsers();
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error creating user:', error);
        showNotification(`Błąd: ${error.message}`, 'error');
      } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Filter functionality
  const filterSelects = document.querySelectorAll('.filter-select');
  const clearFiltersBtn = document.querySelector('.clear-filters-btn');
  
  if (filterSelects && clearFiltersBtn) {
    // Apply filters
    filterSelects.forEach(select => {
      select.addEventListener('change', () => {
        applyFilters();
      });
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', () => {
      filterSelects.forEach(select => {
        select.value = 'all';
      });
      applyFilters();
    });
  }
  
  // Pagination functionality (simulated)
  const pageButtons = document.querySelectorAll('.page-btn');
  const prevButton = document.querySelector('.prev-btn');
  const nextButton = document.querySelector('.next-btn');
  
  if (pageButtons && prevButton && nextButton) {
    pageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        pageButtons.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Enable/disable prev/next buttons based on current page
        const currentPage = parseInt(btn.textContent);
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === 10;
        
        // Simulate page change
        const tableBody = document.querySelector('.users-table tbody');
        if (tableBody) {
          tableBody.style.opacity = '0.5';
          
          setTimeout(() => {
            tableBody.style.opacity = '1';
          }, 300);
        }
      });
    });
    
    // Previous page button
    prevButton.addEventListener('click', () => {
      const activePage = document.querySelector('.page-btn.active');
      if (activePage && activePage.previousElementSibling && activePage.previousElementSibling.classList.contains('page-btn')) {
        activePage.previousElementSibling.click();
      }
    });
    
    // Next page button
    nextButton.addEventListener('click', () => {
      const activePage = document.querySelector('.page-btn.active');
      if (activePage && activePage.nextElementSibling && activePage.nextElementSibling.classList.contains('page-btn')) {
        activePage.nextElementSibling.click();
      }
    });
  }
  
  // Add subtle hover effects to cards
  const cards = document.querySelectorAll('.stat-card');
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
}

// Funkcja do pobierania i wyświetlania listy użytkowników
async function loadUsers() {
  try {
    const result = await getAllUsers();
    
    if (result.success) {
      displayUsers(result.users);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Błąd podczas pobierania użytkowników:', error);
    showNotification(`Błąd: ${error.message}`, 'error');
  }
}

// Funkcja do wyświetlania listy użytkowników
function displayUsers(users) {
  const tableBody = document.querySelector('.users-table tbody');
  if (!tableBody) return;
  
  // Wyczyść tabelę
  tableBody.innerHTML = '';
  
  // Dodaj użytkowników do tabeli
  users.forEach(user => {
    const row = document.createElement('tr');
    
    // Określ rolę użytkownika
    const roleName = user.roles && user.roles.length > 0 
      ? user.roles[0].name.charAt(0).toUpperCase() + user.roles[0].name.slice(1)
      : 'Użytkownik';
    
    // Określ status użytkownika (aktywny/nieaktywny)
    const status = 'Aktywny'; // W rzeczywistej aplikacji pobierałbyś to z danych użytkownika
    
    // Formatuj datę utworzenia
    const createdAt = new Date(user.createdAt);
    const formattedDate = createdAt.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    row.innerHTML = `
      <td>
        <input type="checkbox" class="user-checkbox" data-user-id="${user.id}">
      </td>
      <td>
        <div class="user-info">
          <div class="user-avatar-container">
            ${user.avatarUrl 
              ? `<img src="${user.avatarUrl}" alt="${user.firstName}" class="user-avatar-small">` 
              : `<div class="avatar-initials-small">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>`
            }
          </div>
          <div>
            <div class="user-name-table">${user.firstName} ${user.lastName}</div>
            <div class="user-email">${user.email || ''}</div>
          </div>
        </div>
      </td>
      <td>${roleName}</td>
      <td>
        <span class="status-badge ${status === 'Aktywny' ? 'status-active' : 'status-inactive'}">
          ${status}
        </span>
      </td>
      <td>${formattedDate}</td>
      <td>${user.company || 'FunnelFlow Sp. z o.o.'}</td>
      <td>
        <div class="action-buttons">
          <button class="edit-btn" data-user-id="${user.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" data-user-id="${user.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Aktualizuj licznik użytkowników
  const userCountElement = document.getElementById('user-count');
  if (userCountElement) {
    userCountElement.textContent = users.length;
  }
  
  // Dodaj obsługę przycisków edycji i usuwania
  initUserActions();
}

// Funkcja inicjalizująca akcje dla użytkowników (edycja, usuwanie)
function initUserActions() {
  // Obsługa przycisku usuwania
  const deleteBtns = document.querySelectorAll('.delete-btn');
  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
  
  // Function to open modal
  function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Function to close modal
  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (deleteBtns && deleteModal) {
    let userToDelete = null;
    
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        userToDelete = btn.getAttribute('data-user-id');
        openModal(deleteModal);
      });
    });
    
    // Obsługa potwierdzenia usunięcia
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (!userToDelete) return;
        
        // Symulacja usuwania
        confirmDeleteBtn.textContent = 'Usuwanie...';
        confirmDeleteBtn.disabled = true;
        
        try {
          const result = await deleteUser(userToDelete);
          
          if (result.success) {
            // Powiadomienie o sukcesie
            showNotification('Użytkownik został usunięty pomyślnie');
            
            // Zamknij modal
            closeModal(deleteModal);
            
            // Odśwież listę użytkowników
            await loadUsers();
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          console.error('Błąd podczas usuwania użytkownika:', error);
          showNotification(`Błąd: ${error.message}`, 'error');
        } finally {
          // Reset przycisku
          confirmDeleteBtn.textContent = 'Usuń';
          confirmDeleteBtn.disabled = false;
          userToDelete = null;
        }
      });
    }
  }
  
  // Obsługa przycisku edycji (do zaimplementowania)
  const editBtns = document.querySelectorAll('.edit-btn');
  if (editBtns) {
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        // Tutaj implementacja edycji użytkownika
        showNotification('Funkcja edycji użytkownika będzie dostępna wkrótce');
      });
    });
  }
}

// Funkcja do filtrowania użytkowników
function applyFilters() {
  const roleFilter = document.getElementById('role-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  const dateFilter = document.getElementById('date-filter').value;
  
  // Pobierz wszystkie wiersze tabeli
  const rows = document.querySelectorAll('.users-table tbody tr');
  
  // Pokaż stan ładowania
  rows.forEach(row => {
    row.style.opacity = '0.5';
  });
  
  // Symuluj opóźnienie filtrowania
  setTimeout(async () => {
    // W rzeczywistej aplikacji pobierałbyś dane z Supabase z odpowiednimi filtrami
    // Tutaj odświeżamy całą listę i filtrujemy lokalnie
    await loadUsers();
    
    rows.forEach(row => {
      row.style.opacity = '1';
    });
  }, 500);
}

// Helper function to generate a random password
function generateRandomPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Helper function to show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.background = type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(248, 113, 113, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = 'var(--border-radius)';
  notification.style.boxShadow = 'var(--box-shadow)';
  notification.style.zIndex = '1000';
  notification.style.animation = 'fadeIn 0.3s';
  
  // Add keyframes for animation if not already added
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
  
  // Set notification content
  notification.textContent = message;
  
  // Add notification to the document
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
