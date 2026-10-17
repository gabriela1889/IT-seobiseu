/**
 * IT seobiseu - Core Application Controller
 * Handles Authentication Guards, Role Navigation, Dynamic Modals,
 * State Persistence, Real-time Filters, and CRUD Actions across all pages.
 */

import { AuthService, DEMO_ACCOUNTS } from './api.js';

/* ==========================================================================
   0. INITIALIZATION & ROUTING GUARD
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLoginPage = currentPage === 'login.html';

  // 1. Guard de Autenticación: si no está logueado y no está en login, redirigir
  if (!isLoginPage) {
    if (!AuthService.isAuthenticated() || !AuthService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
  }

  // 2. Inicializar componentes generales
  initTheme();
  initCurrentNavigation();
  initSidebar();
  initSearch();
  initNotifications();

  // 3. Inicializar Cabecera de Usuario y Menú de Cierre de Sesión / Cambio de Rol
  if (!isLoginPage) {
    initUserHeaderAndDropdown();
    applyRolePermissions();
  }

  // 4. Inicializar módulos según la página actual
  initSkeletonSimulators();
  initDrawersAndModals();
  initRealtimeFilters();
  initFormValidations();
  initQuickStats();

  // 5. Controladores específicos de cada vista
  if (currentPage.includes('inventario')) {
    initInventarioModule();
  } else if (currentPage.includes('ordenes')) {
    initOrdenesModule();
  } else if (currentPage.includes('tickets')) {
    initTicketsModule();
  } else if (currentPage.includes('clientes')) {
    initClientesModule();
  } else if (currentPage.includes('index') || currentPage === '') {
    initDashboardModule();
  }
});

/* ==========================================================================
   1. USER PROFILE, DROPDOWN & LOGOUT CONTROLLER
   ========================================================================== */
function initUserHeaderAndDropdown() {
  const currentUser = AuthService.getCurrentUser() || {
    nombre: 'Usuario',
    email: 'usuario@it-seobiseu.local',
    rol: 'ADMINISTRADOR',
    cargo: 'Operador IT',
    sede: 'Sede Central'
  };

  const userBtn = document.getElementById('userMenuBtn');
  if (!userBtn) return;

  // Actualizar datos visibles en el botón del Header
  const nameEl = userBtn.querySelector('.font-display');
  const roleEl = userBtn.querySelector('.font-mono');
  if (nameEl) nameEl.textContent = currentUser.nombre;
  if (roleEl) {
    roleEl.textContent = `${currentUser.cargo || currentUser.rol}`;
    roleEl.className = `text-[9px] font-mono mt-0.5 font-bold ${getRoleColorClass(currentUser.rol)}`;
  }

  // Comprobar si ya existe el dropdown en el DOM; si no, inyectarlo
  let userDropdown = document.getElementById('userMenuDropdown');
  if (!userDropdown) {
    userDropdown = document.createElement('div');
    userDropdown.id = 'userMenuDropdown';
    userDropdown.className = 'hidden absolute right-0 mt-3 w-72 sm:w-80 bg-[#1C2541]/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150';
    
    const initials = currentUser.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    
    userDropdown.innerHTML = `
      <div class="p-4 border-b border-slate-800 bg-[#0B132B]/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#48CAE4] flex items-center justify-center font-bold text-slate-900 font-mono text-sm shadow-md">
            ${initials}
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="font-display font-bold text-xs text-white truncate">${currentUser.nombre}</span>
            <span class="text-[10px] font-mono text-slate-400 truncate">${currentUser.email}</span>
            <div class="mt-1 flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-500/10 text-brand-cyan border border-sky-500/20">
                ${currentUser.rol}
              </span>
              <span class="text-[9px] font-mono text-slate-500 truncate">• ${currentUser.sede || 'Datacenter'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="p-3 border-b border-slate-800/80">
        <div class="flex items-center justify-between mb-2 px-1">
          <span class="text-[10px] font-mono uppercase text-slate-400 font-semibold">Cambiar de Rol (Demo):</span>
          <span class="text-[9px] font-mono text-brand-cyan">1-Click</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button type="button" data-switch-role="admin" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all">
            👑 <strong>Admin</strong>
          </button>
          <button type="button" data-switch-role="supervisor" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all">
            🛡️ <strong>Supervisor</strong>
          </button>
          <button type="button" data-switch-role="tecnico" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all">
            🔧 <strong>Técnico</strong>
          </button>
          <button type="button" data-switch-role="cliente" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all">
            👤 <strong>Cliente</strong>
          </button>
        </div>
      </div>

      <div class="p-2 space-y-1">
        <a href="index.html" class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs transition-colors">
          <span class="material-symbols-outlined text-[18px] text-brand-cyan">grid_view</span>
          <span>Dashboard Principal</span>
        </a>
        <button id="btnLogout" type="button" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 text-xs font-semibold transition-all">
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    `;

    userBtn.parentElement.appendChild(userDropdown);
  }

  // Toggle dropdown al hacer click en el botón de usuario
  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifDropdown) notifDropdown.classList.add('hidden');
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });

  // Botón de Cerrar Sesión
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showToast('Cerrando sesión del sistema...', 'info', 'Logout');
      setTimeout(() => {
        AuthService.logout();
      }, 400);
    });
  }

  // Botones de Cambio Rápido de Rol
  userDropdown.querySelectorAll('[data-switch-role]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const roleKey = btn.getAttribute('data-switch-role');
      const emailMap = {
        admin: 'admin@it-seobiseu.local',
        supervisor: 'supervisor@it-seobiseu.local',
        tecnico: 'tecnico@it-seobiseu.local',
        cliente: 'cliente@it-seobiseu.local',
      };
      const email = emailMap[roleKey];
      const account = DEMO_ACCOUNTS[email];
      if (account) {
        await AuthService.login(email, account.password);
        showToast(`Rol cambiado a ${account.user.rol}. Recargando...`, 'success', 'Cambio de Rol');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });
  });
}

function getRoleColorClass(rol) {
  switch ((rol || '').toUpperCase()) {
    case 'ADMINISTRADOR': return 'text-brand-cyan';
    case 'SUPERVISOR': return 'text-amber-400';
    case 'TECNICO': return 'text-emerald-400';
    case 'CLIENTE': return 'text-purple-400';
    default: return 'text-slate-400';
  }
}

function applyRolePermissions() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const role = (user.rol || '').toUpperCase();

  // Si el usuario es CLIENTE, deshabilitar acciones técnicas avanzadas
  if (role === 'CLIENTE') {
    // Deshabilitar botón de registrar repuesto en inventario
    const btnNewPart = document.querySelector('[data-modal-target="newPartModal"]');
    if (btnNewPart) {
      btnNewPart.classList.add('opacity-40', 'pointer-events-none');
      btnNewPart.setAttribute('title', 'Acción no permitida para el rol Cliente');
    }
    // Ocultar botones de ajuste de stock
    document.querySelectorAll('[data-modal-target="editPartModal"]').forEach(b => {
      b.style.display = 'none';
    });
  }
}

/* ==========================================================================
   2. TOAST NOTIFICATIONS
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
window.showToast = showToast;

/* ==========================================================================
   3. INVENTARIO MODULE (CRUD REAL, MODALES Y AJUSTES)
   ========================================================================== */
function initInventarioModule() {
  const tableBody = document.querySelector('#inventoryTableContent tbody');
  const modalNewPart = document.getElementById('newPartModal');
  const modalEditPart = document.getElementById('editPartModal');
  const formNewPart = modalNewPart ? modalNewPart.querySelector('form') : null;
  const formEditPart = modalEditPart ? modalEditPart.querySelector('form') : null;

  let currentSkuToEdit = null;

  // Registrar nuevo repuesto
  if (formNewPart) {
    formNewPart.addEventListener('submit', (e) => {
      e.preventDefault();
      const skuInput = formNewPart.querySelector('input[placeholder*="PSU"]');
      const nameInput = formNewPart.querySelector('input[placeholder*="Fuente"]');
      const qtyInput = formNewPart.querySelector('input[type="number"]');
      const priceInput = formNewPart.querySelector('input[placeholder*="185.00"]');
      const rackInput = formNewPart.querySelector('input[placeholder*="Rack"]');

      const sku = (skuInput ? skuInput.value.trim().toUpperCase() : '') || `SKU-${Date.now().toString().slice(-4)}`;
      const name = (nameInput ? nameInput.value.trim() : '') || 'Componente IT';
      const qty = parseInt(qtyInput ? qtyInput.value : '10', 10);
      const price = parseFloat(priceInput ? priceInput.value.replace('$', '') : '120.00');
      const rack = (rackInput ? rackInput.value.trim() : '') || 'Rack General / Gav. 01';

      // Insertar nueva fila en la tabla
      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in slide-in-from-top-2';
        newRow.setAttribute('data-category', 'storage');
        newRow.innerHTML = `
          <td class="py-3 px-4 font-mono font-bold text-brand-cyan">${sku}</td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-200">${name}</div>
            <div class="text-[11px] text-slate-400">Componente catalogado por inventario</div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">General</span>
          </td>
          <td class="py-3 px-4">
            <div class="space-y-1">
              <div class="flex justify-between text-[10px]">
                <span class="text-emerald-400 font-bold font-mono item-stock-label">${qty} u. (Óptimo)</span>
                <span class="text-slate-400 font-mono">Mín: 5</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 80%"></div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-slate-200">$${price.toFixed(2)}</td>
          <td class="py-3 px-4 font-mono text-slate-400 text-[11px]">${rack}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Abastecido</span>
          </td>
          <td class="py-3 px-4 text-right">
            <button data-modal-target="editPartModal" class="btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Ajustar Stock">
              <span class="material-symbols-outlined text-[15px]">tune</span>
            </button>
          </td>
        `;
        tableBody.prepend(newRow);
        bindEditButtons();
      }

      // Actualizar contador total SKU
      const totalSkuEl = document.querySelector('.font-display.text-sm.font-bold.text-white');
      if (totalSkuEl && !isNaN(parseInt(totalSkuEl.textContent))) {
        totalSkuEl.textContent = parseInt(totalSkuEl.textContent) + 1;
      }

      formNewPart.reset();
      if (modalNewPart) closeModal(modalNewPart);
      showToast(`Repuesto [${sku}] catalogado con éxito en el almacén.`, 'success', 'Inventario Actualizado');
    });
  }

  // Ajustar stock para cada repuesto
  function bindEditButtons() {
    document.querySelectorAll('[data-modal-target="editPartModal"]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const row = btn.closest('tr');
        if (row) {
          const skuCell = row.querySelector('.font-mono.font-bold');
          currentSkuToEdit = {
            sku: skuCell ? skuCell.textContent.trim() : '',
            row: row
          };
        }
        if (modalEditPart) openModal(modalEditPart);
      };
    });
  }
  bindEditButtons();

  if (formEditPart) {
    formEditPart.addEventListener('submit', (e) => {
      e.preventDefault();
      const qtyInput = formEditPart.querySelector('input[type="number"]');
      const diff = parseInt(qtyInput ? qtyInput.value : '0', 10);

      if (currentSkuToEdit && currentSkuToEdit.row) {
        const stockLabel = currentSkuToEdit.row.querySelector('.item-stock-label');
        if (stockLabel) {
          const currentQty = parseInt(stockLabel.textContent) || 5;
          const nextQty = Math.max(0, currentQty + diff);
          const isCritical = nextQty <= 2;
          const isLow = nextQty > 2 && nextQty <= 5;
          
          stockLabel.textContent = `${nextQty} u. (${isCritical ? 'Crítico' : isLow ? 'Bajo' : 'Óptimo'})`;
          stockLabel.className = `font-bold font-mono item-stock-label ${isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`;
        }
      }

      if (modalEditPart) closeModal(modalEditPart);
      formEditPart.reset();
      showToast(`Stock de [${currentSkuToEdit ? currentSkuToEdit.sku : 'SKU'}] actualizado con éxito (${diff >= 0 ? '+' : ''}${diff} u.).`, 'success', 'Ajuste de Stock');
    });
  }
}

/* ==========================================================================
   4. ÓRDENES DE TRABAJO MODULE (CRUD, DRAWER & FIRMA SLA)
   ========================================================================== */
function initOrdenesModule() {
  const tableBody = document.querySelector('#ordersTableContent tbody');
  const modalNewOrder = document.getElementById('newOrderModal');
  const formNewOrder = modalNewOrder ? modalNewOrder.querySelector('form') : null;
  const drawer = document.getElementById('techDetailDrawer');

  if (formNewOrder) {
    formNewOrder.addEventListener('submit', (e) => {
      e.preventDefault();
      const clientInput = formNewOrder.querySelector('input[placeholder*="Banco Santander"]');
      const deviceInput = formNewOrder.querySelector('input[placeholder*="Servidor Dell"]');
      const prioritySelect = formNewOrder.querySelector('select');
      const diagInput = formNewOrder.querySelector('textarea');

      const client = (clientInput ? clientInput.value.trim() : '') || 'Cliente Corporativo';
      const device = (deviceInput ? deviceInput.value.trim() : '') || 'Servidor Rack 2U';
      const priority = prioritySelect ? prioritySelect.value : 'p1';
      const diag = (diagInput ? diagInput.value.trim() : '') || 'Diagnóstico de hardware preliminar';
      const orderId = `#OT-2024-${Math.floor(Math.random() * 800 + 100)}`;

      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in slide-in-from-top-2';
        newRow.setAttribute('data-status', 'pending');
        newRow.innerHTML = `
          <td class="py-3 px-4 font-mono font-bold text-brand-cyan">${orderId}</td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-200">${client}</div>
            <div class="text-[11px] text-slate-400">${device}</div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${priority === 'p1' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'} font-semibold">
              ${priority === 'p1' ? 'Crítica (P1)' : 'Alta (P2)'}
            </span>
          </td>
          <td class="py-3 px-4 text-slate-300">Téc. Marco Silva</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>1h 45m SLA</span>
            </div>
          </td>
          <td class="py-3 px-4 text-right">
            <button class="btn-open-drawer btn-pro inline-block p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" data-order-id="${orderId}" data-client="${client}" data-device="${device}">
              <span class="material-symbols-outlined text-[15px]">visibility</span>
            </button>
          </td>
        `;
        tableBody.prepend(newRow);
        initDrawersAndModals(); // Rebind drawer triggers
      }

      formNewOrder.reset();
      if (modalNewOrder) closeModal(modalNewOrder);
      showToast(`Órden de trabajo ${orderId} generada y asignada.`, 'success', 'Órden Creada');
    });
  }
}

/* ==========================================================================
   5. TICKETS MODULE
   ========================================================================== */
function initTicketsModule() {
  const formTicket = document.querySelector('form[data-validate="true"]');
  if (formTicket) {
    formTicket.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticketId = `#TK-${Math.floor(Math.random() * 8000 + 1000)}`;
      showToast(`Ticket ${ticketId} registrado con éxito. Técnico asignado según SLA.`, 'success', 'Ticket Generado');
      formTicket.reset();
    });
  }
}

/* ==========================================================================
   6. CLIENTES MODULE
   ========================================================================== */
function initClientesModule() {
  const modalNewClient = document.getElementById('newClientModal');
  const formNewClient = modalNewClient ? modalNewClient.querySelector('form') : null;
  const tableBody = document.querySelector('#clientsTableContent tbody');

  if (formNewClient) {
    formNewClient.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = formNewClient.querySelector('input[placeholder*="Empresa"]') || formNewClient.querySelector('input');
      const clientName = nameInput ? nameInput.value.trim() : 'Nueva Empresa VIP';

      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in slide-in-from-top-2';
        newRow.innerHTML = `
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-cyan flex items-center justify-center font-display font-bold text-xs">
                ${clientName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div class="font-semibold text-slate-200">${clientName}</div>
                <div class="text-[10px] font-mono text-slate-400">RUC: 2060${Math.floor(Math.random() * 8000000 + 1000000)}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-300">Sede Principal • Datacenter Local</td>
          <td class="py-3 px-4 font-mono text-slate-300">12 Servidores</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Platinum SLA</span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
          </td>
          <td class="py-3 px-4 text-right">
            <button class="btn-pro inline-block p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all">
              <span class="material-symbols-outlined text-[15px]">more_vert</span>
            </button>
          </td>
        `;
        tableBody.prepend(newRow);
      }

      formNewClient.reset();
      if (modalNewClient) closeModal(modalNewClient);
      showToast(`Cliente [${clientName}] dado de alta en la plataforma.`, 'success', 'Cliente Registrado');
    });
  }
}

/* ==========================================================================
   7. DASHBOARD MODULE
   ========================================================================== */
function initDashboardModule() {
  const exportBtn = document.querySelector('button:has(.material-symbols-outlined:contains("file_download"))');
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Exportar Informe')) {
      btn.onclick = () => {
        showToast('Generando informe ejecutivo en PDF/Excel...', 'info', 'Descarga Iniciada');
        setTimeout(() => {
          showToast('Informe descargado: IT_Seobiseu_Resumen_Operativo.pdf', 'success', 'Exportación Lista');
        }, 800);
      };
    } else if (btn.textContent.includes('Filtrar por Turno')) {
      btn.onclick = () => {
        showToast('Filtro aplicado: Turno Actual (NOC Central 24/7)', 'info', 'Filtro de Turno');
      };
    }
  });
}

/* ==========================================================================
   8. COMMON COMPONENTS (THEME, NAV, DRAWERS, SEARCH, SKELETON)
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

  updateThemeButton();
}

function initCurrentNavigation() {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('#mainSidebar nav a[href]').forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop().toLowerCase();
    if (linkPage === currentPage) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function initDrawersAndModals() {
  const drawer = document.getElementById('techDetailDrawer');
  const openDrawerBtns = document.querySelectorAll('.btn-open-drawer');
  const closeDrawerBtns = document.querySelectorAll('.btn-close-drawer');

  openDrawerBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const orderId = btn.getAttribute('data-order-id') || '#OT-2045';
      const client = btn.getAttribute('data-client') || 'Banco Santander';
      const device = btn.getAttribute('data-device') || 'Dell PowerEdge R750 (2U)';
      
      const drawerOrderId = document.getElementById('drawerOrderId');
      const drawerClient = document.getElementById('drawerClient');
      const drawerDevice = document.getElementById('drawerDevice');

      if (drawerOrderId) drawerOrderId.textContent = orderId;
      if (drawerClient) drawerClient.textContent = client;
      if (drawerDevice) drawerDevice.textContent = device;

      openDrawer(drawer);
    };
  });

  closeDrawerBtns.forEach(btn => {
    btn.onclick = () => closeDrawer(drawer);
  });

  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  const modalCloseBtns = document.querySelectorAll('[data-modal-close]');

  modalTriggers.forEach(trigger => {
    trigger.onclick = () => {
      const targetId = trigger.getAttribute('data-modal-target');
      const targetModal = document.getElementById(targetId);
      if (targetModal) openModal(targetModal);
    };
  });

  modalCloseBtns.forEach(btn => {
    btn.onclick = () => {
      const modal = btn.closest('.modal-container');
      if (modal) closeModal(modal);
    };
  });

  document.querySelectorAll('.modal-container').forEach(modal => {
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(modal);
    };
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
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modal) {
  if (modal) modal.classList.add('hidden');
}

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

  // Filtro de Inventario
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

      row.style.display = (matchesSearch && matchesCat) ? '' : 'none';
    });
  }

  // Filtro de Clientes
  const clientSearch = document.querySelector('input[placeholder*="Filtrar por empresa"]');
  const clientTableBody = document.querySelector('#clientsTableContent tbody');

  if (clientSearch && clientTableBody) {
    clientSearch.addEventListener('input', () => {
      const query = clientSearch.value.toLowerCase().trim();
      const rows = clientTableBody.querySelectorAll('tr');
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    });
  }
}

function initFormValidations() {
  const forms = document.querySelectorAll('form[data-validate="true"]');
  forms.forEach(form => {
    if (form.hasAttribute('data-auth-form')) return;
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('border-rose-500', 'bg-rose-500/10');
      });
    });
  });
}

function initSkeletonSimulators() {
  const refreshBtns = [
    { btn: 'btnRefreshOrders', skeleton: 'ordersSkeletonLoader', content: 'ordersTableContent' },
    { btn: 'btnRefreshClients', skeleton: 'clientsSkeletonLoader', content: 'clientsTableContent' },
    { btn: 'btnRefreshInventory', skeleton: 'inventorySkeletonLoader', content: 'inventoryTableContent' }
  ];

  refreshBtns.forEach(({ btn, skeleton, content }) => {
    const btnEl = document.getElementById(btn);
    const skEl = document.getElementById(skeleton);
    const ctEl = document.getElementById(content);

    if (btnEl && skEl && ctEl) {
      btnEl.onclick = () => {
        ctEl.classList.add('hidden');
        skEl.classList.remove('hidden');
        setTimeout(() => {
          skEl.classList.add('hidden');
          ctEl.classList.remove('hidden');
          showToast('Datos sincronizados en tiempo real.', 'info', 'Actualizado');
        }, 500);
      };
    }
  });
}

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
    collapseBtn.onclick = () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        if (mainContent) { mainContent.classList.remove('pl-64'); mainContent.classList.add('pl-20'); }
        if (header) { header.classList.remove('left-64'); header.classList.add('left-20'); }
        if (brandFull) brandFull.classList.add('hidden');
        if (brandShort) brandShort.classList.remove('hidden');
        if (telemetryWidget) telemetryWidget.classList.add('hidden');
        navTextElements.forEach(el => el.classList.add('hidden'));
        navBadges.forEach(el => el.classList.add('hidden'));
        navSectionTitles.forEach(el => el.classList.add('hidden'));
      } else {
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        if (mainContent) { mainContent.classList.remove('pl-20'); mainContent.classList.add('pl-64'); }
        if (header) { header.classList.remove('left-20'); header.classList.add('left-64'); }
        if (brandFull) brandFull.classList.remove('hidden');
        if (brandShort) brandShort.classList.add('hidden');
        if (telemetryWidget) telemetryWidget.classList.remove('hidden');
        navTextElements.forEach(el => el.classList.remove('hidden'));
        navBadges.forEach(el => el.classList.remove('hidden'));
        navSectionTitles.forEach(el => el.classList.remove('hidden'));
      }
    };
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
      openModal(searchModal);
      if (searchModalInput) setTimeout(() => searchModalInput.focus(), 50);
    }
  });

  searchInputs.forEach(input => {
    input.onclick = () => {
      openModal(searchModal);
      if (searchModalInput) setTimeout(() => searchModalInput.focus(), 50);
    };
  });

  if (closeSearchModal && searchModal) {
    closeSearchModal.onclick = () => closeModal(searchModal);
  }
}

function initNotifications() {
  const notifBtn = document.getElementById('notifToggleBtn');
  const notifDropdown = document.getElementById('notifDropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.onclick = (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      const userDropdown = document.getElementById('userMenuDropdown');
      if (userDropdown) userDropdown.classList.add('hidden');
    };

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.add('hidden');
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
