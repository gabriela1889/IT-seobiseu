-- =============================================================================
-- IT seobiseu - Datos Semilla (Seed Data) para Supabase
-- =============================================================================

-- 1. Roles del sistema
INSERT INTO public.roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Gestiona usuarios, configuración y todos los módulos del sistema'),
('SUPERVISOR', 'Supervisa SLA, tickets, órdenes y reportes analíticos'),
('TECNICO', 'Atiende y soluciona tickets y órdenes de trabajo asignadas'),
('CLIENTE', 'Crea y consulta el avance de sus solicitudes')
ON CONFLICT (nombre) DO NOTHING;

-- 2. SLAs estándar
INSERT INTO public.sla (nombre, prioridad, horas_respuesta, horas_resolucion, activo) VALUES
('Crítico 24x7', 'P1', 0.25, 2.00, TRUE),
('Alta 24x7', 'P2', 0.50, 4.00, TRUE),
('Estándar', 'P3', 1.00, 8.00, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Usuarios de ejemplo para cada rol
-- Administrador: admin@it-seobiseu.local / Admin123!
INSERT INTO public.usuarios (rol_id, nombre, correo, password_hash, activo)
SELECT r.id, 'Administrador del Sistema', 'admin@it-seobiseu.local', '$argon2id$v=19$m=65536,t=3,p=4$MbVVmMOZXhxqz1yFicSExA$uyIVWBKJZm2PwBrnKH/sSH8QzASB+PpsYOJOW6INkhA', TRUE
FROM public.roles r WHERE r.nombre = 'ADMINISTRADOR'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol_id = EXCLUDED.rol_id, activo = TRUE;

-- Supervisor: supervisor@it-seobiseu.local / Supervisor123!
INSERT INTO public.usuarios (rol_id, nombre, correo, password_hash, activo)
SELECT r.id, 'Supervisor de Operaciones', 'supervisor@it-seobiseu.local', '$argon2id$v=19$m=65536,t=3,p=4$HY81S0OLcNrWUJ2jN2+ORw$jRsi4s9I1q92+c3Yn0kq9w4axMPDa58kFGTclVYES6I', TRUE
FROM public.roles r WHERE r.nombre = 'SUPERVISOR'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol_id = EXCLUDED.rol_id, activo = TRUE;

-- Técnico: tecnico@it-seobiseu.local / Tecnico123!
INSERT INTO public.usuarios (rol_id, nombre, correo, password_hash, activo)
SELECT r.id, 'Técnico de Soporte TI', 'tecnico@it-seobiseu.local', '$argon2id$v=19$m=65536,t=3,p=4$VIOncXG/itM60gAMbRmENQ$nW6n1+UpNVU9uZNxIXnxBiUw7lwjXFiTVYAknLdS+Wc', TRUE
FROM public.roles r WHERE r.nombre = 'TECNICO'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol_id = EXCLUDED.rol_id, activo = TRUE;

-- Cliente: cliente@it-seobiseu.local / Cliente123!
INSERT INTO public.usuarios (rol_id, nombre, correo, password_hash, activo)
SELECT r.id, 'Contacto Cliente Demo', 'cliente@it-seobiseu.local', '$argon2id$v=19$m=65536,t=3,p=4$XHGf8TXi0c4A2+DtcYmx3A$In5Bm3YNi+ioAg2zV1SnZUC49jYssjr/XRBHLNjuba4', TRUE
FROM public.roles r WHERE r.nombre = 'CLIENTE'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol_id = EXCLUDED.rol_id, activo = TRUE;


-- 4. Clientes iniciales de prueba
INSERT INTO public.clientes (razon_social, identificacion_fiscal, correo_contacto, telefono, estado) VALUES
('Banco Santander', '20100047213', 'soporte@bancosantander.example', '+57 (1) 745-9000', 'ACTIVO'),
('Clínica San Patricio', '20492819001', 'ti@clinicasanpatricio.example', '+57 (1) 620-8000', 'AUDITORIA'),
('TechCorp Solutions S.A.S.', '901234567-8', 'contacto@techcorp.example', '+57 310 555-0199', 'ACTIVO')
ON CONFLICT (identificacion_fiscal) DO NOTHING;

-- 5. Sedes de los clientes
INSERT INTO public.sedes (cliente_id, nombre, direccion, contacto)
SELECT c.id, 'Sede Principal Financiera', 'Carrera 7 # 71-21 Torre A', 'Carlos Mendoza'
FROM public.clientes c WHERE c.identificacion_fiscal = '20100047213'
ON CONFLICT DO NOTHING;

INSERT INTO public.sedes (cliente_id, nombre, direccion, contacto)
SELECT c.id, 'Campus Médico Norte', 'Autopista Norte # 134-20', 'Dra. María Restrepo'
FROM public.clientes c WHERE c.identificacion_fiscal = '20492819001'
ON CONFLICT DO NOTHING;

-- 6. Inventario inicial de repuestos y suministros
INSERT INTO public.inventario (sku, nombre, categoria, stock, stock_minimo, precio_unitario, ubicacion, activo) VALUES
('REP-SSD-1TB-NVME', 'Unidad SSD M.2 NVMe 1TB Kingston KC3000', 'Almacenamiento', 18, 5, 95.00, 'Estante A-01', TRUE),
('REP-RAM-16GB-DDR4', 'Memoria RAM Crucial 16GB DDR4 3200MHz', 'Memoria', 24, 6, 45.00, 'Estante A-02', TRUE),
('CAB-PATCH-CAT6-3M', 'Patch Cord UTP Cat 6 Azul 3 Metros', 'Conectividad', 80, 20, 4.50, 'Estante C-05', TRUE),
('NET-SW-24P-GB', 'Switch Administrable Gigabit 24 Puertos PoE', 'Redes', 4, 2, 280.00, 'Estante B-03', TRUE),
('ACC-SRC-THERMAL', 'Pasta Térmica Arctic MX-4 4g', 'Consumibles', 12, 10, 8.00, 'Estante D-01', TRUE)
ON CONFLICT (sku) DO NOTHING;

-- 7. Tickets iniciales de demostración
INSERT INTO public.tickets (cliente_id, creado_por, tipo_requerimiento, prioridad, estado, asunto, descripcion)
SELECT 
    c.id,
    u.id,
    'Soporte de Servidores',
    'P1',
    'EN_PROCESO',
    'Caída intermitente en servidor transaccional core',
    'El clúster de base de datos reporta alta latencia y desbordamiento de conexiones.'
FROM public.clientes c, public.usuarios u
WHERE c.identificacion_fiscal = '20100047213' AND u.correo = 'admin@it-seobiseu.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.tickets (cliente_id, creado_por, tipo_requerimiento, prioridad, estado, asunto, descripcion)
SELECT 
    c.id,
    u.id,
    'Mantenimiento de Red',
    'P2',
    'ABIERTO',
    'Falla en puntos de red de consultorios piso 3',
    'Los médicos no pueden acceder a historias clínicas por desconexión ethernet.'
FROM public.clientes c, public.usuarios u
WHERE c.identificacion_fiscal = '20492819001' AND u.correo = 'admin@it-seobiseu.local'
ON CONFLICT DO NOTHING;

-- 8. Órdenes de trabajo asociadas
INSERT INTO public.ordenes_trabajo (ticket_id, cliente_id, tecnico_id, equipo, serial_equipo, prioridad, estado, diagnostico)
SELECT 
    t.id,
    t.cliente_id,
    u.id,
    'Servidor Rack PowerEdge R750',
    'SRV-DELL-883921',
    'P1',
    'EN_PROCESO',
    'Revisión en sitio con diagnóstico de sustitución de módulo de memoria DIMM defectuoso.'
FROM public.tickets t, public.usuarios u
WHERE t.asunto LIKE '%transaccional%' AND u.correo = 'admin@it-seobiseu.local'
ON CONFLICT DO NOTHING;

