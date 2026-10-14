import { AuthService } from './api.js';
import { showToast } from './app.js';

const form = document.querySelector('[data-auth-form]');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await AuthService.login(email, password);
      showToast('Sesión iniciada correctamente.', 'success', 'Acceso concedido');
      window.setTimeout(() => { window.location.href = 'index.html'; }, 500);
    } catch (error) {
      showToast(error.message || 'No fue posible iniciar sesión.', 'error', 'Acceso rechazado');
    } finally {
      submit.disabled = false;
    }
  });
}
