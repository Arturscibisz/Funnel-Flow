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
  
  // Settings tabs functionality
  const tabItems = document.querySelectorAll('.settings-tabs li');
  const panels = document.querySelectorAll('.settings-panel');
  
  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabItems.forEach(item => item.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all panels
      panels.forEach(panel => panel.classList.remove('active'));
      
      // Show the corresponding panel
      const panelId = `${tab.getAttribute('data-tab')}-panel`;
      document.getElementById(panelId).classList.add('active');
    });
  });
  
  // Show/hide API key
  const showKeyBtn = document.querySelector('.show-key-btn');
  const apiKeyInput = document.querySelector('.api-key-input');
  
  if (showKeyBtn && apiKeyInput) {
    showKeyBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        showKeyBtn.textContent = 'Ukryj';
      } else {
        apiKeyInput.type = 'password';
        showKeyBtn.textContent = 'Pokaż';
      }
    });
  }
  
  // Form submission handling
  const settingsForms = document.querySelectorAll('.settings-form');
  
  settingsForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Show saving indicator
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Zapisywanie...';
      submitBtn.disabled = true;
      
      // Simulate API call
      setTimeout(() => {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.style.background = 'rgba(74, 222, 128, 0.1)';
        successMessage.style.color = 'var(--success-color)';
        successMessage.style.padding = '12px 16px';
        successMessage.style.borderRadius = 'var(--border-radius)';
        successMessage.style.marginTop = '16px';
        successMessage.style.display = 'flex';
        successMessage.style.alignItems = 'center';
        successMessage.style.justifyContent = 'space-between';
        
        const messageText = document.createElement('span');
        messageText.textContent = 'Zmiany zostały zapisane pomyślnie!';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'var(--success-color)';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        
        successMessage.appendChild(messageText);
        successMessage.appendChild(closeBtn);
        
        // Add message after form actions
        const formActions = form.querySelector('.form-actions');
        formActions.insertAdjacentElement('afterend', successMessage);
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Remove message after 5 seconds or on close button click
        closeBtn.addEventListener('click', () => {
          successMessage.remove();
        });
        
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.remove();
          }
        }, 5000);
      }, 1500);
    });
  });
  
  // Avatar change functionality
  const changeAvatarBtn = document.querySelector('.change-avatar-btn');
  
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', () => {
      // Create a file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
      // Trigger click on file input
      fileInput.click();
      
      // Handle file selection
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            // Update all avatar images
            const avatarImages = document.querySelectorAll('.avatar img, .profile-avatar img');
            avatarImages.forEach(img => {
              img.src = e.target.result;
            });
            
            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.background = 'rgba(74, 222, 128, 0.9)';
            notification.style.color = 'white';
            notification.style.padding = '12px 20px';
            notification.style.borderRadius = 'var(--border-radius)';
            notification.style.boxShadow = 'var(--box-shadow)';
            notification.style.zIndex = '1000';
            notification.style.animation = 'fadeIn 0.3s';
            notification.textContent = 'Zdjęcie profilowe zostało zaktualizowane';
            
            // Add keyframes for animation
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
            
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
              notification.style.animation = 'fadeOut 0.3s';
              setTimeout(() => {
                notification.remove();
              }, 300);
            }, 3000);
          };
          
          reader.readAsDataURL(fileInput.files[0]);
        }
        
        // Remove the file input
        fileInput.remove();
      });
    });
  }
  
  // Toggle switches animation
  const toggleSwitches = document.querySelectorAll('.toggle-switch input');
  
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', () => {
      const slider = toggle.nextElementSibling;
      
      if (toggle.checked) {
        slider.style.animation = 'none';
        void slider.offsetWidth; // Trigger reflow
        slider.style.animation = 'toggleOn 0.3s forwards';
      } else {
        slider.style.animation = 'none';
        void slider.offsetWidth; // Trigger reflow
        slider.style.animation = 'toggleOff 0.3s forwards';
      }
    });
  });
  
  // Add keyframes for toggle animation
  if (!document.querySelector('#toggle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toggle-keyframes';
    style.textContent = `
      @keyframes toggleOn {
        0% { background-color: rgba(255, 255, 255, 0.1); }
        100% { background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); }
      }
      @keyframes toggleOff {
        0% { background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); }
        100% { background-color: rgba(255, 255, 255, 0.1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Connect buttons functionality
  const connectButtons = document.querySelectorAll('.connect-btn:not(.connected)');
  
  connectButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Change button text and style
      button.textContent = 'Łączenie...';
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.disabled = true;
      
      // Simulate connection process
      setTimeout(() => {
        button.textContent = 'Połączono';
        button.classList.add('connected');
        button.style.background = '';
        button.disabled = false;
        
        // Show success notification
        const integrationName = button.previousElementSibling.querySelector('h4').textContent;
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = 'rgba(74, 222, 128, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = 'var(--border-radius)';
        notification.style.boxShadow = 'var(--box-shadow)';
        notification.style.zIndex = '1000';
        notification.style.animation = 'fadeIn 0.3s';
        notification.textContent = `Połączono z ${integrationName}`;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.style.animation = 'fadeOut 0.3s';
          setTimeout(() => {
            notification.remove();
          }, 300);
        }, 3000);
      }, 2000);
    });
  });
  
  // Regenerate API key functionality
  const regenerateKeyBtn = document.querySelector('.regenerate-key-btn');
  
  if (regenerateKeyBtn && apiKeyInput) {
    regenerateKeyBtn.addEventListener('click', () => {
      // Show confirmation dialog
      const confirmation = confirm('Czy na pewno chcesz wygenerować nowy klucz API? Wszystkie istniejące integracje przestaną działać.');
      
      if (confirmation) {
        // Change button text
        regenerateKeyBtn.textContent = 'Generowanie...';
        regenerateKeyBtn.disabled = true;
        
        // Simulate API key generation
        setTimeout(() => {
          // Generate a random API key
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let newKey = 'sk_live_';
          for (let i = 0; i < 30; i++) {
            newKey += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          
          // Update the API key input
          apiKeyInput.value = newKey;
          apiKeyInput.type = 'text';
          if (showKeyBtn) {
            showKeyBtn.textContent = 'Ukryj';
          }
          
          // Reset button
          regenerateKeyBtn.textContent = 'Wygeneruj nowy klucz';
          regenerateKeyBtn.disabled = false;
          
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'notification';
          notification.style.position = 'fixed';
          notification.style.bottom = '20px';
          notification.style.right = '20px';
          notification.style.background = 'rgba(74, 222, 128, 0.9)';
          notification.style.color = 'white';
          notification.style.padding = '12px 20px';
          notification.style.borderRadius = 'var(--border-radius)';
          notification.style.boxShadow = 'var(--box-shadow)';
          notification.style.zIndex = '1000';
          notification.style.animation = 'fadeIn 0.3s';
          notification.textContent = 'Nowy klucz API został wygenerowany';
          
          document.body.appendChild(notification);
          
          // Auto-hide API key after 5 seconds
          setTimeout(() => {
            if (apiKeyInput.type === 'text') {
              apiKeyInput.type = 'password';
              if (showKeyBtn) {
                showKeyBtn.textContent = 'Pokaż';
              }
            }
          }, 5000);
          
          // Remove notification after 3 seconds
          setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
              notification.remove();
            }, 300);
          }, 3000);
        }, 1500);
      }
    });
  }
  
  // Delete account functionality
  const deleteAccountBtn = document.querySelector('.delete-account-btn');
  
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      // Show confirmation dialog
      const confirmation = confirm('Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna i spowoduje utratę wszystkich danych.');
      
      if (confirmation) {
        // Show second confirmation
        const secondConfirmation = prompt('Wpisz "USUŃ KONTO", aby potwierdzić.');
        
        if (secondConfirmation === 'USUŃ KONTO') {
          // Change button text
          deleteAccountBtn.textContent = 'Usuwanie...';
          deleteAccountBtn.disabled = true;
          
          // Simulate account deletion
          setTimeout(() => {
            // Redirect to login page
            window.location.href = 'index.html';
          }, 2000);
        }
      }
    });
  }
});
