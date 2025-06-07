import { supabase } from './js/supabase.js';

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
  
  // Modal functionality
  const addRoleBtn = document.getElementById('add-role-btn');
  const roleModal = document.getElementById('role-modal');
  const deleteModal = document.getElementById('delete-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn');
  const cancelBtns = document.querySelectorAll('.cancel-btn');
  const deleteBtns = document.querySelectorAll('.delete-btn');
  const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
  const roleForm = document.getElementById('role-form');
  const editBtns = document.querySelectorAll('.edit-btn');
  
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
  
  // Open add role modal
  if (addRoleBtn && roleModal) {
    addRoleBtn.addEventListener('click', () => {
      // Reset form and set to "Add" mode
      roleForm.reset();
      document.querySelector('.modal-header h2').textContent = 'Dodaj rolę';
      document.querySelector('.submit-btn').textContent = 'Dodaj rolę';
      roleForm.dataset.mode = 'add';
      roleForm.dataset.roleId = '';
      
      openModal(roleModal);
    });
  }
  
  // Open edit role modal
  if (editBtns && roleModal) {
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Get role data from the card
        const roleCard = btn.closest('.role-card');
        const roleName = roleCard.querySelector('.role-title h3').textContent;
        const roleDescription = roleCard.querySelector('.role-description p').textContent;
        
        // Get permissions
        const permissionItems = roleCard.querySelectorAll('.permission-item');
        const permissions = {};
        
        permissionItems.forEach(item => {
          const name = item.querySelector('.permission-name').textContent;
          const status = item.querySelector('.permission-status').classList.contains('allowed');
          
          // Convert permission name to id
          const permId = 'perm-' + name.toLowerCase().replace('zarządzanie ', '').replace(' ', '-');
          permissions[permId] = status;
        });
        
        // Set form to "Edit" mode
        document.querySelector('.modal-header h2').textContent = 'Edytuj rolę';
        document.querySelector('.submit-btn').textContent = 'Zapisz zmiany';
        roleForm.dataset.mode = 'edit';
        roleForm.dataset.roleId = roleName.toLowerCase();
        
        // Fill form with role data
        document.getElementById('roleName').value = roleName;
        document.getElementById('roleDescription').value = roleDescription;
        
        // Set permissions checkboxes
        Object.keys(permissions).forEach(permId => {
          const checkbox = document.getElementById(permId);
          if (checkbox) {
            checkbox.checked = permissions[permId];
          }
        });
        
        openModal(roleModal);
      });
    });
  }
  
  // Open delete confirmation modal
  if (deleteBtns && deleteModal) {
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Get role name for confirmation message
        const roleCard = btn.closest('.role-card');
        const roleName = roleCard.querySelector('.role-title h3').textContent;
        
        // Set role ID for deletion
        confirmDeleteBtn.dataset.roleId = roleName.toLowerCase();
        
        // Update confirmation message
        document.querySelector('.delete-message').textContent = `Czy na pewno chcesz usunąć rolę "${roleName}"? Ta operacja jest nieodwracalna i może wpłynąć na użytkowników przypisanych do tej roli.`;
        
        openModal(deleteModal);
      });
    });
  }
  
  // Close modals
  if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(roleModal);
        closeModal(deleteModal);
      });
    });
  }
  
  if (cancelBtns) {
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(roleModal);
        closeModal(deleteModal);
      });
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === roleModal) {
      closeModal(roleModal);
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
  
  // Handle role form submission
  if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const roleName = document.getElementById('roleName').value;
      const roleDescription = document.getElementById('roleDescription').value;
      
      // Get permissions
      const permissions = {
        users: document.getElementById('perm-users').checked,
        roles: document.getElementById('perm-roles').checked,
        campaigns: document.getElementById('perm-campaigns').checked,
        analytics: document.getElementById('perm-analytics').checked,
        settings: document.getElementById('perm-settings').checked,
        export: document.getElementById('perm-export').checked
      };
      
      // Simulate form submission
      const submitBtn = roleForm.querySelector('.submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = roleForm.dataset.mode === 'add' ? 'Dodawanie...' : 'Zapisywanie...';
      submitBtn.disabled = true;
      
      try {
        // Create or update role in Supabase
        if (roleForm.dataset.mode === 'add') {
          // Create new role
          const { data, error } = await supabase
            .from('roles')
            .insert([
              {
                name: roleName.toLowerCase(),
                display_name: roleName,
                description: roleDescription,
                permissions: permissions
              }
            ]);
          
          if (error) throw error;
          
          // Create success notification
          showNotification(`Rola "${roleName}" została dodana pomyślnie`);
        } else {
          // Update existing role
          const { data, error } = await supabase
            .from('roles')
            .update({
              display_name: roleName,
              description: roleDescription,
              permissions: permissions
            })
            .eq('name', roleForm.dataset.roleId);
          
          if (error) throw error;
          
          // Create success notification
          showNotification(`Rola "${roleName}" została zaktualizowana pomyślnie`);
        }
        
        // Close modal and reset form
        closeModal(roleModal);
        roleForm.reset();
        
        // Reload page to show updated roles
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error saving role:', error);
        showNotification(`Błąd: ${error.message}`, 'error');
      } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Handle delete confirmation
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      // Get role ID to delete
      const roleId = confirmDeleteBtn.dataset.roleId;
      
      // Simulate delete operation
      confirmDeleteBtn.textContent = 'Usuwanie...';
      confirmDeleteBtn.disabled = true;
      
      try {
        // Check if role has assigned users
        const { data: usersWithRole, error: userCheckError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role_id', roleId);
        
        if (userCheckError) throw userCheckError;
        
        if (usersWithRole && usersWithRole.length > 0) {
          throw new Error(`Nie można usunąć roli, ponieważ jest przypisana do ${usersWithRole.length} użytkowników. Najpierw zmień role tych użytkowników.`);
        }
        
        // Delete role
        const { error: deleteError } = await supabase
          .from('roles')
          .delete()
          .eq('name', roleId);
        
        if (deleteError) throw deleteError;
        
        // Create success notification
        showNotification('Rola została usunięta pomyślnie');
        
        // Close modal
        closeModal(deleteModal);
        
        // Reload page to show updated roles
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error deleting role:', error);
        showNotification(`Błąd: ${error.message}`, 'error');
      } finally {
        // Reset button
        confirmDeleteBtn.textContent = 'Usuń';
        confirmDeleteBtn.disabled = false;
      }
    });
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
  
  // Add subtle hover effects to role cards
  const roleCards = document.querySelectorAll('.role-card');
  roleCards.forEach(card => {
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
