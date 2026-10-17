/**
 * IT seobiseu — Core Application Engine (Colombia Enterprise Edition)
 * Gestor de Autenticación, Roles, Control de Acceso por Módulo,
 * Modales Universales, Notificaciones Globales y Operaciones CRUD en Tiempo Real.
 */

import { AuthService, DEMO_ACCOUNTS } from './api.js';

/* ==========================================================================
   0. CONFIGURACIÓN Y CONTROL DE ACCESO POR ROL
   ========================================================================== */
const ROLE_PERMISSIONS = {
  ADMINISTRADOR: {
    label: 'Administrador General',
    colorClass: 'text-brand-cyan',
    allowedPages: ['index.html', 'ordenes.html', 'inventario.html', 'tickets.html', 'clientes.html'],
    allowedModules: ['dashboard', 'ordenes', 'inventario', 'tickets', 'clientes', 'ajustes']
  },
  SUPERVISOR: {
    label: 'Supervisor de Operaciones NOC',
    colorClass: 'text-amber-400',
    allowedPages: ['index.html', 'ordenes.html', 'inventario.html', 'tickets.html', 'clientes.html'],
    allowedModules: ['dashboard', 'ordenes', 'inventario', 'tickets', 'clientes']
  },
  TECNICO: {
    label: 'Técnico Especialista de Campo',
    colorClass: 'text-emerald-400',
    allowedPages: ['index.html', 'ordenes.html', 'inventario.html', 'tickets.html'],
    allowedModules: ['dashboard', 'ordenes', 'inventario', 'tickets']
  },
  CLIENTE: {
    label: 'Cliente Corporativo VIP',
    colorClass: 'text-purple-400',
    allowedPages: ['index.html', 'ordenes.html', 'tickets.html'],
    allowedModules: ['dashboard', 'ordenes', 'tickets']
  }
};

let currentActiveDrawerOrder = null;
let currentActiveEditOrder = null;
let currentSkuToEdit = null;

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLoginPage = currentPage === 'login.html';

  // 1. Guard de Autenticación
  if (!isLoginPage) {
    if (!AuthService.isAuthenticated() || !AuthService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }

    // 2. Control de Acceso por Rol (Redirección si no tiene permiso para la página)
    const currentUser = AuthService.getCurrentUser();
    const userRole = (currentUser.rol || 'ADMINISTRADOR').toUpperCase();
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.ADMINISTRADOR;

    if (!permissions.allowedPages.includes(currentPage)) {
      showToast(`El perfil [${currentUser.rol}] no tiene acceso al módulo solicitado. Redirigiendo...`, 'error', 'Acceso Restringido');
      setTimeout(() => {
        window.location.href = userRole === 'CLIENTE' ? 'tickets.html' : 'ordenes.html';
      }, 700);
      return;
    }
  }

  // 3. Inicializar Componentes Globales
  initTheme();
  initCurrentNavigation();
  initSidebar();
  initSearch();
  initNotifications();
  initUniversalModalsAndDrawers();
  initFormValidations();
  initRealtimeFilters();
  initSkeletonSimulators();
  initQuickStats();

  // 4. Adaptar Menú Lateral y Perfil según el Rol
  if (!isLoginPage) {
    initUserHeaderAndDropdown();
    adaptSidebarAndModulesByRole();
  }

  // 5. Inicializar Controladores de Página Específica
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
   1. PERFIL DE USUARIO, MENÚ DESPLEGABLE Y CIERRE DE SESIÓN
   ========================================================================== */
function initUserHeaderAndDropdown() {
  const currentUser = AuthService.getCurrentUser() || {
    nombre: 'Carlos Mendoza',
    email: 'admin@it-seobiseu.local',
    rol: 'ADMINISTRADOR',
    cargo: 'SuperAdmin IT',
    sede: 'Bogotá • Datacenter Zona Franca'
  };

  const userBtn = document.getElementById('userMenuBtn');
  if (!userBtn) return;

  const initials = currentUser.nombre
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Eliminar cualquier <img> de avatar y colocar iniciales limpias con gradiente
  const existingImg = userBtn.querySelector('img');
  let avatarBadge = userBtn.querySelector('.user-avatar-badge');
  if (existingImg) existingImg.remove();

  if (!avatarBadge) {
    avatarBadge = document.createElement('div');
    avatarBadge.className = 'user-avatar-badge w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#48CAE4] flex items-center justify-center font-bold text-slate-900 font-mono text-[11px] shadow-sm shrink-0';
    userBtn.prepend(avatarBadge);
  }
  avatarBadge.textContent = initials;

  // Actualizar textos visibles en Header
  const nameEl = userBtn.querySelector('.font-display');
  const roleEl = userBtn.querySelector('.font-mono');
  if (nameEl) nameEl.textContent = currentUser.nombre;
  if (roleEl) {
    roleEl.textContent = currentUser.cargo || currentUser.rol;
    const perm = ROLE_PERMISSIONS[currentUser.rol] || ROLE_PERMISSIONS.ADMINISTRADOR;
    roleEl.className = `text-[9px] font-mono mt-0.5 font-bold ${perm.colorClass}`;
  }

  // Inyectar o actualizar menú de usuario
  let userDropdown = document.getElementById('userMenuDropdown');
  if (!userDropdown) {
    userDropdown = document.createElement('div');
    userDropdown.id = 'userMenuDropdown';
    userDropdown.className = 'hidden absolute right-0 mt-3 w-72 sm:w-80 bg-[#1C2541]/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150';
    
    userDropdown.innerHTML = `
      <div class="p-4 border-b border-slate-800 bg-[#0B132B]/85">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#48CAE4] flex items-center justify-center font-bold text-slate-900 font-mono text-sm shadow-md">
            ${initials}
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="font-display font-bold text-xs text-white truncate">${currentUser.nombre}</span>
            <span class="text-[10px] font-mono text-slate-400 truncate">${currentUser.email}</span>
            <div class="mt-1 flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-500/15 text-brand-cyan border border-sky-500/30">
                ${currentUser.rol}
              </span>
              <span class="text-[9px] font-mono text-slate-400 truncate">• Colombia</span>
            </div>
          </div>
        </div>
        <div class="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <span class="material-symbols-outlined text-[13px] text-brand-cyan">location_on</span>
          <span class="truncate">${currentUser.sede || 'Sede Central Bogotá'}</span>
        </div>
      </div>

      <div class="p-3 border-b border-slate-800/80">
        <div class="flex items-center justify-between mb-2 px-1">
          <span class="text-[10px] font-mono uppercase text-slate-400 font-semibold">Cambiar de Perfil (Demo Colombia):</span>
          <span class="text-[9px] font-mono text-brand-cyan">1-Click</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button type="button" data-switch-role="admin" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1">
            <span>👑</span> <span>Admin</span>
          </button>
          <button type="button" data-switch-role="supervisor" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1">
            <span>🛡️</span> <span>Supervisor</span>
          </button>
          <button type="button" data-switch-role="tecnico" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1">
            <span>🔧</span> <span>Técnico</span>
          </button>
          <button type="button" data-switch-role="cliente" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1">
            <span>👤</span> <span>Cliente</span>
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

  // Abrir / Cerrar dropdown
  userBtn.onclick = (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifDropdown) notifDropdown.classList.add('hidden');
  };

  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });

  // Cerrar Sesión
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      showToast('Cerrando sesión de IT seobiseu...', 'info', 'Sesión Terminada');
      setTimeout(() => AuthService.logout(), 400);
    };
  }

  // Botones de Cambio Rápido de Rol
  userDropdown.querySelectorAll('[data-switch-role]').forEach((btn) => {
    btn.onclick = async (e) => {
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
        showToast(`Cambiando a perfil: ${account.user.rol}. Cargando permisos...`, 'success', 'Rol Actualizado');
        setTimeout(() => {
          // Si es cliente y está en inventario/clientes, enviarlo a tickets
          if (roleKey === 'cliente') {
            window.location.href = 'tickets.html';
          } else {
            window.location.reload();
          }
        }, 500);
      }
    };
  });
}

/* ==========================================================================
   2. ADAPTACIÓN DEL SIDEBAR Y MÓDULOS SEGÚN ROL
   ========================================================================== */
function adaptSidebarAndModulesByRole() {
  const currentUser = AuthService.getCurrentUser();
  if (!currentUser) return;

  const role = (currentUser.rol || 'ADMINISTRADOR').toUpperCase();
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ADMINISTRADOR;

  // Ocultar / Mostrar enlaces del Sidebar según permisos
  document.querySelectorAll('#mainSidebar nav a[href]').forEach((link) => {
    const href = link.getAttribute('href').toLowerCase();
    
    const isInventario = href.includes('inventario');
    const isClientes = href.includes('clientes');
    const isAjustes = href.includes('#') || link.textContent.includes('Ajustes');
    const isOrdenes = href.includes('ordenes');
    const isTickets = href.includes('tickets');

    if (role === 'CLIENTE') {
      // Clientes no ven Inventario, ni Directorio de otros clientes, ni Ajustes
      if (isInventario || isClientes || isAjustes) {
        link.style.display = 'none';
      }
      if (isOrdenes) {
        const label = link.querySelector('.nav-label');
        if (label) label.textContent = 'Mis Órdenes de Servicio';
      }
      if (isTickets) {
        const label = link.querySelector('.nav-label');
        if (label) label.textContent = 'Solicitar Soporte / Tickets';
      }
    } else if (role === 'TECNICO') {
      // Técnicos no ven Clientes ni Ajustes globales
      if (isClientes || isAjustes) {
        link.style.display = 'none';
      }
    } else if (role === 'SUPERVISOR') {
      // Supervisores ven todo excepto Ajustes de superadmin
      if (isAjustes) {
        link.style.display = 'none';
      }
    }
  });

  // Si es CLIENTE, deshabilitar acciones de administración técnica en las vistas
  if (role === 'CLIENTE') {
    document.querySelectorAll('[data-modal-target="newPartModal"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('[data-modal-target="newClientModal"]').forEach(el => el.style.display = 'none');
  }
}

/* ==========================================================================
   3. NOTIFICACIONES GLOBALES (COLOMBIA)
   ========================================================================== */
function initNotifications() {
  const notifBtn = document.getElementById('notifToggleBtn');
  if (!notifBtn) return;

  let notifDropdown = document.getElementById('notifDropdown');

  // Si el archivo HTML no tiene el dropdown de notificaciones, inyectarlo dinámicamente
  if (!notifDropdown) {
    notifDropdown = document.createElement('div');
    notifDropdown.id = 'notifDropdown';
    notifDropdown.className = 'hidden absolute right-0 mt-3 w-80 sm:w-96 bg-[#1C2541]/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150';

    notifDropdown.innerHTML = `
      <div class="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0B132B]/80">
        <div class="flex items-center gap-2">
          <span class="font-display font-bold text-xs text-slate-100">Centro de Telemetría • Colombia</span>
          <span class="px-1.5 py-0.2 text-[9px] font-mono rounded-full bg-sky-500/20 text-sky-300 font-semibold notif-count-badge">3 Nuevas</span>
        </div>
        <button id="btnMarkNotifsRead" class="text-[11px] text-brand-cyan hover:underline">Marcar leídas</button>
      </div>
      
      <div class="divide-y divide-slate-800/70 max-h-80 overflow-y-auto text-xs">
        <div class="p-3 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer">
          <div class="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">crisis_alert</span>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-slate-200">Stock Crítico: Memoria RAM Servidor</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Datacenter Tocancipá • Restan 2 unidades en Rack B-04.</span>
            <span class="text-[9px] font-mono text-slate-500 mt-1">Hace 5 min • Alerta Almacén</span>
          </div>
        </div>

        <div class="p-3 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">verified</span>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-slate-200">Entrega SLA Cumplida: Bancolombia</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Mantenimiento de Servidor Dell R740 finalizado en tiempo récord.</span>
            <span class="text-[9px] font-mono text-slate-500 mt-1">Hace 25 min • SLA 99.98% OK</span>
          </div>
        </div>

        <div class="p-3 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer">
          <div class="w-7 h-7 rounded-lg bg-sky-500/20 text-brand-cyan flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">router</span>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-slate-200">Enlace Fibra Óptica Bogotá - Medellín</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Ecopetrol reporta latencia nominal de 8.4 ms entre datacenters.</span>
            <span class="text-[9px] font-mono text-slate-500 mt-1">Hace 1 hora • NOC Redes</span>
          </div>
        </div>
      </div>
    `;

    notifBtn.parentElement.appendChild(notifDropdown);
  }

  // Toggle de Notificaciones
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

  const btnMarkRead = document.getElementById('btnMarkNotifsRead');
  if (btnMarkRead) {
    btnMarkRead.onclick = () => {
      const pingDot = notifBtn.querySelector('.animate-ping');
      if (pingDot) pingDot.parentElement.remove();
      const countBadge = notifDropdown.querySelector('.notif-count-badge');
      if (countBadge) countBadge.textContent = '0 Nuevas';
      showToast('Todas las alertas marcadas como leídas.', 'info', 'Notificaciones');
    };
  }
}

/* ==========================================================================
   4. GESTIÓN UNIVERSAL DE MODALES Y DRAWERS (DELEGACIÓN GLOBAL)
   ========================================================================== */
function initUniversalModalsAndDrawers() {
  // Asegurar overlay global para drawers
  let overlay = document.getElementById('drawerBackdropOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'drawerBackdropOverlay';
    overlay.className = 'hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300';
    document.body.appendChild(overlay);
  }

  // Delegación de click universal para cualquier botón que abra o cierre modales
  document.addEventListener('click', (e) => {
    // 1. Abrir Modal
    const openTrigger = e.target.closest('[data-modal-target]');
    if (openTrigger) {
      e.preventDefault();
      const targetId = openTrigger.getAttribute('data-modal-target');
      const targetModal = document.getElementById(targetId);
      if (targetModal) {
        targetModal.classList.remove('hidden');

        // Si es editar orden, capturar la fila y el ID
        if (targetId === 'editOrderModal') {
          const row = openTrigger.closest('tr');
          const orderId = openTrigger.getAttribute('data-order-id') || (row ? row.querySelector('.font-mono.font-bold').textContent.trim() : '#OT-2045');
          currentActiveEditOrder = { orderId, row };
        }
      }
      return;
    }

    // 2. Cerrar Modal
    const closeTrigger = e.target.closest('[data-modal-close]');
    if (closeTrigger) {
      e.preventDefault();
      const modal = closeTrigger.closest('.modal-container');
      if (modal) modal.classList.add('hidden');
      return;
    }

    // 3. Abrir Drawer de Detalle de Orden
    const drawerTrigger = e.target.closest('.btn-open-drawer');
    if (drawerTrigger) {
      e.preventDefault();
      const row = drawerTrigger.closest('tr');
      const orderId = drawerTrigger.getAttribute('data-order-id') || (row ? row.querySelector('.font-mono.font-bold').textContent.trim() : '#OT-2045');
      const client = drawerTrigger.getAttribute('data-client') || (row ? row.children[1].querySelector('.font-semibold').textContent.trim() : 'Bancolombia S.A.');
      const device = drawerTrigger.getAttribute('data-device') || (row ? row.children[1].children[1].textContent.trim() : 'Servidor Dell PowerEdge R740');
      const diag = drawerTrigger.getAttribute('data-diag') || 'Falla en componente redundante. Técnico asignado en datacenter.';

      populateAndOpenDrawer(orderId, client, device, diag, row);
      return;
    }

    // 4. Cerrar Drawer
    const closeDrawerTrigger = e.target.closest('.btn-close-drawer');
    if (closeDrawerTrigger) {
      e.preventDefault();
      closeDrawer();
      return;
    }

    // 5. Click en Backdrop del Drawer
    if (e.target === overlay) {
      closeDrawer();
      return;
    }

    // 6. Click fuera del contenedor de modal (backdrop)
    if (e.target.classList.contains('modal-container')) {
      e.target.classList.add('hidden');
    }
  });

  // Tecla Escape cierra todo
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      document.querySelectorAll('.modal-container:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });

  // Botón "Firmar Entrega SLA"
  const btnSignSla = document.getElementById('btnSignSla');
  if (btnSignSla) {
    btnSignSla.onclick = () => {
      if (!currentActiveDrawerOrder) return;

      const { orderId, row } = currentActiveDrawerOrder;

      // Actualizar estado en el Drawer
      const percBadge = document.getElementById('drawerPercBadge');
      if (percBadge) {
        percBadge.className = 'px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold';
        percBadge.textContent = 'Completado / SLA Cumplido';
      }

      // Agregar registro a la bitácora técnica
      const logsList = document.getElementById('drawerLogsList');
      if (logsList) {
        const logEntry = document.createElement('div');
        logEntry.className = 'p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2 animate-in fade-in';
        logEntry.innerHTML = `
          <span class="material-symbols-outlined text-emerald-400 text-[16px] mt-0.5">verified</span>
          <div>
            <p class="text-slate-200 text-[11px] font-semibold">Acta de entrega y certificación SLA firmada digitalmente.</p>
            <span class="text-[9px] font-mono text-emerald-400">Ahora mismo • Aprobado por Mesa de Ayuda</span>
          </div>
        `;
        logsList.prepend(logEntry);
      }

      // Actualizar la fila en la tabla de la página
      if (row) {
        const statusBadge = row.querySelector('[class*="bg-rose-500"], [class*="bg-amber-500"], [class*="bg-sky-500"]');
        if (statusBadge) {
          statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold';
          statusBadge.textContent = 'Completado / SLA Cumplido';
        }
        const timeCell = row.querySelector('.text-amber-400');
        if (timeCell) {
          timeCell.className = 'flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]';
          timeCell.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>SLA Certificado OK</span>';
        }
      }

      showToast(`Orden ${orderId} cerrada. Acta de entrega SLA generada y notificada al cliente.`, 'success', 'Certificación SLA');
      setTimeout(() => closeDrawer(), 600);
    };
  }
}

function populateAndOpenDrawer(orderId, client, device, diag, row) {
  const drawer = document.getElementById('techDetailDrawer');
  const overlay = document.getElementById('drawerBackdropOverlay');
  if (!drawer) return;

  currentActiveDrawerOrder = { orderId, client, device, diag, row };

  const drawerOrderId = document.getElementById('drawerOrderId');
  const drawerClient = document.getElementById('drawerClient');
  const drawerDevice = document.getElementById('drawerDevice');
  const drawerDiagText = document.getElementById('drawerDiagText');

  if (drawerOrderId) drawerOrderId.textContent = orderId;
  if (drawerClient) drawerClient.textContent = client;
  if (drawerDevice) drawerDevice.textContent = device;
  if (drawerDiagText && diag) drawerDiagText.textContent = diag;

  drawer.classList.remove('translate-x-full', 'pointer-events-none');
  if (overlay) overlay.classList.remove('hidden');
}

function closeDrawer() {
  const drawer = document.getElementById('techDetailDrawer');
  const overlay = document.getElementById('drawerBackdropOverlay');
  if (drawer) drawer.classList.add('translate-x-full', 'pointer-events-none');
  if (overlay) overlay.classList.add('hidden');
}

/* ==========================================================================
   5. MÓDULO DASHBOARD PRINCIPAL
   ========================================================================== */
function initDashboardModule() {
  // Manejo de formulario Nueva Orden Express desde el Dashboard
  const modalNewOrder = document.getElementById('newOrderModal');
  const formNewOrder = modalNewOrder ? modalNewOrder.querySelector('form') : null;
  const tableBody = document.querySelector('tbody');

  if (formNewOrder) {
    formNewOrder.onsubmit = (e) => {
      e.preventDefault();
      const client = formNewOrder.querySelector('input[placeholder*="Bancolombia"]').value.trim() || 'Cliente Corporativo Colombia';
      const device = formNewOrder.querySelector('input[placeholder*="Dell"]').value.trim() || 'Servidor Rack 2U';
      const diag = formNewOrder.querySelector('textarea').value.trim() || 'Diagnóstico preliminar de hardware.';
      const priority = formNewOrder.querySelector('select').value;
      const orderId = `#OT-2024-${Math.floor(Math.random() * 800 + 2060)}`;

      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in slide-in-from-top-2';
        newRow.setAttribute('data-status', priority);
        newRow.innerHTML = `
          <td class="py-3 px-3 font-mono font-bold text-brand-cyan">${orderId}</td>
          <td class="py-3 px-3">
            <div class="font-semibold text-slate-200">${client} — ${device}</div>
            <div class="text-[11px] text-slate-400">${diag}</div>
          </td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${priority === 'p1' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'} font-semibold">
              ${priority === 'p1' ? 'Crítica (P1)' : 'Alta (P2)'}
            </span>
          </td>
          <td class="py-3 px-3 text-slate-300 font-medium">Téc. Marco Silva</td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>1h 55m SLA</span>
            </div>
          </td>
          <td class="py-3 px-3 text-right">
            <div class="inline-flex items-center gap-1">
              <button 
                class="btn-open-drawer btn-pro px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-brand-cyan border border-sky-500/30 transition-colors flex items-center gap-1 font-semibold text-[11px]" 
                data-order-id="${orderId}"
                data-client="${client}"
                data-device="${device}"
                data-diag="${diag}"
                title="Ver Detalle de Incidente"
              >
                <span class="material-symbols-outlined text-[15px]">visibility</span>
                <span>Detalle</span>
              </button>
              <button data-modal-target="editOrderModal" data-order-id="${orderId}" class="btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar orden">
                <span class="material-symbols-outlined text-[15px]">edit</span>
              </button>
            </div>
          </td>
        `;
        tableBody.prepend(newRow);
      }

      formNewOrder.reset();
      modalNewOrder.classList.add('hidden');
      showToast(`Órden express ${orderId} asignada a técnico de guardia en Bogotá.`, 'success', 'Órden Creada');
    };
  }

  // Manejo de formulario Editar Orden desde el Dashboard
  const modalEditOrder = document.getElementById('editOrderModal');
  const formEditOrder = modalEditOrder ? modalEditOrder.querySelector('form') : null;
  if (formEditOrder) {
    formEditOrder.onsubmit = (e) => {
      e.preventDefault();
      const statusSelect = document.getElementById('editOrderStatusSelect');
      const statusVal = statusSelect ? statusSelect.value : 'completado';

      if (currentActiveEditOrder && currentActiveEditOrder.row) {
        const badge = currentActiveEditOrder.row.querySelector('[class*="bg-rose-500"], [class*="bg-amber-500"], [class*="bg-sky-500"]');
        if (badge) {
          if (statusVal === 'completado') {
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold';
            badge.textContent = 'Completado / Listo';
          } else if (statusVal === 'reparacion') {
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold';
            badge.textContent = 'En Reparación Activa';
          } else {
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold';
            badge.textContent = 'En Diagnóstico';
          }
        }
      }

      modalEditOrder.classList.add('hidden');
      showToast('Estado técnico de la orden actualizado en tiempo real.', 'success', 'Orden Actualizada');
    };
  }

  // Botones de Turno y Exportación
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Exportar Informe')) {
      btn.onclick = () => {
        showToast('Generando informe corporativo para Colombia (SLA & Racks)...', 'info', 'Exportando');
        setTimeout(() => {
          showToast('Informe descargado: IT_Seobiseu_Colombia_Reporte_Octubre.pdf', 'success', 'Descarga Completada');
        }, 700);
      };
    } else if (btn.textContent.includes('Filtrar por Turno')) {
      btn.onclick = () => {
        showToast('Filtro: Turno 24/7 Datacenter Bogotá Zona Franca Activo.', 'info', 'Turno Actual');
      };
    }
  });
}

/* ==========================================================================
   6. MÓDULO INVENTARIO DE REPUESTOS
   ========================================================================== */
function initInventarioModule() {
  const modalNewPart = document.getElementById('newPartModal');
  const modalEditPart = document.getElementById('editPartModal');
  const formNewPart = modalNewPart ? modalNewPart.querySelector('form') : null;
  const formEditPart = modalEditPart ? modalEditPart.querySelector('form') : null;
  const tableBody = document.querySelector('#inventoryTableContent tbody');

  // Registrar Repuesto
  if (formNewPart) {
    formNewPart.onsubmit = (e) => {
      e.preventDefault();
      const skuInput = formNewPart.querySelector('input[placeholder*="PSU"]') || formNewPart.querySelectorAll('input')[0];
      const nameInput = formNewPart.querySelector('input[placeholder*="Fuente"]') || formNewPart.querySelectorAll('input')[1];
      const qtyInput = formNewPart.querySelector('input[type="number"]');
      const priceInput = formNewPart.querySelector('input[placeholder*="450.000"]') || formNewPart.querySelector('input[placeholder*="185.00"]');
      const rackInput = formNewPart.querySelector('input[placeholder*="Rack"]') || formNewPart.querySelectorAll('input')[4];

      const sku = (skuInput && skuInput.value.trim().toUpperCase()) || `SKU-COL-${Date.now().toString().slice(-4)}`;
      const name = (nameInput && nameInput.value.trim()) || 'Componente Servidor Enterprise';
      const qty = parseInt(qtyInput ? qtyInput.value : '10', 10);
      const price = priceInput ? priceInput.value.trim() : '480.000 COP';
      const rack = (rackInput && rackInput.value.trim()) || 'Rack Central / Gav. 02';

      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in slide-in-from-top-2';
        newRow.setAttribute('data-category', 'storage');
        newRow.innerHTML = `
          <td class="py-3 px-4 font-mono font-bold text-brand-cyan">${sku}</td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-200">${name}</div>
            <div class="text-[11px] text-slate-400">Componente catalogado en inventario Colombia</div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">Infraestructura</span>
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
          <td class="py-3 px-4 font-mono text-slate-200">$${price.includes('COP') ? price : price + ' COP'}</td>
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
      }

      // Actualizar contador Total SKU
      const totalSkuEl = document.querySelector('.font-display.text-sm.font-bold.text-white');
      if (totalSkuEl && !isNaN(parseInt(totalSkuEl.textContent))) {
        totalSkuEl.textContent = parseInt(totalSkuEl.textContent) + 1;
      }

      formNewPart.reset();
      modalNewPart.classList.add('hidden');
      showToast(`Repuesto [${sku}] catalogado con éxito en el almacén de Tocancipá.`, 'success', 'Inventario Actualizado');
    };
  }

  // Capturar fila al presionar "Ajustar Stock"
  document.addEventListener('click', (e) => {
    const tuneBtn = e.target.closest('[data-modal-target="editPartModal"]');
    if (tuneBtn) {
      const row = tuneBtn.closest('tr');
      if (row) {
        const skuEl = row.querySelector('.font-mono.font-bold');
        currentSkuToEdit = {
          sku: skuEl ? skuEl.textContent.trim() : 'SKU',
          row: row
        };
      }
    }
  });

  // Guardar Ajuste de Stock
  if (formEditPart) {
    formEditPart.onsubmit = (e) => {
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

      modalEditPart.classList.add('hidden');
      formEditPart.reset();
      showToast(`Stock de [${currentSkuToEdit ? currentSkuToEdit.sku : 'SKU'}] actualizado (${diff >= 0 ? '+' : ''}${diff} unidades).`, 'success', 'Stock Modificado');
    };
  }
}

/* ==========================================================================
   7. MÓDULO ÓRDENES DE TRABAJO
   ========================================================================== */
function initOrdenesModule() {
  const modalNewOrder = document.getElementById('newOrderModal');
  const formNewOrder = modalNewOrder ? modalNewOrder.querySelector('form') : null;
  const tableBody = document.querySelector('#ordersTableContent tbody');

  if (formNewOrder) {
    formNewOrder.onsubmit = (e) => {
      e.preventDefault();
      const client = formNewOrder.querySelector('input[placeholder*="Bancolombia"]').value.trim() || 'Bancolombia S.A.';
      const device = formNewOrder.querySelector('input[placeholder*="Dell"]').value.trim() || 'Servidor Rack 2U';
      const diag = formNewOrder.querySelector('textarea').value.trim() || 'Mantenimiento técnico preventivo y correctivo.';
      const priority = formNewOrder.querySelector('select').value;
      const orderId = `#OT-2024-${Math.floor(Math.random() * 800 + 2070)}`;

      if (tableBody) {
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in slide-in-from-top-2';
        newRow.setAttribute('data-status', 'proceso');
        newRow.innerHTML = `
          <td class="py-3 px-4 font-mono font-bold text-brand-cyan">
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-5 rounded-full ${priority === 'p1' ? 'bg-rose-500' : 'bg-amber-500'}"></span>
              <span>${orderId}</span>
            </div>
          </td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-200">${client}</div>
            <div class="text-[11px] text-slate-400">Sede Datacenter Bogotá</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-200">${device}</div>
            <div class="text-[10px] font-mono text-brand-electric">SN: COL-8HG9-DELL</div>
            <div class="text-[11px] text-slate-400">${diag}</div>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-sky-500/20 text-brand-cyan border border-sky-500/30 flex items-center justify-center font-mono font-bold text-[10px]">MS</div>
              <div>
                <div class="font-semibold text-slate-200 text-xs">Téc. Marco Silva</div>
                <div class="text-[9px] text-slate-400 font-mono">Tocancipá</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${priority === 'p1' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'} font-semibold">
              ${priority === 'p1' ? 'Crítica (2h)' : 'Alta (6h)'}
            </span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
              En Diagnóstico / Triage
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="inline-flex items-center gap-1">
              <button 
                class="btn-open-drawer btn-pro px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-brand-cyan border border-sky-500/30 transition-colors flex items-center gap-1 font-semibold text-[11px]" 
                data-order-id="${orderId}"
                data-client="${client}"
                data-device="${device}"
                data-diag="${diag}"
                title="Ver Detalle Técnico"
              >
                <span class="material-symbols-outlined text-[15px]">visibility</span>
                <span>Ver Detalle</span>
              </button>
              <button data-modal-target="editOrderModal" data-order-id="${orderId}" class="btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar orden">
                <span class="material-symbols-outlined text-[15px]">edit</span>
              </button>
            </div>
          </td>
        `;
        tableBody.prepend(newRow);
      }

      formNewOrder.reset();
      modalNewOrder.classList.add('hidden');
      showToast(`Órden ${orderId} creada y radicada exitosamente.`, 'success', 'Orden Registrada');
    };
  }

  // Manejo de formulario Editar Orden
  const modalEditOrder = document.getElementById('editOrderModal');
  const formEditOrder = modalEditOrder ? modalEditOrder.querySelector('form') : null;
  if (formEditOrder) {
    formEditOrder.onsubmit = (e) => {
      e.preventDefault();
      const select = formEditOrder.querySelectorAll('select')[1];
      const newStatus = select ? select.options[select.selectedIndex].text : 'Completado';

      if (currentActiveEditOrder && currentActiveEditOrder.row) {
        const badge = currentActiveEditOrder.row.querySelector('[class*="bg-rose-500"], [class*="bg-amber-500"], [class*="bg-sky-500"], [class*="bg-emerald-500"]');
        if (badge) {
          badge.textContent = newStatus;
          if (newStatus.includes('Completado')) {
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold';
          }
        }
      }

      modalEditOrder.classList.add('hidden');
      showToast('Estado y asignación de la orden modificados con éxito.', 'success', 'Órden Actualizada');
    };
  }
}

/* ==========================================================================
   8. MÓDULO TICKETS Y REQUERIMIENTOS
   ========================================================================== */
function initTicketsModule() {
  const formTicket = document.querySelector('form[data-validate="true"]');
  if (formTicket) {
    formTicket.onsubmit = (e) => {
      e.preventDefault();
      const ticketId = `#TK-COL-${Math.floor(Math.random() * 8000 + 1000)}`;
      showToast(`Requerimiento ${ticketId} registrado en Mesa de Ayuda Colombia. Notificación enviada al solicitante.`, 'success', 'Ticket Radicado');
      formTicket.reset();
    };
  }
}

/* ==========================================================================
   9. MÓDULO DIRECTORIO CORPORATIVO DE CLIENTES
   ========================================================================== */
function initClientesModule() {
  const modalNewClient = document.getElementById('newClientModal');
  const formNewClient = modalNewClient ? modalNewClient.querySelector('form') : null;
  const tableBody = document.querySelector('#clientsTableContent tbody');

  if (formNewClient) {
    formNewClient.onsubmit = (e) => {
      e.preventDefault();
      const nameInput = formNewClient.querySelector('input[placeholder*="Empresa"]') || formNewClient.querySelectorAll('input')[0];
      const clientName = (nameInput && nameInput.value.trim()) || 'Empresa Colombia S.A.S.';
      const nit = `NIT: 901.${Math.floor(Math.random() * 800 + 100)}.${Math.floor(Math.random() * 800 + 100)}-${Math.floor(Math.random() * 9)}`;

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
                <div class="text-[10px] font-mono text-slate-400">${nit}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-300">Bogotá D.C. • Sede Empresarial</td>
          <td class="py-3 px-4 font-mono text-slate-300">8 Servidores Core</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Platinum SLA 99.98%</span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
          </td>
          <td class="py-3 px-4 text-right">
            <button class="btn-client-sla btn-pro px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-brand-cyan border border-sky-500/30 text-[11px] font-semibold flex items-center gap-1" title="Ver Contrato y Sedes SLA">
              <span class="material-symbols-outlined text-[14px]">contract</span>
              <span>Ver SLA</span>
            </button>
          </td>
        `;
        tableBody.prepend(newRow);
      }

      formNewClient.reset();
      modalNewClient.classList.add('hidden');
      showToast(`Cliente corporativo [${clientName}] registrado con contrato Platinum SLA en Colombia.`, 'success', 'Cliente Agregado');
    };
  }

  // Delegación de botón "Ver SLA" en la tabla de clientes
  document.addEventListener('click', (e) => {
    const btnSla = e.target.closest('.btn-client-sla');
    if (btnSla) {
      const row = btnSla.closest('tr');
      const clientName = row ? row.querySelector('.font-semibold').textContent.trim() : 'Cliente';
      showToast(`Contrato SLA Platinum para ${clientName}: Cobertura 24/7 en Colombia con tiempo de respuesta máximo de 2 horas.`, 'info', 'Certificación SLA');
    }
  });
}

/* ==========================================================================
   10. UTILIDADES GLOBALES (THEME, NAV, BUSCADOR, VALIDACIONES, TOASTS)
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
  const defaultTitle = type === 'success' ? 'Operación Exitosa' : type === 'error' ? 'Aviso' : 'Notificación';

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
  requestAnimationFrame(() => toast.classList.remove('-translate-y-4', 'opacity-0'));

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-6');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

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

  themeButton.onclick = () => {
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    localStorage.setItem('it_seobiseu_theme', nextTheme);
    updateThemeButton();
  };

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
      if (searchModal) {
        searchModal.classList.remove('hidden');
        if (searchModalInput) setTimeout(() => searchModalInput.focus(), 50);
      }
    }
  });

  searchInputs.forEach(input => {
    input.onclick = () => {
      if (searchModal) {
        searchModal.classList.remove('hidden');
        if (searchModalInput) setTimeout(() => searchModalInput.focus(), 50);
      }
    };
  });

  if (closeSearchModal && searchModal) {
    closeSearchModal.onclick = () => searchModal.classList.add('hidden');
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

function initRealtimeFilters() {
  // Filtro de Órdenes
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
          showToast('Sincronización en vivo con Datacenter Colombia.', 'info', 'Actualizado');
        }, 500);
      };
    }
  });
}

function initQuickStats() {
  const latencyBadge = document.getElementById('telemetryLatency');
  if (latencyBadge) {
    setInterval(() => {
      const randomLatency = Math.floor(Math.random() * 4) + 8;
      latencyBadge.textContent = `Latencia ${randomLatency}ms • Bogotá NOC`;
    }, 4000);
  }
}
