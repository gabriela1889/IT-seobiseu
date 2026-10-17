# IT seobiseu

Aplicación web integral para la gestión de operaciones y servicios de tecnología (ServiceDesk). Permite a una empresa administrar clientes, sedes, tickets de soporte técnico, órdenes de trabajo, inventario de repuestos y telemetría en tiempo real.

---

## 1. ¿Qué problema resuelve?

IT seobiseu centraliza y organiza los flujos operativos de soporte técnico TI:

- **Clientes:** Empresas e instituciones atendidas.
- **Sedes:** Ubicaciones físicas por cliente.
- **Tickets:** Incidentes y solicitudes registradas con nivel de prioridad.
- **Órdenes de trabajo:** Tareas técnicas asignadas con diagnóstico y seguimiento.
- **Inventario:** Repuestos, componentes y suministros con control de stock crítico.
- **SLA:** Acuerdos de nivel de servicio (Crítico 24x7, Alta 24x7, Estándar).
- **Usuarios y Roles:** Control de acceso basado en roles (ADMINISTRADOR, SUPERVISOR, TECNICO, CLIENTE).

---

## 2. Arquitectura de la Solución

```text
Persona Usuaria
      ↓
Frontend: HTML5, Tailwind CSS, JavaScript modular (ESM)
      ↓
Backend API: FastAPI (Python 3.14) con autenticación JWT
      ↓
Base de Datos: Supabase (PostgreSQL 17 en la nube)
```

- **Frontend:** En [frontend/](frontend/). Diseñado para computadora y dispositivos móviles, con tema oscuro de alta visibilidad, filtros, modales y cliente HTTP modular ([frontend/js/api.js](frontend/js/api.js)).
- **Backend:** En [backend/](backend/). API REST construida con FastAPI, controladores para recursos, validación estricta con Pydantic y seguridad JWT.
- **Base de Datos:** En [supabase/](supabase/) y [database/](database/). PostgreSQL en la nube provisto por Supabase con Row Level Security (RLS), índices optimizados y disparadores automáticos.

---

## 3. Carpetas del Repositorio

```text
IT seobiseu/
├── frontend/       Pantallas interactivas y cliente web (HTML, Tailwind, JS)
├── backend/        API REST FastAPI con conexión a Supabase PostgreSQL
├── database/       Script maestro (supabase_schema.sql)
├── supabase/       Configuración de Supabase CLI, migraciones y seed data
├── docs/           Lineamientos y especificaciones académicas del proyecto
├── tests/          Pruebas automatizadas con pytest
├── README.md       Guía del proyecto
└── .gitignore      Archivos y credenciales protegidas
```

---

## 4. Base de Datos Supabase Vinculada

El proyecto utiliza **Supabase Cloud (PostgreSQL)** como base de datos única y persistente:

* **Organización:** `gabriela1889's Org`
* **Proyecto:** `IT_Seobiseu`
* **Project Ref:** `shtpanowiryhadccuhty`
* **Región:** `us-east-1`
* **URL:** `https://shtpanowiryhadccuhty.supabase.co`
* **Dashboard:** [https://supabase.com/dashboard/project/shtpanowiryhadccuhty](https://supabase.com/dashboard/project/shtpanowiryhadccuhty)

---

## 5. Usuarios de Demostración por Rol

Para probar y evaluar la aplicación, se encuentran creados y activos en la base de datos de Supabase los siguientes 4 usuarios:

| Rol | Nombre | Correo Electrónico | Contraseña | Alcance y Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | Administrador del Sistema | `admin@it-seobiseu.local` | `Admin123!` | Control total, inventario, clientes, métricas |
| **SUPERVISOR** | Supervisor de Operaciones | `supervisor@it-seobiseu.local` | `Supervisor123!` | Dashboard, auditoría, órdenes y SLA |
| **TECNICO** | Técnico de Soporte TI | `tecnico@it-seobiseu.local` | `Tecnico123!` | Órdenes asignadas, diagnóstico e inventario |
| **CLIENTE** | Contacto Cliente Demo | `cliente@it-seobiseu.local` | `Cliente123!` | Solicitud y seguimiento de sus tickets |

---

## 6. Ejecución del Backend en Local

Requisitos: Python 3.10 o superior.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copia `backend/.env.example` como `backend/.env` (las credenciales ya vienen configuradas para el proyecto de Supabase):

```powershell
uvicorn main:app --reload
```

Endpoints principales:
- **API Swagger / OpenAPI:** `http://localhost:8000/docs`
- **Salud del servidor:** `http://localhost:8000/api/v1/health`

---

## 7. Ejecución del Frontend en Local

Desde la raíz del proyecto, puedes iniciar un servidor web estático:

```powershell
python -m http.server 5500 --directory frontend
```

Luego abre en el navegador:
`http://localhost:5500`

---

## 8. Pruebas Automatizadas

El proyecto incluye pruebas funcionales y de integración con `pytest`:

```powershell
python -m pytest tests/test_api.py -v
```

---

## 9. Seguridad y Buenas Prácticas

- Las contraseñas se almacenan cifradas con el algoritmo seguro **Argon2id**.
- La comunicación frontend-backend se autoriza mediante tokens **Bearer JWT**.
- El archivo `backend/.env` y credenciales privadas están ignorados en Git mediante `.gitignore`.
- La base de datos tiene habilitado **Row Level Security (RLS)** en todas sus tablas.
