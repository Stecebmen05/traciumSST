# SafeGuard SST - PRD (Product Requirements Document)

## Problem Statement
Plataforma integral de gestion, implementacion y auditoria del SG-SST para empresas y consultoras en Colombia, cumpliendo con el Decreto 1072 de 2015 y la Resolucion 0312 de 2019.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: Emergent Google OAuth + JWT session cookies
- **AI**: OpenAI GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Reports**: openpyxl (Excel) + reportlab (PDF)
- **Design**: Light corporate theme, Outfit/IBM Plex Sans/JetBrains Mono fonts

## User Personas
1. **Administrador**: Acceso total al sistema, configura empresa y roles
2. **Responsable SG-SST**: Gestiona implementacion, documentos, capacitaciones
3. **Auditor**: Realiza auditorias, registra hallazgos
4. **Lider de Area**: Gestiona riesgos e incidentes de su area
5. **Colaborador**: Consulta y reporta incidentes

## Core Requirements (Static)
- Banco completo de 60 estandares minimos Res. 0312/2019 (Cap 1: 7, Cap 2: 21, Cap 3: 60)
- Parametrizacion por tipo de empresa (<=10, 11-50, >50 trabajadores)
- Niveles de riesgo I-V
- 16 componentes Decreto 1072/2015 mapeados
- Cumplimiento por ciclo PHVA, capitulo, responsable, sede
- Gestion documental con versionamiento
- Matriz IPER con valoracion automatica de riesgos
- Registro de incidentes/accidentes con investigacion causa raiz
- Plan de capacitacion
- Auditorias con hallazgos y seguimiento
- Dashboard KPI en tiempo real
- Reportes PDF/Excel
- Analisis AI inteligente

## What's Been Implemented (April 15, 2026)
### Sprint 1 - MVP:
- [x] Google OAuth (Emergent-managed)
- [x] Dashboard KPI con Puntaje Res. 0312
- [x] 8 modulos funcionales completos (Documentos, IPER, Incidentes, Capacitacion, Auditorias, Reportes, AI)

### Sprint 3 - RBAC + Object Storage + Multi-empresa:

### Sprint 2 - Res. 0312/2019 + Decreto 1072/2015:
- [x] Banco completo de 58 estandares minimos (Res. 0312/2019)
- [x] Parametrizacion por tipo de empresa y nivel de riesgo
- [x] Cumplimiento por ciclo PHVA, capitulo, responsable, sede
- [x] 16 componentes Decreto 1072/2015 mapeados

### Sprint 4 - Flujo Completo de Auditoría con IA:
- [x] Configuracion de empresa con recalculo automatico

### Sprint 5 - Dashboard Consultora + Informe PDF + Aislamiento:
- [x] Dashboard Consultora consolidando todas las empresas (KPIs globales, cumplimiento comparativo, tabla detallada)
- [x] Generador automático de Informe Final de Auditoría PDF profesional con 7 secciones formales
- [x] Identidad visual del membrete Stephania Ceballos (coral #F2A292, azul oscuro #1F3C5E)
- [x] Portada corporativa, tablas PHVA, resultados por estándar, análisis Art. 2.2.4.6.30 Decreto 1072
- [x] Secciones: Info General, Desarrollo, Fortalezas, Hallazgos, Recomendaciones, Conclusiones, Firmas
- [x] Datos de contacto en pie de página del PDF
- [x] Dashboard con filtrado por empresa activa (company_id scoping)
- [x] Link "Consolidado" en sidebar para administradores
- [x] 11 fases del flujo: programación → asignación → ejecución → evidencias → hallazgos → plan de acción → seguimiento → cierre → consolidado → revisión alta dirección → histórico
- [x] Generación automática de checklist desde estándares aplicables (Res. 0312)
- [x] Evaluación por item: Cumple / No Cumple / Parcial con observaciones
- [x] IA para redacción de observaciones de checklist
- [x] IA para redacción de hallazgos (no conformidades, observaciones, mejoras)
- [x] IA para generación de planes de acción correctiva
- [x] IA para resumen ejecutivo consolidado
- [x] IA para asistencia en revisión por alta dirección
- [x] Planes de acción con seguimiento de notas y cierre
- [x] Revisión por alta dirección con conclusiones, decisiones, recursos
- [x] Vista histórica comparativa con tabla y gráficos de tendencia
- [x] 9 estados del ciclo de vida de auditoría con transiciones
- [x] RBAC con 5 roles (admin, sgsst_manager, auditor, area_leader, collaborator)
- [x] Permisos diferenciados: admin/manager CRUD, auditor lectura+hallazgos, collaborador solo lectura
- [x] Object Storage para subida real de evidencia documental por estandar
- [x] Subida/descarga/eliminacion de archivos
- [x] Gestion multi-empresa: crear, cambiar, eliminar empresas
- [x] Datos aislados por empresa (standards, documentos, etc.)
- [x] Selector de empresa en sidebar
- [x] Pagina de gestion de usuarios con cambio de roles
- [x] Badges de rol en UI, botones deshabilitados para roles sin permisos

### Sprint 6 - Actas PDF (April 15, 2026):
- [x] Acta de Apertura PDF - endpoint /api/audits/{id}/opening-minutes/pdf (7 secciones formales, marca visual corporativa)
- [x] Acta de Cierre PDF - endpoint /api/audits/{id}/closing-minutes/pdf (8 secciones: resumen, resultados, hallazgos, planes, conclusiones, compromisos, firmas)
- [x] Botones Acta Apertura + Acta Cierre en lista de auditorías
- [x] Botón Acta de Cierre en vista Consolidado
- [x] AuthCallback mejorado con pantalla de error y botón de reintentar
- [x] Backend auth robusto con timeout 15s y mensajes descriptivos en español

### Sprint 7 - Motor Calificacion Res 0312 + Programacion Auditoria (April 17, 2026):
- [x] Motor de calificacion Res 0312/2019 alineado al Excel oficial (60 items, pesos, puntajes)
- [x] Clasificacion automatica: Critico (<60%), Moderadamente Aceptable (60-85%), Aceptable (>85%)
- [x] Desglose PHVA: Planear (25%), Hacer (60%), Verificar (5%), Actuar (10%)
- [x] Desglose por 7 estandares con puntaje individual
- [x] Endpoint GET /api/audits/{id}/score con calculo completo
- [x] Score card visual en la vista de Ejecucion con badges de clasificacion
- [x] Programacion de auditoria: hora inicio/fin, equipo auditor (lider + adicionales)
- [x] Responsables del proceso SG-SST y Miembro COPASST obligatorio
- [x] Reglas de negocio: no cerrar sin hora cierre, auditor lider ni COPASST
- [x] Score se calcula y guarda automaticamente al consultar detalle de auditoria

### Sprint 8 - Fases 3, 4, 5: Hallazgos Dinamicos + IA Informe + Cierre (April 17, 2026):
- [x] Fase 3: Hallazgos dinamicos - auto crear/actualizar/resolver hallazgos al cambiar checklist
- [x] Fase 3: Trazabilidad change_log con from/to/by/at en cada hallazgo
- [x] Fase 3: no_cumple->NC, parcial->OBS, cumple/no_aplica->resolved_by_compliance
- [x] Fase 4: Informe consolidado con 5 secciones IA (Resumen, Fortalezas, Hallazgos, Recomendaciones, Conclusiones)
- [x] Fase 4: Boton "Mejorar con IA" en cada seccion + edicion manual + guardar
- [x] Fase 4: Endpoint PUT /api/audits/{id}/ai-redaction para persistir textos IA
- [x] Fase 4: Score Res 0312 + PHVA + clasificacion en consolidado
- [x] Fase 4: Datos auditoria (equipo auditor, COPASST, fechas) en consolidado
- [x] Fase 5: Panel de cierre con fecha/hora + validacion (auditor, COPASST, hora cierre)
- [x] Fase 5: Badge "Auditoria Cerrada" cuando status=closed

### Sprint 9 - Correcciones y Mejoras: TraciumSST (April 17, 2026):
- [x] Renombrar app a TraciumSST
- [x] Edicion de programacion de auditoria en curso (bloqueada solo al cerrar)
- [x] Bloqueo de edicion cuando status=closed (mensaje claro + formulario deshabilitado)
- [x] Reapertura de auditoria cerrada (status=in_progress o follow_up)
- [x] Cascada automatica: al cambiar checklist -> recalcular score, report_stale, sync hallazgos
- [x] Trazabilidad: change_history con campo, valor anterior/nuevo, usuario y fecha
- [x] report_stale badge naranja en Consolidado cuando ejecucion fue modificada
- [x] Flag report_stale se limpia al guardar redaccion IA

### Sprint 10 - Bug Fixes y Mejoras (April 17, 2026):
- [x] Auth: retry automatico con 1s delay para race conditions de sesion
- [x] Formulario programacion se oculta al guardar exitosamente
- [x] PDFs actualizados: reflejan auditor, COPASST, horas, equipo adicional, responsables
- [x] Generar Hallazgos ahora actualiza hallazgos existentes cuando ejecucion cambia
- [x] Texto envuelto correctamente en PDFs (Paragraph en celdas de tabla)

### Sprint 11 - Criterio y Modo de Verificacion en Ejecucion (April 19, 2026):
- [x] Extraidos 60 criterios y modos de verificacion del Excel Res 0312
- [x] CRITERIA_VERIFICATION dict en standards_bank.py con 60 entradas
- [x] Checklist auto-enriquecido: items existentes reciben criterio/modo al consultar
- [x] Nuevos checklists incluyen criterio y modo_verificacion desde creacion
- [x] UI: caja azul CRITERIO (RES. 0312) + caja amarilla MODO DE VERIFICACION en cada item expandido

### Sprint 12 - Gestion de Usuarios con Email/Password (April 21, 2026):
- [x] Login dual: email/contraseña + Google OAuth en la misma pantalla
- [x] Admin seed automatico al iniciar (ADMIN_EMAIL/ADMIN_PASSWORD de .env)
- [x] Crear usuarios con email/contraseña/nombre/rol/empresa desde admin
- [x] Cambiar contraseña de usuarios (admin only)
- [x] Asignar empresa a usuario (admin only)
- [x] Proteccion brute force: 5 intentos fallidos = bloqueo 15 min
- [x] Sesiones en MongoDB con expiracion 7 dias
- [x] Tabla de usuarios con Tipo Auth (Email/Clave vs Google), cambiar rol, asignar empresa
- [x] RBAC: admin, sgsst_manager, auditor, area_leader, collaborator

### Sprint 13 - Firma Profesional y Anexos Idoneidad (April 21, 2026):
- [x] Firma profesional en los 3 PDFs: Especialista en SST, Licencia 201806023926, Auditor Interno HSEQ, Lider Implementador HSEQ
- [x] Seccion 8 ANEXOS SOPORTE IDONEIDAD DEL AUDITOR en informe final con 3 documentos
- [x] Credenciales SGS (Lider Implementador + Auditor Interno) y Licencia SST referenciados

### Sprint 14 - Cascada Completa Ejecucion->Hallazgos->Planes->Informe (April 21, 2026):
- [x] Cambiar item checklist auto-crea hallazgo + plan de accion automaticamente
- [x] Cambiar a cumple/no_aplica auto-resuelve hallazgo + cierra plan (progress=100, closure_note)
- [x] no_cumple -> NC + plan correctivo. parcial -> Observacion + plan preventivo
- [x] Generar Hallazgos sincroniza todo: crea nuevos, actualiza existentes, resuelve cumplidos, crea planes faltantes
- [x] findings_count solo cuenta hallazgos activos (excluye resolved_by_compliance)
- [x] Informe PDF siempre genera con datos actuales de la ejecucion
- [x] 13/13 tests pasados (iteration 16)

### Sprint 15 - Integracion PESV Res. 40595/2022 (April 21, 2026):
- [x] Nuevo tipo de auditoria: PESV (Plan Estrategico de Seguridad Vial) junto a SG-SST Interna/Externa
- [x] 60 estandares PESV extraidos del Excel oficial con fases, pasos y niveles
- [x] 3 niveles PESV: Basico (40 items), Estandar (53 items), Avanzado (60 items)
- [x] 4 fases PESV: Planificacion, Implementacion, Seguimiento, Mejora
- [x] Score PESV con clasificacion (Critico/Moderado/Aceptable) y desglose por fase
- [x] Cascada completa funciona para PESV (checklist->hallazgos->planes->score)
- [x] Frontend: selector 3 tipos, nivel PESV, badges morado, fases PESV en ejecucion

### Sprint 16 - Owner Role y Aislamiento por Empresa (April 21, 2026):
- [x] Rol "owner" para Stephania Ceballos (stephaniaceballosmendoza@gmail.com) - acceso total
- [x] Owner ve todas las empresas, todos los datos, todos los modulos
- [x] Google OAuth auto-asigna role=owner cuando Stephania se logea
- [x] Usuarios nuevos por Google OAuth entran como collaborator (no admin)
- [x] Usuarios no-owner/admin solo ven empresas asignadas en company_ids
- [x] Switch company restringido: solo empresas asignadas (owner/admin ven todas)
- [x] RBAC permissions incluye is_owner y can_view_all_companies
- [x] Colaboradores no pueden crear auditorias, documentos ni empresas

### Sprint 17 - Fixes Criticos: Reabrir, Hallazgos Sync, PDF (April 21, 2026):
- [x] Boton "Reabrir Auditoria" visible cuando esta cerrada + formulario deshabilitado
- [x] Hallazgos y Planes excluyen resueltos (resolved_by_compliance) y cerrados del detalle y PDFs
- [x] PDF: tabla "Resultados por Estandar" con Paragraph (sin truncar texto), observaciones completas
- [x] PDF: secciones Fortalezas IA, Hallazgos IA, Recomendaciones IA, Conclusiones IA incluidas
- [x] PDF: Planes de accion en tabla formateada con tipo, accion, responsable, fecha, estado
- [x] Auto-save en ejecucion: resultado guarda inmediato, observaciones con debounce 1.2s
- [x] Items expandidos no se cierran al guardar

### Sprint 18 - Inhabilitar Usuarios y Crear Demo (April 24, 2026):
- [x] Inhabilitar/Habilitar usuarios con toggle (no owner). Sessiones se eliminan al inhabilitar
- [x] Login bloqueado para usuarios inhabilitados con mensaje claro
- [x] Crear usuarios de prueba (demo) con email auto-generado, contraseña, dias de acceso y rol
- [x] Demo users expiran automaticamente, login rechazado al expirar
- [x] Credenciales demo copiables al portapapeles desde el dialog
- [x] Badges visuales: "Inhabilitado" rojo, "Demo (fecha)" naranja
- [x] Owner (Stephania) protegida: no se puede inhabilitar

### Sprint 19 - Alertas Email Planes de Accion (April 24, 2026):
- [x] Integracion Resend para envio de emails transaccionales
- [x] Endpoint enviar alertas de planes: vencidos (rojo), hoy (naranja), proximos (amarillo)
- [x] Endpoint resumen semanal consolidado por empresa a owner/admin
- [x] Configuracion personalizable de dias antes del vencimiento (5,3,1,0)
- [x] Historial de envios con detalle de destinatarios y resultados
- [x] Pagina "Alertas Email" en sidebar con botones de envio manual
- [x] Templates HTML profesionales para emails
- [x] Email verificado: stephaniaceballosmendoza@gmail.com recibe correctamente

### Sprint 20 - Dashboard Visual + FAB Global + Chatbot TraciumBot (April 24, 2026):
- [x] Dashboard: Banner semaforo de cumplimiento (rojo/amarillo/verde) con Res. 0312 clasificacion visible
- [x] Dashboard: Card PHVA breakdown con barras de progreso por ciclo (Planear 25%, Hacer 60%, Verificar 5%, Actuar 10%)
- [x] Dashboard: KPI card "Planes Vencidos" reemplaza "Documentos" en grid
- [x] Layout: FloatingActions global con FAB (bottom-right) de 5 acciones rapidas (Auditoria, Incidente, Documento, Plan, Alertas)
- [x] Layout: TraciumBot chatbot persistente siempre visible en todas las paginas autenticadas
- [x] Backend: POST /api/ai/chat con GPT-5.2 via emergentintegrations, contexto multi-turn desde DB
- [x] Backend: GET/DELETE /api/ai/chat/history para persistencia y limpieza
- [x] System prompt experto: Decreto 1072, Res 0312, Res 40595, Ley 1562, GTC 45, Res 1401
- [x] Chatbot con 4 sugerencias iniciales, historial en localStorage, validacion de mensaje (max 4000)
- [x] Testing iteration 18: 6/6 backend tests + frontend E2E 100% passed

### Sprint 21 - Workflow Aprobacion + TraciumBot Contextual (April 24, 2026):
- [x] Backend: POST /api/documents/{id}/submit-approval, /approve, /reject con approval_history y segregation of duties
- [x] Backend: POST /api/audits/{id}/submit-closure, /approve-closure, /reject-closure con validacion completa
- [x] Backend: GET /api/approvals/pending retorna documentos y auditorias pendientes (scoped por empresa)
- [x] Backend: DocumentOut Pydantic ampliado con 9 campos Optional de aprobacion (bug fix iter 19)
- [x] Frontend Documents: badges visuales (Borrador/Pendiente/Aprobado/Rechazado), botones Enviar/Aprobar/Rechazar/Historial con dialog
- [x] Frontend Audits: panel cierre ahora envia a aprobacion, banner naranja para cierre pendiente con Aprobar/Rechazar
- [x] Chatbot: toggle "Normativa / En vivo" inyecta datos reales de la empresa (hallazgos, planes vencidos, puntaje, incidentes) en el prompt
- [x] Segregation of duties: sgsst_manager no puede aprobar lo que envio (admin si)
- [x] Testing iteration 19+20: 15/15 backend + frontend E2E 100% passed

### Sprint 22 - Logo de Empresa en PDFs (April 24, 2026):
- [x] Backend: POST /api/companies/{id}/logo (multipart) con validacion PIL (PNG/JPEG/WebP), max 2MB, min 100 bytes
- [x] Backend: DELETE /api/companies/{id}/logo limpia todos los campos logo_*
- [x] Backend: Logo almacenado como base64 data URL en company.logo_data_url
- [x] Backend: Helper _company_logo_flowable inyecta Image en ReportLab a partir del data URL
- [x] PDFs: Acta de Apertura, Acta de Cierre e Informe Final incluyen el logo de la empresa (XObject verificado)
- [x] Frontend Companies: dialog de creacion con seccion "Logo de la Empresa (opcional)" + preview en vivo
- [x] Frontend Companies: boton "Logo/Cambiar" inline en cada card + X rojo para eliminar, miniatura 48x48 en la tarjeta
- [x] Validacion cliente: tipo MIME y tamano pre-upload con toast de error
- [x] Testing iteration 21: 10/10 backend + frontend E2E ~95% passed

### Sprint 23 - Aislamiento Estricto de Empresa + RBAC Colaborador (April 24, 2026):
- [x] Fix bug: colaborador ya no ve "Mi Empresa" (default) junto a su empresa asignada. Aislamiento 100% estricto.
- [x] Fix bug: colaborador no puede descargar PDFs de auditoria (Apertura/Cierre/Informe) - 403 por require_role
- [x] Fix bug: colaborador solo ve Dashboard + Incidentes en el sidebar (resto oculto por permisos)
- [x] Backend: PUT /users/{id}/company ahora reemplaza company_ids=[cid] para no-admin (antes $addToSet leak)
- [x] Backend: POST /auth/create-user y /users/create-demo exigen company_id para roles no-admin
- [x] Backend: GET /companies/active retorna 403 si no-admin sin empresa asignada (antes auto-creaba default)
- [x] Backend: Migracion startup limpia 'default' leak en company_ids de usuarios no-admin existentes
- [x] Backend: POST /incidents exige role in INCIDENT_REPORT_ROLES (403 si no)
- [x] Backend: 6 nuevas flags de permisos (can_view_audits/documents/hazards/training/reports/implementation)
- [x] Frontend: nav dinamico filtrado por can_view_* desde AuthContext
- [x] Frontend: FAB muestra solo acciones permitidas por rol (colaborador solo ve "Reportar Incidente")
- [x] Frontend: botones de descarga de PDFs ocultos cuando canDownloadReports=false
- [x] Testing iteration 22: 15/15 backend + 6/6 frontend flows passed

### Sprint 24 - RBAC Granular por Rol en Auditorias + Edicion IA de Actas (April 24, 2026):
- [x] Backend RBAC sgsst_manager (Responsable SST): PUT checklist/findings/audit ahora 403 (solo admin/auditor). POST action-plans/PUT/follow-up sigue 200.
- [x] Backend RBAC sgsst_manager: descarga de PDFs (Apertura/Cierre/Informe) solo permitida cuando audit.status in (closed, reviewed), sino 403
- [x] Backend RBAC auditor: sidebar reducido a solo Dashboard + Auditorias (oculto Incidentes, Documentos, IPER, Capacitacion, Reportes, Implementacion)
- [x] Backend: nuevo system prompt IA para tipos 'opening_narrative', 'closing_narrative', 'report_narrative' via GPT-5.2
- [x] Backend: PUT /audits/{id}/ai-redaction acepta narrative_opening, narrative_closing, narrative_report
- [x] Backend: PDFs inyectan narrativas personalizadas cuando existen (Apertura, Cierre e Informe Final)
- [x] Backend: 4 nuevas flags de permisos (can_edit_audit_items, can_edit_action_plans, can_use_ai_narrative + can_report_incidents ahora filtra nav)
- [x] Frontend: nuevo componente AINarrativeEditor en Consolidado con 3 secciones (Apertura/Cierre/Informe) con 'Generar con IA' + 'Guardar'
- [x] Frontend: Audits.js subviews reciben canEditAuditItems/canEditActionPlans/canUseAiNarrative props
- [x] Frontend: botones Acta Apertura/Cierre en AuditList ocultos para sgsst_manager en auditorias abiertas
- [x] Frontend: Consolidado muestra badge "Descargas disponibles al cerrar la auditoria" para sgsst_manager
- [x] Testing iteration 23-24: 25/25 backend + 5/5 frontend 100% passed

### Sprint 25 - Fix botón Programar + Bucle carga nav (April 24, 2026):
- [x] Fix bug: sgsst_manager ya no ve el boton "Programar Auditoria" (ahora gated por canEditAuditItems, admin/auditor only)
- [x] Fix bug: race condition al iniciar sesion - ProtectedRoute ahora espera a que las permissions esten cargadas antes de renderizar el Layout (previamente location.state.user brincaba la espera y las pestañas aparecian vacias hasta recargar)
- [x] Verificado: admin muestra las 12 pestañas completas en el primer login sin reload

### Sprint 26 - Aprobaciones Pendientes + Emails Resend (April 24, 2026):
- [x] Backend: nuevo helper _notify_approvers que envia email a admin/owner/sgsst_manager de la empresa
- [x] Backend: POST /documents/{id}/submit-approval dispara notificacion (excluye al submitter)
- [x] Backend: POST /audits/{id}/submit-closure dispara notificacion de cierre pendiente
- [x] Backend: FRONTEND_URL en .env para deep-link en emails
- [x] Frontend: nueva pagina /approvals con tabs Documentos + Auditorias y cards con acciones Aprobar/Rechazar/Ver detalle
- [x] Frontend: item de sidebar "Aprobaciones" con badge naranja de contador (poll 60s)
- [x] Frontend: visible para admin/owner/sgsst_manager (canApprove)
- [x] Frontend: dialog de rechazo con motivo obligatorio y dialog de detalle completo
- [x] Auto-aprobacion habilitada para owner/admin/sgsst_manager (segregation of duties retirada)
- [x] Testing iteration 25: 100% backend + 100% frontend passed

### Sprint 27 - Plan de Accion enriquecido + IA por campo (April 27, 2026):
- [x] Backend: POST /api/action-plans acepta nuevos campos start_date, resources, evidence (ademas de action_type, responsible, due_date)
- [x] Backend: 3 nuevos tipos AI assist: action_plan_action, action_plan_resources, action_plan_evidence con prompts especializados en SG-SST
- [x] Frontend: ActionPlansView reescrito con dialog ampliado: select de Tipo (Correctiva/Preventiva/Mejora), campos Responsable, Fecha Inicio, Fecha Fin, Recursos, Evidencia
- [x] Frontend: 3 botones "Sugerir/Mejorar con IA" individuales por campo (Accion, Recursos, Evidencia) usando GPT-5.2 con contexto del hallazgo
- [x] Frontend: lista de planes muestra badges de tipo con color (Correctiva=rojo, Preventiva=naranja, Mejora=verde) + bloques expandibles de recursos y evidencia
- [x] Validacion: save deshabilitado hasta que finding/action/responsible/due_date esten completos
- [x] Testing iteration 26: 7/7 backend + 100% frontend passed

### Sprint 28 - Mini-Gantt de Planes de Accion (April 27, 2026):
- [x] Frontend: nuevo componente ActionPlansGantt en /app/frontend/src/components/ActionPlansGantt.jsx
- [x] Renderiza barras horizontales por plan con color segun tipo (Correctiva=rojo, Preventiva=naranja, Mejora=verde, Cerrado=gris)
- [x] Barra muestra responsable encima, punto blanco pulsante si plan esta vencido
- [x] Linea vertical azul "Hoy" siempre visible si esta dentro del rango
- [x] Eje superior con marcadores de mes/ano alineados (sin overlap en bordes)
- [x] Header: titulo, badges de total/activos/vencidos
- [x] Leyenda inline: 3 tipos + Vencido + Hoy
- [x] Tooltip al hover con descripcion truncada + fechas + estado vencido
- [x] Empty-state: si no hay plans con fechas validas, retorna null (no renderiza)
- [x] Auto-padding: 3 dias antes del primer start y 3 dias despues del ultimo end para mejor lectura visual
- [x] Testing iteration 28: 100% frontend passed (5 rows, today line, overdue badge, colors, empty-state)

### Sprint 29 - Notificaciones in-app + Email para cambios en Planes (April 28, 2026):
- [x] Backend helper _create_notification: crea fila en db.notifications con user_id, type, title, message, link, related_id, read
- [x] Backend helper _notify_action_plan_change: envia email Resend + crea notificaciones in-app a admin/owner/sgsst_manager + responsable nominal de la empresa, excluyendo al actor
- [x] Backend hooks: POST /action-plans (created), PUT /action-plans/{id} (updated|closed), POST /action-plans/{id}/follow-up (follow_up) disparan notificaciones async
- [x] Backend: 4 endpoints nuevos: GET /notifications, PUT /notifications/{id}/read, POST /notifications/mark-all-read, DELETE /notifications/{id}
- [x] Frontend: nuevo componente NotificationBell con dropdown panel, badge rojo de contador, polling cada 30s, document.title flash en nuevas notificaciones
- [x] Frontend: bell visible en top-right header de Layout, click abre panel con items, X individual borra, "Marcar leidas" masivo, click en item navega a /audits y marca leida
- [x] Email template HTML profesional con tabla de detalles + deep-link a /audits
- [x] Testing iteration 29: 11/11 backend + 100% frontend passed

### Sprint 30 - Indicadores ARL + Generador de Documentos con IA (May 7, 2026):
- [x] Backend: nuevo modulo document_templates.py con 32 plantillas SG-SST/PESV alineadas a MinTrabajo (politicas, manuales, procedimientos, planes, reglamentos, formatos)
- [x] Backend GET /api/documents/templates: lista plantillas con categorias (sin exponer system_prompt)
- [x] Backend POST /api/documents/generate-ai: genera documento completo con GPT-5.2 inyectando datos de empresa activa (razon social, NIT, ciudad, riesgo, sedes, procesos) + customizaciones
- [x] Backend GET /api/indicators/arl: calcula indicadores Estructura/Proceso/Resultado segun Resolucion 1111/2017 (Frecuencia AT, Severidad AT, Mortalidad, Prevalencia EL, Incidencia EL, Ausentismo)
- [x] Backend GET /api/indicators/arl/pdf y /excel: exportacion profesional con logo de empresa
- [x] Frontend: pagina /indicators-arl con hero de cumplimiento (semaforo), 3 secciones de indicadores con formulas visibles, selectores anio/mes
- [x] Frontend: componente AIDocumentGenerator con buscador, tabs por categoria, preview Markdown editable, save automatico como Documento (status=active)
- [x] Sidebar: nuevo nav "Indicadores ARL" gated por can_view_reports
- [x] Documents page: boton "Crear con IA" gradient morado-azul que abre el generador
- [x] Testing iteration 30: 11/11 backend + 100% frontend passed

### Sprint 31 - Plan de Auditoria PDF + Email (May 12, 2026):
- [x] Backend GET /api/audits/{id}/plan/pdf: PDF profesional con 12 secciones (info general, objetivo, alcance, criterios, equipo auditor, auditados, metodologia, cronograma, recursos, confidencialidad, firmas) usando ReportLab. Incluye logo de empresa, header coral/azul, cronograma con horas de apertura/inspeccion/cierre
- [x] Backend POST /api/audits/{id}/plan/send-email: envia PDF como adjunto via Resend a admin/owner/sgsst_manager de la empresa + destinatarios extra opcionales. Template HTML profesional con tabla de detalles
- [x] Backend: gate permisivo para Plan PDF (admin/owner/auditor/sgsst_manager en CUALQUIER estado, dado que es documento pre-auditoria, a diferencia de las Actas que aun usan _require_pdf_download_access)
- [x] Backend: sanitizacion HTML del campo comment (html.escape + max 1000 chars) para prevenir inyeccion en email
- [x] Frontend Audits.js: botones "Plan PDF" (morado) y "Enviar Plan" (azul) en cada tarjeta de auditoria, visibles para admin/owner/auditor/sgsst_manager en cualquier estado
- [x] Frontend: dialog de envio con textarea de destinatarios adicionales + textarea de nota, info de auditoria, toast de exito/error con conteo enviados/fallidos
- [x] Testing iteration 31: 15/15 backend + 100% frontend passed. Email verificado: stephaniaceballosmendoza@gmail.com recibe correctamente

### Sprint 32 - Gmail SMTP + Fix cursor Consolidado (May 12, 2026):
- [x] Bug fix: cursor en textareas de Consolidado (5 secciones IA del Informe) saltaba al escribir porque ReportSection se redefinia en cada render. Movido fuera de ConsolidationView con props para preservar identidad de componente
- [x] E2E verificado: texto editado en Resumen Ejecutivo, Fortalezas, Recomendaciones aparece correctamente en el PDF del Informe Final descargado (pdftotext match)
- [x] Backend: nuevo helper unificado send_email() con Gmail SMTP (TLS 587) como primario + Resend como fallback. Soporta adjuntos PDF (MIME multipart/mixed)
- [x] Backend: _send_via_gmail_sync usa smtplib + MIMEMultipart con From/Reply-To configurables (GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM_NAME en .env)
- [x] Backend: POST /audits/{id}/plan/send-email migrado a send_email() unificado, ahora 3/3 destinatarios reciben PDF (antes 1/3 por restriccion Resend testing mode)
- [x] Configurado para envio desde stephaniaceballosmendoza@gmail.com a CUALQUIER destinatario externo, validado E2E con usuario

### Sprint 33 - Firma corporativa en correos + Fix firmas PDFs + Aislamiento demo admin (May 12, 2026):
- [x] Firma corporativa Stephania Ceballos embebida como imagen inline (CID multipart/related) en TODOS los correos salientes. Auto-append via _wrap_email_with_signature en send_email(). Incluye telefono clicable, email, portafolio (portal-estrategico.preview.emergentagent.com), Rionegro y tagline "Grow human. Lead better."
- [x] Fix numeracion Plan de Auditoria: seccion "11. FIRMAS" (antes brincaba a 12)
- [x] Fix rol confuso en Plan/Actas: COPASST ya no aparece como fallback del "Responsable SG-SST/Auditado". Multi-firma con 4 columnas si hay COPASST registrado, 3 si no
- [x] Fix critico credenciales falsas: nuevo helper _resolve_auditor_signature() devuelve las credenciales/licencia/certificados de Stephania SOLO si el auditor coincide con ella. Otro auditor -> bloque generico "Auditor Lider del SG-SST" sin licencia falsa
- [x] Fix Informe Final: seccion "7. FIRMAS" ahora muestra Reviso/Aprobo con nombres legibles (no user_id UUID). Usa process_responsibles[0] o company.sgsst_responsible
- [x] Multi-tenant isolation critico: create_demo_user y create_user_with_password ya no heredan company_ids del admin creador. Demo admin/admin nuevos empiezan con [] y deben crear sus propias empresas
- [x] list_companies: solo el owner (Stephania) ve todas. Cualquier admin regular o demo admin solo ve las empresas en su company_ids
- [x] get_active_company y /company: no auto-crean "Mi Empresa" para admins que no sean owner. Devuelven 404 con mensaje claro pidiendo crear la primera empresa
- [x] Auto-migration en startup: escanea demo admins (is_demo=True) con role admin/owner cuyos company_ids se solapen con los del owner (Stephania) y los limpia automaticamente. Sesiones tambien eliminadas para forzar re-login
- [x] Nuevo endpoint POST /users/{user_id}/reset-companies: admin puede resetear a cualquier demo admin/admin (excepto owner) con un click. Kills sessions
- [x] UI: boton naranja "Limpiar empresas" en UserManagement junto a demo admins que tengan companies asignadas
- [x] Fix deployment: agregado GET /health y GET /api/health (return {status:ok}) para probes de Kubernetes. Antes los pods se marcaban unhealthy por 404 en /health
- [x] Acta de Cierre: muestra audit.end_time real en "Hora de Cierre" y en el texto "Siendo las {hora}..."
- [x] Acta de Apertura: idem con audit.start_time
- [x] Actas y Plan: usan company.legal_representative y company.sgsst_responsible (con C.C.) para las firmas oficiales. Fallback a process_responsibles[0] si no hay datos de empresa
- [x] Nuevos campos en modelo Company: legal_representative, legal_representative_id, sgsst_responsible, sgsst_responsible_id
- [x] Frontend Companies.js: nueva seccion "Datos para Actas Oficiales" en dialog de crear/editar empresa con 4 campos

### Sprint 34 - Inspeccion General MinTrabajo con IA (May 12, 2026):
- [x] Parser openpyxl del Anexo Tecnico oficial V1.0 -> genera /app/backend/mintrabajo_checklists.py con 3 tiers (micro 6 items, medium 16 items, large 52 items) desde las hojas oficiales del Excel
- [x] Auto-seleccion de tier basado en workers_count y risk_level (5 workers R1 -> micro; 25 R2 -> medium; 100 R3 -> large; 10 R4 -> large)
- [x] Nueva coleccion MongoDB mintrabajo_inspections con estructura anidada (categorias -> items) que preserva codigo estandar, apoyo legal, descripcion oficial y lista de evidencias tipicas por item
- [x] Endpoints: GET /tiers, POST /inspections (crea con auto-tier), GET /inspections (con resumen: % cumplimiento, cumple/no_cumple/na/pending), GET /{id}, PUT /items/{id} (compliance + observation + evidence_notes), POST /ai/suggest-all (pre-carga sugerencias IA en TODOS los items), POST /items/{id}/ai/refine (mejora redaccion inspector), GET /pdf (profesional), DELETE /{id}
- [x] IA con Emergent LLM Key (openai gpt-4o-mini): sugerencia de verificacion pre-cargada por item con contexto de empresa (razon social, actividad, riesgo, trabajadores) + apoyo legal MinTrabajo. "Ajustar con IA" convierte notas rapidas del inspector en observacion formal MinTrabajo
- [x] Frontend /mintrabajo: pagina completa con 3 cards de info por tier, lista con progress bar de cumplimiento, badge de estado, boton PDF/eliminar
- [x] Dialog de creacion con auto-tier y aviso al usuario. Al crear, auto-dispara suggest-all en background (choice 2b)
- [x] Dialog de ejecucion con Accordion por categoria, botones CUMPLE/NO CUMPLE/N.A. por item, textarea de observacion con boton "Ajustar con IA", input de evidencias, banner morado con sugerencia IA pre-cargada por item, apoyo legal y descripcion visibles
- [x] PDF profesional: cabecera CORAL, info completa de empresa (Rep Legal, Responsable SG-SST, tier), resumen de cumplimiento con % en verde/rojo, todos los items con estado colorizado, firmas multi-parte (Inspector + Responsable SG-SST + Representante Legal)
- [x] Modulo independiente (choice 3) - NO cascadea a hallazgos ni action plans del modulo Auditorias
- [x] Sidebar: nuevo nav "Inspeccion MinTrabajo" (icono Landmark) gated por canViewAudits
- [x] E2E validado: POST inspeccion -> auto-selecciona medium (16 items), PUT item cumple, GET list muestra % correcto, PDF genera 11KB PDF-1.4 valido, AI refine convierte "todo bien, tiene licencia" en observacion formal MinTrabajo

### Sprint 35 - Certificado Publico Compartible (May 12, 2026):
- [x] Backend POST /mintrabajo/inspections/{id}/certificate: genera token uuid + expira en 90 dias, guarda en la inspeccion (public_certificate_token, certificate_expires_at)
- [x] Backend DELETE /mintrabajo/inspections/{id}/certificate: revoca certificado (unset token)
- [x] Backend GET /api/public/certificate/{token}: endpoint PUBLICO (sin auth) que devuelve datos anonimizados: nombre empresa + logo, nivel riesgo, tier, % cumplimiento, breakdown por categoria (nombre + %), datos consultor Stephania Ceballos con phone/email/portafolio URL. NO expone NIT, direccion, empleados, ni observaciones especificas
- [x] Endpoint valida expiracion (410 Gone si expirado) y token invalido (404)
- [x] Frontend nueva pagina publica /certificate/:token sin ProtectedRoute: card premium con header gradient azul-morado, logo empresa, numero gigante % cumplimiento con nivel EXCELENTE/SATISFACTORIO/EN MEJORA, breakdown por categoria con progress bars, bloque consultor con telefono y email clicables, CTA gradient morado "Solicita tu propia auditoria SG-SST" enlazado al PORTFOLIO_URL, tagline "Grow human. Lead better.", footer con fecha emision y vigencia
- [x] Frontend MinTrabajoInspection: nuevo boton "Generar certificado publico" (gradient morado) en toolbar de detalle. Al generar aparece panel con URL, boton Copiar (navigator.clipboard), Ver (abre en nueva tab), Revocar (rojo). Aviso claro de anonimizacion
- [x] Certificate token se persiste - al reabrir la inspeccion vuelve a mostrar el panel del certificado activo
- [x] E2E validado: token generado, publico responde 200 con datos anonimizados, NIT no expuesto, revocacion invalida el token (404 despues del DELETE)

## Prioritized Backlog

### P0
- [ ] Exportar Autoevaluacion en formato MinTrabajo (Excel/PDF)

### P1
- [ ] Logo personalizado de empresa en todos los PDFs generados
- [ ] Sistema de alertas por email para planes de accion proximos a vencer
- [ ] Workflow de aprobacion (documentos, auditorias)

### P2
- [ ] Firma digital de documentos
- [ ] Calendario de actividades
- [ ] Notificaciones in-app
- [ ] Integracion Power BI
