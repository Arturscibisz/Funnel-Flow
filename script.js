import { loginUser } from './js/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.neon-button');
  const glowPoint = document.querySelector('.glow-point');
  const loginForm = document.querySelector('.login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailGlowContainer = document.getElementById('email-glow');
  const passwordGlowContainer = document.getElementById('password-glow');
  
  // Button dimensions and position
  let buttonRect;
  let centerX;
  let centerY;
  let angle = 0;
  
  // Animation variables
  let animationId;
  const speed = 0.01; // Speed of rotation
  
  function updateButtonMetrics() {
    buttonRect = button.getBoundingClientRect();
    centerX = buttonRect.width / 2;
    centerY = buttonRect.height / 2;
  }
  
  function createGlowTrail(x, y, container) {
    const trail = document.createElement('div');
    trail.classList.add('glow-blur');
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    trail.style.width = '10px';
    trail.style.height = '10px';
    trail.style.borderRadius = '50%';
    trail.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 20, 147, 0.3) 70%, transparent 100%)';
    trail.style.position = 'absolute';
    trail.style.transform = 'translate(-50%, -50%)';
    
    container.appendChild(trail);
    
    // Animate and remove the trail
    setTimeout(() => {
      trail.style.opacity = '0';
      trail.style.width = '25px';
      trail.style.height = '25px';
      setTimeout(() => {
        trail.remove();
      }, 300);
    }, 10);
  }
  
  function animateGlow() {
    // Calculate position on the elliptical path
    const ellipseX = centerX + (buttonRect.width / 2 - 10) * Math.cos(angle);
    const ellipseY = centerY + (buttonRect.height / 2 - 10) * Math.sin(angle);
    
    // Position the glow point
    glowPoint.style.left = `${ellipseX}px`;
    glowPoint.style.top = `${ellipseY}px`;
    glowPoint.style.opacity = '1';
    
    // Create trail effect
    createGlowTrail(ellipseX, ellipseY, loginForm);
    
    // Increment angle for clockwise movement
    angle += speed;
    if (angle >= Math.PI * 2) {
      angle = 0;
    }
    
    animationId = requestAnimationFrame(animateGlow);
  }
  
  function startAnimation() {
    updateButtonMetrics();
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(animateGlow);
  }
  
  // Initialize on load and resize
  updateButtonMetrics();
  window.addEventListener('resize', updateButtonMetrics);
  
  // Start animation immediately
  startAnimation();
  
  // Enhance glow effect on hover
  button.addEventListener('mouseenter', () => {
    button.classList.add('hover-active');
  });
  
  button.addEventListener('mouseleave', () => {
    button.classList.remove('hover-active');
  });
  
  // Add input focus effects
  function addInputGlowEffect(input, container) {
    input.addEventListener('focus', () => {
      // Create a pulsing glow effect around the input
      const inputRect = input.getBoundingClientRect();
      const pulseGlow = document.createElement('div');
      pulseGlow.classList.add('input-glow-effect');
      pulseGlow.style.position = 'absolute';
      pulseGlow.style.top = '0';
      pulseGlow.style.left = '0';
      pulseGlow.style.width = '100%';
      pulseGlow.style.height = '100%';
      pulseGlow.style.borderRadius = '12px';
      pulseGlow.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5), 0 0 30px rgba(255, 20, 147, 0.3)';
      pulseGlow.style.opacity = '0';
      pulseGlow.style.animation = 'pulse-glow 2s infinite';
      
      container.appendChild(pulseGlow);
      
      // Add keyframes for the pulse animation
      if (!document.querySelector('#pulse-glow-keyframes')) {
        const style = document.createElement('style');
        style.id = 'pulse-glow-keyframes';
        style.textContent = `
          @keyframes pulse-glow {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.3; }
          }
        `;
        document.head.appendChild(style);
      }
    });
    
    input.addEventListener('blur', () => {
      // Remove the glow effect
      const glowEffect = container.querySelector('.input-glow-effect');
      if (glowEffect) {
        glowEffect.remove();
      }
    });
  }
  
  addInputGlowEffect(emailInput, emailGlowContainer);
  addInputGlowEffect(passwordInput, passwordGlowContainer);
  
  // Dodanie komunikatu o błędzie
  function showErrorMessage(message) {
    // Usuń istniejący komunikat o błędzie, jeśli istnieje
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Utwórz nowy komunikat o błędzie
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = message;
    errorMessage.style.color = '#f44336';
    errorMessage.style.fontSize = '14px';
    errorMessage.style.marginTop = '10px';
    errorMessage.style.textAlign = 'center';
    errorMessage.style.animation = 'fadeIn 0.3s';
    
    // Dodaj keyframes dla animacji
    if (!document.querySelector('#error-keyframes')) {
      const style = document.createElement('style');
      style.id = 'error-keyframes';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Dodaj komunikat o błędzie do formularza
    loginForm.appendChild(errorMessage);
  }
  
  // Form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Zmiana tekstu przycisku
    button.textContent = 'Logowanie...';
    button.disabled = true;
    
    try {
      // Logowanie użytkownika przez Supabase
      const result = await loginUser(email, password);
      
      if (result.success) {
        // Poprawne dane logowania
        button.textContent = 'Sukces!';
        button.style.background = 'linear-gradient(90deg, rgba(138, 43, 226, 0.8), rgba(255, 20, 147, 0.8))';
        
        // Przekierowanie do dashboardu po udanym logowaniu
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        // Niepoprawne dane logowania
        showErrorMessage('Niepoprawny email lub hasło. Spróbuj ponownie.');
        button.classList.add('error');
        button.textContent = 'Zaloguj się';
        button.disabled = false;
        
        // Usuń klasę błędu po chwili
        setTimeout(() => {
          button.classList.remove('error');
        }, 1000);
      }
    } catch (error) {
      console.error('Błąd logowania:', error);
      showErrorMessage('Wystąpił błąd podczas logowania. Spróbuj ponownie później.');
      button.textContent = 'Zaloguj się';
      button.disabled = false;
    }
  });
  
  // Theme toggle functionality
  const themeToggle = document.querySelector('.theme-toggle');
  const toggleIcon = document.querySelector('.toggle-icon');
  
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
});

// Add subtle parallax effect to the background
document.addEventListener('mousemove', (e) => {
  const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
  const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
  
  document.body.style.backgroundPosition = `${moveX}px ${moveY}px`;
});
