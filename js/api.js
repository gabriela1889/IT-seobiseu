/**
 * IT seobiseu - API Client Service (FastAPI v1 Integration)
 * Base URL: http://localhost:8000/api/v1
 */

const API_BASE_URL = (window.IT_SEOBISEU_API_URL || 'http://localhost:8000') + '/api/v1';

// Token Management Keys
const TOKEN_KEY = 'it_seobiseu_token';
const USER_KEY = 'it_seobiseu_user';

/**
 * Helper to get authentication headers
 */
function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Generic request handler with error interception and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = getHeaders(options.body && !(options.body instanceof FormData));

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // If unauthorized or token expired
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Optional redirection or event dispatch
      console.warn('[IT seobiseu API] Sesión expirada o no autorizada (401).');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `Error HTTP: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return true;
    }

    return await response.json();
  } catch (error) {
    console.error(`[IT seobiseu API Error] Endpoint: ${endpoint}`, error);
    throw error;
  }
}

/* ==========================================================================
   1. AUTHENTICATION SERVICE
   ========================================================================== */
export const AuthService = {
  /**
   * Login user and store JWT token in localStorage
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Token and user info
   */
  async login(email, password) {
    // FastAPI OAuth2PasswordBearer or JSON authentication
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.access_token || data.token) {
      const token = data.access_token || data.token;
      localStorage.setItem(TOKEN_KEY, token);
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    }
    return data;
  },

  /**
   * Remove token and clear local session
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored user profile object
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
};

/* ==========================================================================
   2. ÓRDENES DE TRABAJO (WORK ORDERS) CRUD
   ========================================================================== */
export const OrdenesService = {
  /**
   * Get all work orders with optional filtering and pagination
   * @param {Object} params { status, priority, search, page, limit }
   */
  async getOrdenes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/ordenes?${query}` : '/ordenes';
    return await request(endpoint, { method: 'GET' });
  },

  /**
   * Get single work order by ID
   * @param {string|number} id 
   */
  async getOrdenById(id) {
    return await request(`/ordenes/${id}`, { method: 'GET' });
  },

  /**
   * Create new work order
   * @param {Object} ordenData { cliente, equipo, serie, prioridad, tecnico_id, diagnostico, sla_horas }
   */
  async createOrden(ordenData) {
    return await request('/ordenes', {
      method: 'POST',
      body: JSON.stringify(ordenData),
    });
  },

  /**
   * Update existing work order (Status, notes, assigned tech)
   * @param {string|number} id 
   * @param {Object} ordenData 
   */
  async updateOrden(id, ordenData) {
    return await request(`/ordenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ordenData),
    });
  },

  /**
   * Delete or archive work order
   * @param {string|number} id 
   */
  async deleteOrden(id) {
    return await request(`/ordenes/${id}`, { method: 'DELETE' });
  },

  /**
   * Add technical log note (Work Log bitácora) to order
   * @param {string|number} id 
   * @param {Object} logData { nota, porcentaje_rebuild, tecnico }
   */
  async addWorkLog(id, logData) {
    return await request(`/ordenes/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }
};

/* ==========================================================================
   3. INVENTARIO DE REPUESTOS Y COMPONENTES (WAREHOUSE TELEMETRY)
   ========================================================================== */
export const InventarioService = {
  /**
   * Get inventory items catalog with optional category and stock filters
   * @param {Object} params { categoria, stock_bajo, search }
   */
  async getInventario(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/inventario?${query}` : '/inventario';
    return await request(endpoint, { method: 'GET' });
  },

  /**
   * Get single spare part details by SKU or ID
   * @param {string} sku 
   */
  async getRepuestoBySku(sku) {
    return await request(`/inventario/${sku}`, { method: 'GET' });
  },

  /**
   * Register new spare part item
   * @param {Object} itemData { sku, nombre, categoria, stock, stock_minimo, precio_unitario, rack_ubicacion, proveedor }
   */
  async createRepuesto(itemData) {
    return await request('/inventario', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Update spare part details
   * @param {string} sku 
   * @param {Object} itemData 
   */
  async updateRepuesto(sku, itemData) {
    return await request(`/inventario/${sku}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Quick adjust stock quantity (Ingreso / Salida / Auditoría)
   * @param {string} sku 
   * @param {number} cantidadDiferencia 
   * @param {string} motivo 
   */
  async adjustStock(sku, cantidadDiferencia, motivo) {
    return await request(`/inventario/${sku}/ajuste-stock`, {
      method: 'POST',
      body: JSON.stringify({ cantidad: cantidadDiferencia, motivo }),
    });
  },

  /**
   * Delete or decommission SKU
   * @param {string} sku 
   */
  async deleteRepuesto(sku) {
    return await request(`/inventario/${sku}`, { method: 'DELETE' });
  }
};

/* ==========================================================================
   4. SOLICITUDES Y TICKETS DE SOPORTE (INCIDENT INTAKE)
   ========================================================================== */
export const TicketsService = {
  /**
   * Get tickets list
   * @param {Object} params { prioridad, estado, search }
   */
  async getTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/tickets?${query}` : '/tickets';
    return await request(endpoint, { method: 'GET' });
  },

  /**
   * Create new support ticket / incident intake
   * @param {Object} ticketData { tipo_requerimiento, prioridad_sla, correo_contacto, telefono, serial_equipo, datacenter_ubicacion, descripcion }
   */
  async createTicket(ticketData) {
    return await request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  /**
   * Update ticket status or escalate
   * @param {string|number} id 
   * @param {Object} ticketData 
   */
  async updateTicket(id, ticketData) {
    return await request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData),
    });
  }
};

/* ==========================================================================
   5. CLIENTES & TELEMETRÍA GLOBAL
   ========================================================================== */
export const ClientesService = {
  async getClientes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/clientes?${query}` : '/clientes';
    return await request(endpoint, { method: 'GET' });
  },

  async createCliente(clienteData) {
    return await request('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }
};

export const TelemetriaService = {
  /**
   * Get real-time cockpit metrics (Disponibilidad, Latencia, Órdenes activas, Racks)
   */
  async getMetrics() {
    return await request('/telemetria/resumen', { method: 'GET' });
  }
};

// Default export grouping all services
export default {
  Auth: AuthService,
  Ordenes: OrdenesService,
  Inventario: InventarioService,
  Tickets: TicketsService,
  Clientes: ClientesService,
  Telemetria: TelemetriaService,
};
