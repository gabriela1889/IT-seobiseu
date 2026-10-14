/**
 * IT seobiseu - Interactive Modals, Drawers, Real-time Filters & Validation System
 * Enhanced SaaS Micro-Interactions, Button Spinners & Top-Right Toasts
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCurrentNavigation();
  initSidebar();
  initSearch();
  initNotifications();
  initUserDropdown();
  initQuickStats();
  initSkeletonSimulators();
  initDrawersAndModals();
  initRealtimeFilters();
  initFormValidations();
});

/* ==========================================================================
   0. THEME & RESPONSIVE NAVIGATION
   ========================================================================== */
function initTheme() {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('it_seobiseu_theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = storedTheme || (prefersLight ? 'light' : 'dark');

  root.classList.toggle('dark', initialTheme === 'dark');
  root.style.colorScheme = initialTheme;

  const header = document.getElementById('mainHeader');
  const notification = document.getElementById('notifToggleBtn');

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.id = 'themeToggleBtn';
  themeButton.className = 'theme-toggle p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl border border-transparent hover:border-slate-700/60 transition-all btn-pro';
  themeButton.setAttribute('aria-label', 'Cambiar a modo claro');
  themeButton.title = 'Cambiar tema';
  if (header && notification) {
    notification.parentElement.before(themeButton);
  } else {
    themeButton.classList.add('fixed', 'top-4', 'right-4', 'z-50', 'bg-[#1C2541]/90', 'backdrop-blur-xl');
    document.body.appendChild(themeButton);
  }

  const mobileButton = document.createElement('button');
  mobileButton.type = 'button';
  mobileButton.id = 'mobileMenuBtn';
  mobileButton.className = 'hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-xl border border-transparent transition-all btn-pro';
  mobileButton.setAttribute('aria-label', 'Abrir menú de navegación');
  mobileButton.innerHTML = '<span class="material-symbols-outlined text-[20px]">menu</span>';
  if (header) {
    const search = header.querySelector('.global-search-input');
    if (search) search.closest('.relative').before(mobileButton);
  }

  const updateThemeButton = () => {
    const isDark = root.classList.contains('dark');
    themeButton.innerHTML = `<span class="material-symbols-outlined text-[20px]">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
    themeButton.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  };

  themeButton.addEventListener('click', () => {
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    localStorage.setItem('it_seobiseu_theme', nextTheme);
    updateThemeButton();
  });

  mobileButton.addEventListener('click', () => {
    const sidebar = document.getElementById('mainSidebar');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('mobile-open');
    mobileButton.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  });

  updateThemeButton();
}

function initCurrentNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainSidebar nav a[href]').forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ==========================================================================
   1. TOAST NOTIFICATION SYSTEM (Top-Right Floating Notifications)
   ========================================================================== */
export function showToast(message, type = 'success', title = '') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl backdrop-blur-2xl border shadow-2xl transition-all duration-300 transform -translate-y-4 opacity-0 animate-in fade-in slide-in-from-top-3 ${
    type === 'success' 
      ? 'bg-[#1C2541]/95 border-emerald-500/40 text-slate-100 shadow-emerald-500/10' 
      : type === 'error'
      ? 'bg-[#1C2541]/95 border-rose-500/40 text-slate-100 shadow-rose-500/10'
      : 'bg-[#1C2541]/95 border-sky-500/40 text-slate-100 shadow-sky-500/10'
  }`;

  const iconName = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  const iconColor = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-brand-cyan';
  const defaultTitle = type === 'success' ? 'Operación Exitosa' : type === 'error' ? 'Error de Validación' : 'Notificación';

  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-[20px] shrink-0 mt-0.5">${iconName}</span>
    <div class="flex flex-col flex-1 min-w-0">
      <span class="font-display font-bold text-xs ${iconColor}">${title || defaultTitle}</span>
      <span class="text-xs text-slate-300 mt-0.5 leading-relaxed truncate">${message}</span>
    </div>
    <button class="text-slate-400 hover:text-white p-0.5 rounded-lg transition-colors" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[14px]">close</span>
    </button>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-6');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Window scope for inline HTML button triggers
window.showToast = showToast;

/* ==========================================================================
   2. DRAWERS & MODALS CONTROLLER (Smooth Slide-In & Pop-ins)
   ========================================================================== */
function initDrawersAndModals() {
  const drawer = document.getElementById('techDetailDrawer');
  const openDrawerBtns = document.querySelectorAll('.btn-open-drawer');
  const closeDrawerBtns = document.querySelectorAll('.btn-close-drawer');

  openDrawerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.getAttribute('data-order-id') || '#OT-2024-8842';
      const client = btn.getAttribute('data-client') || 'Banco Santander';
      const device = btn.getAttribute('data-device') || 'Dell PowerEdge R750 (2U)';
      
      populateDrawerData(orderId, client, device);
      openDrawer(drawer);
    });
  });

  closeDrawerBtns.forEach(btn => {
    btn.addEventListener('click', () => closeDrawer(drawer));
  });

  // Generic Modals
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  const modalCloseBtns = document.querySelectorAll('[data-modal-close]');

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-modal-target');
      const targetModal = document.getElementById(targetId);
      if (targetModal) openModal(targetModal);
    });
  });

  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-container');
      if (modal) closeModal(modal);
    });
  });

  document.querySelectorAll('.modal-container').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (drawer && !drawer.classList.contains('translate-x-full')) closeDrawer(drawer);
      document.querySelectorAll('.modal-container:not(.hidden)').forEach(modal => closeModal(modal));
    }
  });
}

function openDrawer(drawer) {
  if (!drawer) return;
  drawer.classList.remove('translate-x-full', 'pointer-events-none');
  const overlay = document.getElementById('drawerBackdropOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

function closeDrawer(drawer) {
  if (!drawer) return;
  drawer.classList.add('translate-x-full', 'pointer-events-none');
  const overlay = document.getElementById('drawerBackdropOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
}

function populateDrawerData(orderId, client, device) {
  const drawerOrderId = document.getElementById('drawerOrderId');
  const drawerClient = document.getElementById('drawerClient');
  const drawerDevice = document.getElementById('drawerDevice');

  if (drawerOrderId) drawerOrderId.textContent = orderId;
  if (drawerClient) drawerClient.textContent = client;
  if (drawerDevice) drawerDevice.textContent = device;
}

/* ==========================================================================
   3. REAL-TIME LOCAL SEARCH & FILTERS
   ========================================================================== */
function initRealtimeFilters() {
  const orderSearch = document.getElementById('ordersFilterSearch');
  const orderStatus = document.getElementById('ordersStatusSelect');
  const ordersTableBody = document.querySelector('#ordersTableContent tbody');

  if (orderSearch && ordersTableBody) {
    orderSearch.addEventListener('input', applyOrdersFilter);
  }
  if (orderStatus && ordersTableBody) {
    orderStatus.addEventListener('change', applyOrdersFilter);
  }

  function applyOrdersFilter() {
    const query = (orderSearch ? orderSearch.value : '').toLowerCase().trim();
    const statusVal = (orderStatus ? orderStatus.value : 'all').toLowerCase();
    const rows = ordersTableBody.querySelectorAll('tr');

    let visibleCount = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const statusAttr = row.getAttribute('data-status') || '';
      
      const matchesSearch = text.includes(query);
      const matchesStatus = statusVal === 'all' || statusAttr.includes(statusVal);

      if (matchesSearch && matchesStatus) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const counter = document.getElementById('ordersCounterBadge');
    if (counter) counter.textContent = `${visibleCount} orden${visibleCount === 1 ? '' : 'es'}`;
  }

  // Inventory Table Filter
  const invSearch = document.querySelector('input[placeholder*="Filtrar por SKU"]');
  const invCategory = document.querySelector('select:has(option[value="storage"])');
  const invTableBody = document.querySelector('#inventoryTableContent tbody');

  if (invSearch && invTableBody) {
    invSearch.addEventListener('input', applyInventoryFilter);
  }
  if (invCategory && invTableBody) {
    invCategory.addEventListener('change', applyInventoryFilter);
  }

  function applyInventoryFilter() {
    const query = (invSearch ? invSearch.value : '').toLowerCase().trim();
    const catVal = (invCategory ? invCategory.value : 'all').toLowerCase();
    const rows = invTableBody.querySelectorAll('tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const catAttr = row.getAttribute('data-category') || '';
      
      const matchesSearch = text.includes(query);
      const matchesCat = catVal === 'all' || catAttr.includes(catVal);

      if (matchesSearch && matchesCat) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Clients Filter
  const clientSearch = document.querySelector('input[placeholder*="Filtrar por empresa"]');
  const clientTableBody = document.querySelector('#clientsTableContent tbody');

  if (clientSearch && clientTableBody) {
    clientSearch.addEventListener('input', () => {
      const query = clientSearch.value.toLowerCase().trim();
      const rows = clientTableBody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

/* ==========================================================================
   4. DYNAMIC FORM VALIDATION WITH BUTTON SPINNER
   ========================================================================== */
function initFormValidations() {
  const forms = document.querySelectorAll('form[data-validate="true"]');

  forms.forEach(form => {
    if (form.hasAttribute('data-auth-form')) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isValid = true;
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach(input => {
        clearInputError(input);

        // Required check
        if (input.hasAttribute('required') && !input.value.trim()) {
          showInputError(input, 'Este campo es requerido');
          isValid = false;
        } 
        // Email format check
        else if (input.type === 'email' && input.value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.value.trim())) {
            showInputError(input, 'Ingrese un correo válido (@empresa.com)');
            isValid = false;
          }
        }
        // Phone format check
        else if (input.type === 'tel' && input.value.trim()) {
          const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
          if (!phoneRegex.test(input.value.trim())) {
            showInputError(input, 'Formato telefónico inválido');
            isValid = false;
          }
        }
      });

      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]');
        let originalContent = '';
        if (submitBtn) {
          originalContent = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="btn-spinner mr-2"></span> <span>Procesando...</span>`;
        }

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
          }
          const successMessage = form.getAttribute('data-success-msg') || 'Datos procesados y guardados con éxito en IT seobiseu.';
          showToast(successMessage, 'success', 'Registro Completado');
          form.reset();

          const modal = form.closest('.modal-container');
          if (modal) closeModal(modal);
        }, 600);

      } else {
        showToast('Revise los campos marcados en rojo antes de continuar.', 'error', 'Error en el Formulario');
      }
    });

    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => clearInputError(input));
    });
  });
}

function showInputError(input, errorText) {
  input.classList.add('border-rose-500', 'bg-rose-500/10', 'focus:ring-rose-500/30');
  input.classList.remove('border-slate-800', 'focus:border-brand-cyan/60');

  let errorLabel = input.parentElement.querySelector('.field-error-msg');
  if (!errorLabel) {
    errorLabel = document.createElement('span');
    errorLabel.className = 'field-error-msg text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1';
    errorLabel.innerHTML = `<span class="material-symbols-outlined text-[13px]">error</span> ${errorText}`;
    input.parentElement.appendChild(errorLabel);
  } else {
    errorLabel.innerHTML = `<span class="material-symbols-outlined text-[13px]">error</span> ${errorText}`;
    errorLabel.classList.remove('hidden');
  }
}

function clearInputError(input) {
  input.classList.remove('border-rose-500', 'bg-rose-500/10', 'focus:ring-rose-500/30');
  input.classList.add('border-slate-800');

  const errorLabel = input.parentElement.querySelector('.field-error-msg');
  if (errorLabel) {
    errorLabel.remove();
  }
}

/* ==========================================================================
   5. SKELETON SHIMMERS CONTROLLER
   ========================================================================== */
function initSkeletonSimulators() {
  const refreshOrders = document.getElementById('btnRefreshOrders');
  const skeletonOrders = document.getElementById('ordersSkeletonLoader');
  const tableOrders = document.getElementById('ordersTableContent');

  if (refreshOrders && skeletonOrders && tableOrders) {
    refreshOrders.addEventListener('click', () => {
      triggerSkeleton(skeletonOrders, tableOrders, 650);
    });
  }

  const refreshClients = document.getElementById('btnRefreshClients');
  const skeletonClients = document.getElementById('clientsSkeletonLoader');
  const tableClients = document.getElementById('clientsTableContent');

  if (refreshClients && skeletonClients && tableClients) {
    refreshClients.addEventListener('click', () => {
      triggerSkeleton(skeletonClients, tableClients, 650);
    });
  }

  const refreshInventory = document.getElementById('btnRefreshInventory');
  const skeletonInventory = document.getElementById('inventorySkeletonLoader');
  const tableInventory = document.getElementById('inventoryTableContent');

  if (refreshInventory && skeletonInventory && tableInventory) {
    refreshInventory.addEventListener('click', () => {
      triggerSkeleton(skeletonInventory, tableInventory, 650);
    });
  }
}

function triggerSkeleton(skeletonEl, tableEl, duration = 600) {
  tableEl.classList.add('hidden');
  skeletonEl.classList.remove('hidden');
  
  setTimeout(() => {
    skeletonEl.classList.add('hidden');
    tableEl.classList.remove('hidden');
  }, duration);
}

/* ==========================================================================
   6. SIDEBAR & HEADER CONTROLLERS
   ========================================================================== */
function initSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  const mainContent = document.getElementById('mainContentWrapper');
  const header = document.getElementById('mainHeader');
  const brandFull = document.getElementById('brandLogoFull');
  const brandShort = document.getElementById('brandLogoShort');
  const navTextElements = document.querySelectorAll('.nav-label');
  const navBadges = document.querySelectorAll('.nav-badge');
  const telemetryWidget = document.getElementById('sidebarTelemetryWidget');
  const navSectionTitles = document.querySelectorAll('.nav-section-title');

  let isCollapsed = false;

  if (collapseBtn && sidebar) {
    collapseBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      toggleSidebarState(isCollapsed);
    });
  }

  function toggleSidebarState(collapsed) {
    if (collapsed) {
      sidebar.classList.remove('w-64');
      sidebar.classList.add('w-20');
      
      if (mainContent) {
        mainContent.classList.remove('pl-64');
        mainContent.classList.add('pl-20');
      }
      if (header) {
        header.classList.remove('left-64');
        header.classList.add('left-20');
      }
      if (brandFull) brandFull.classList.add('hidden');
      if (brandShort) brandShort.classList.remove('hidden');
      if (telemetryWidget) telemetryWidget.classList.add('hidden');

      navTextElements.forEach(el => el.classList.add('hidden'));
      navBadges.forEach(el => el.classList.add('hidden'));
      navSectionTitles.forEach(el => el.classList.add('hidden'));
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');

      if (mainContent) {
        mainContent.classList.remove('pl-20');
        mainContent.classList.add('pl-64');
      }
      if (header) {
        header.classList.remove('left-20');
        header.classList.add('left-64');
      }
      if (brandFull) brandFull.classList.remove('hidden');
      if (brandShort) brandShort.classList.add('hidden');
      if (telemetryWidget) telemetryWidget.classList.remove('hidden');

      navTextElements.forEach(el => el.classList.remove('hidden'));
      navBadges.forEach(el => el.classList.remove('hidden'));
      navSectionTitles.forEach(el => el.classList.remove('hidden'));
    }
  }
}

function initSearch() {
  const searchInputs = document.querySelectorAll('.global-search-input');
  const searchModal = document.getElementById('searchModal');
  const searchModalInput = document.getElementById('searchModalInput');
  const closeSearchModal = document.getElementById('closeSearchModal');

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openModal();
    }
    if (e.key === 'Escape' && searchModal && !searchModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  searchInputs.forEach(input => {
    input.addEventListener('click', () => {
      openModal();
    });
  });

  if (closeSearchModal) {
    closeSearchModal.addEventListener('click', closeModal);
  }

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        closeModal();
      }
    });
  }

  function openModal() {
    if (searchModal) {
      searchModal.classList.remove('hidden');
      if (searchModalInput) {
        setTimeout(() => searchModalInput.focus(), 50);
      }
    }
  }

  function closeModal() {
    if (searchModal) {
      searchModal.classList.add('hidden');
    }
  }
}

function initNotifications() {
  const notifBtn = document.getElementById('notifToggleBtn');
  const notifDropdown = document.getElementById('notifDropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      const userDropdown = document.getElementById('userMenuDropdown');
      if (userDropdown) userDropdown.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.add('hidden');
      }
    });
  }
}

function initUserDropdown() {
  const userBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userMenuDropdown');

  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifDropdown) notifDropdown.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
}

function initQuickStats() {
  const latencyBadge = document.getElementById('telemetryLatency');
  if (latencyBadge) {
    setInterval(() => {
      const randomLatency = Math.floor(Math.random() * 6) + 14;
      latencyBadge.textContent = `Latencia ${randomLatency}ms • SLA Alpha`;
    }, 4000);
  }
}
