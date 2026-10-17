/**
 * IT seobiseu - Controlador del Portal de Acceso y Gestión de Sesión
 */
import { AuthService, DEMO_ACCOUNTS } from './api.js';
import { showToast } from './app.js';

const CREDENTIALS = {
  admin: { email: 'admin@it-seobiseu.local', pass: 'Admin123!' },
  supervisor: { email: 'supervisor@it-seobiseu.local', pass: 'Supervisor123!' },
  tecnico: { email: 'tecnico@it-seobiseu.local', pass: 'Tecnico123!' },
  cliente: { email: 'cliente@it-seobiseu.local', pass: 'Cliente123!' },
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-auth-form]');
  const roleButtons = document.querySelectorAll('[data-role-demo]');
  const currentUser = AuthService.getCurrentUser();

  // Si ya tiene sesión activa, mostrar banner discreto para continuar o cambiar
  if (currentUser && AuthService.isAuthenticated()) {
    showActiveSessionBanner(currentUser);
  }

  // Interacción de botones de acceso rápido por rol
  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const roleKey = btn.getAttribute('data-role-demo');
      const creds = CREDENTIALS[roleKey];
      if (!creds || !form) return;

      form.elements.email.value = creds.email;
      form.elements.password.value = creds.pass;

      // Animación de selección
      roleButtons.forEach((b) => b.classList.remove('ring-2', 'ring-brand-cyan', 'bg-sky-500/20'));
      btn.classList.add('ring-2', 'ring-brand-cyan', 'bg-sky-500/20');

      showToast(`Credenciales cargadas para ${roleKey.toUpperCase()}`, 'info', 'Acceso Rápido');
      
      // Auto-focus en el botón de submit
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.focus();
    });
  });

  // Manejo del formulario de inicio de sesión
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Ingrese su correo corporativo y contraseña.', 'error', 'Campos Incompletos');
        return;
      }

      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
        <span>Autenticando...</span>
      `;

      try {
        const result = await AuthService.login(email, password);
        const user = result.user || AuthService.getCurrentUser() || { nombre: 'Usuario', rol: 'OPERADOR' };
        
        showToast(`Bienvenido, ${user.nombre} (${user.rol})`, 'success', 'Acceso Concedido');
        
        window.setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } catch (error) {
        showToast(error.message || 'No fue posible iniciar sesión.', 'error', 'Acceso Rechazado');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }
});

function showActiveSessionBanner(user) {
  const container = document.querySelector('.max-w-sm');
  if (!container) return;

  const banner = document.createElement('div');
  banner.className = 'mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs';
  banner.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-slate-200">Sesión activa: <strong class="text-emerald-400">${user.nombre}</strong> (${user.rol})</span>
    </div>
    <a href="index.html" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-[11px] transition-all">
      Ir al Dashboard
    </a>
  `;
  container.prepend(banner);
}
