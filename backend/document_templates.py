"""
Catalogo de plantillas de documentos SG-SST alineadas con MinTrabajo (Decreto 1072/2015, Resolucion 0312/2019).
Cada plantilla define: titulo, categoria, descripcion (para mostrar al usuario), y un system prompt
especializado para que la IA genere el contenido completo del documento.
"""

DOCUMENT_TEMPLATES = [
    # ======= POLITICAS =======
    {
        "template_id": "pol_sgsst",
        "title": "Politica del Sistema de Gestion SST",
        "category": "Politica",
        "description": "Politica general de SG-SST firmada por el representante legal. Cumple Art. 2.2.4.6.5 Dec. 1072.",
        "system_prompt": "Eres un experto en SG-SST colombiano. Redacta una POLITICA DE SEGURIDAD Y SALUD EN EL TRABAJO completa y formal segun el Decreto 1072/2015 Art. 2.2.4.6.5. Estructura: 1) Encabezado (empresa, NIT, ciudad, fecha de emision, version), 2) Compromiso de la alta direccion, 3) Alcance, 4) Objetivos especificos del SG-SST, 5) Asignacion de responsabilidades, 6) Identificacion de peligros y valoracion de riesgos, 7) Cumplimiento normativo, 8) Mejora continua, 9) Comunicacion, 10) Lugar y fecha + linea de firma del representante legal. Tono formal, legal, claro. Maximo 1.5 paginas.",
    },
    {
        "template_id": "pol_alcohol_drogas",
        "title": "Politica de Prevencion del Consumo de Alcohol, Tabaco y Sustancias Psicoactivas",
        "category": "Politica",
        "description": "Politica obligatoria por Resolucion 1956/2008 y Ley 1335/2009.",
        "system_prompt": "Redacta la POLITICA DE PREVENCION DEL CONSUMO DE ALCOHOL, TABACO Y SUSTANCIAS PSICOACTIVAS. Marco legal: Resolucion 1956/2008 Min. Proteccion Social y Ley 1335/2009. Incluye: compromiso, ambitos de aplicacion, prohibiciones expresas, programas de promocion y prevencion, acciones de sensibilizacion, mecanismos de control, consecuencias del incumplimiento. Tono formal con encabezado de empresa y firma del representante legal.",
    },
    {
        "template_id": "pol_no_acoso",
        "title": "Politica de Prevencion del Acoso Laboral",
        "category": "Politica",
        "description": "Politica preventiva del acoso laboral conforme Ley 1010/2006.",
        "system_prompt": "Redacta una POLITICA DE PREVENCION DEL ACOSO LABORAL alineada con la Ley 1010/2006 y la Resolucion 2646/2008. Incluye: compromiso de la alta direccion, definicion de acoso laboral, conductas constitutivas y excluyentes, mecanismos de prevencion, conformacion del Comite de Convivencia Laboral, procedimiento de quejas, confidencialidad y sanciones. Encabezado completo de empresa.",
    },
    {
        "template_id": "pol_no_discriminacion",
        "title": "Politica de No Discriminacion e Igualdad",
        "category": "Politica",
        "description": "Politica de no discriminacion alineada con normativa OIT y derechos fundamentales.",
        "system_prompt": "Redacta una POLITICA DE NO DISCRIMINACION E IGUALDAD aplicable a contratacion, capacitacion, promocion y trato laboral. Cumple Convenios OIT 100 y 111 ratificados por Colombia. Incluye: principios, ambito, criterios prohibidos (raza, genero, orientacion, religion, edad, discapacidad, etc.), mecanismos de denuncia y promocion de la diversidad.",
    },
    {
        "template_id": "pol_seguridad_vial",
        "title": "Politica de Seguridad Vial (PESV)",
        "category": "Politica",
        "description": "Politica del Plan Estrategico de Seguridad Vial - Resolucion 40595/2022.",
        "system_prompt": "Redacta la POLITICA DE SEGURIDAD VIAL PESV alineada con la Resolucion 40595/2022 del Ministerio de Transporte. Incluye: compromiso de la alta direccion, ambito (conductores propios y misionales), principios de seguridad vial, vehiculos, infraestructura vial, atencion victimas. Definir nivel del PESV (Basico/Estandar/Avanzado).",
    },
    {
        "template_id": "pol_emergencias",
        "title": "Politica del Plan de Emergencias y Contingencias",
        "category": "Politica",
        "description": "Politica de respuesta a emergencias - Decreto 1072 Art. 2.2.4.6.25.",
        "system_prompt": "Redacta una POLITICA DEL PLAN DE PREPARACION Y RESPUESTA ANTE EMERGENCIAS Y CONTINGENCIAS. Cumple Art. 2.2.4.6.25 del Dec. 1072/2015. Incluye: compromiso, alcance (sedes y procesos), brigadas de emergencia, simulacros minimos anuales, recursos, comunicacion con organismos externos.",
    },
    # ======= MANUALES =======
    {
        "template_id": "man_sgsst",
        "title": "Manual del Sistema de Gestion SST",
        "category": "Manual",
        "description": "Manual maestro del SG-SST con estructura completa por capitulos.",
        "system_prompt": "Redacta el MANUAL DEL SG-SST con la estructura completa: 1) Introduccion, 2) Alcance y exclusiones, 3) Marco normativo (Dec. 1072 Cap. 6, Res. 0312/2019), 4) Politica SG-SST, 5) Roles y responsabilidades por nivel, 6) Recursos, 7) Identificacion de peligros y valoracion de riesgos (referencia GTC 45), 8) Programas de gestion, 9) Comunicacion y participacion, 10) Auditorias internas, 11) Revision por la direccion, 12) Mejora continua. Indice y referencias.",
    },
    {
        "template_id": "man_funciones_sst",
        "title": "Manual de Funciones y Responsabilidades SST",
        "category": "Manual",
        "description": "Asignacion de responsabilidades SST por cargo. Cumple Art. 2.2.4.6.8.",
        "system_prompt": "Redacta el MANUAL DE FUNCIONES Y RESPONSABILIDADES SST por cargo. Estructura: 1) Representante legal, 2) Responsable del SG-SST (Lider SST), 3) Jefes de area, 4) COPASST, 5) Comite de Convivencia, 6) Brigada de emergencia, 7) Trabajadores, 8) Contratistas, 9) Visitantes. Para cada uno: funciones especificas, autoridad, requisitos minimos, indicadores de gestion. Cumple Art. 2.2.4.6.8 Dec. 1072.",
    },
    {
        "template_id": "man_copasst",
        "title": "Manual de Funcionamiento del COPASST",
        "category": "Manual",
        "description": "Reglamento interno del Comite Paritario de SST - Res. 2013/1986.",
        "system_prompt": "Redacta el MANUAL DE FUNCIONAMIENTO DEL COPASST cumpliendo Resolucion 2013/1986 y Decreto 1295/1994. Incluye: 1) Naturaleza y conformacion (paritaria), 2) Vigencia (2 anos), 3) Funciones (vigilar SG-SST, proponer acciones), 4) Reuniones (minimo mensual con acta), 5) Quorum, 6) Tipos de votacion, 7) Sanciones por inasistencia, 8) Eleccion mediante voto secreto, 9) Comunicacion con la administracion. Tono normativo.",
    },
    {
        "template_id": "man_brigada_emergencia",
        "title": "Manual de la Brigada de Emergencias",
        "category": "Manual",
        "description": "Estructura, funciones y entrenamiento de la brigada de emergencia.",
        "system_prompt": "Redacta el MANUAL DE LA BRIGADA DE EMERGENCIAS. Estructura: 1) Conformacion (brigada de incendios, primeros auxilios, evacuacion), 2) Perfil del brigadista, 3) Funciones por especialidad, 4) Capacitacion (minimo 40 horas iniciales y refuerzos anuales), 5) Equipamiento, 6) Activacion en emergencia, 7) Coordinacion con organismos externos (Bomberos, Cruz Roja, Defensa Civil), 8) Simulacros. Cumple Art. 2.2.4.6.25 Dec. 1072.",
    },
    {
        "template_id": "man_capacitacion",
        "title": "Manual del Programa Anual de Capacitacion SST",
        "category": "Manual",
        "description": "Plan anual de capacitacion en SST por niveles y temas.",
        "system_prompt": "Redacta el MANUAL DEL PROGRAMA ANUAL DE CAPACITACION SST. Estructura: 1) Objetivos, 2) Identificacion de necesidades de capacitacion (por riesgos identificados), 3) Plan anual con cronograma trimestral, 4) Temas obligatorios (induccion SST, riesgos por puesto, uso EPP, primeros auxilios, emergencias, salud mental, riesgo psicosocial, riesgo biomecanico), 5) Modalidades, 6) Evaluacion y registro de asistencia, 7) Indicadores. Cumple Res. 0312 estandar 1.2.2.",
    },
    # ======= PROCEDIMIENTOS =======
    {
        "template_id": "proc_iper",
        "title": "Procedimiento de Identificacion de Peligros y Valoracion de Riesgos",
        "category": "Procedimiento",
        "description": "Procedimiento IPER conforme GTC 45/2012.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE IDENTIFICACION DE PELIGROS, EVALUACION Y VALORACION DE RIESGOS conforme a la GTC 45/2012 y Art. 2.2.4.6.15 Dec. 1072. Estructura: 1) Objetivo, 2) Alcance, 3) Definiciones (peligro, riesgo, ND, NE, NP, NC, NR), 4) Responsabilidades, 5) Metodologia paso a paso (clasificar procesos, identificar peligros, evaluar riesgos, valorar, definir controles), 6) Frecuencia de actualizacion (minimo anual), 7) Registros, 8) Anexos.",
    },
    {
        "template_id": "proc_inspecciones",
        "title": "Procedimiento de Inspecciones de Seguridad",
        "category": "Procedimiento",
        "description": "Procedimiento para inspecciones planeadas y no planeadas.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE INSPECCIONES DE SEGURIDAD (planeadas, no planeadas, especificas). Incluye: tipos de inspeccion, frecuencia (mensuales generales, trimestrales especificas), responsables, metodologia, listas de chequeo, reporte de hallazgos, seguimiento a correcciones. Cumple estandar 4.2 de Res. 0312.",
    },
    {
        "template_id": "proc_invest_incidentes",
        "title": "Procedimiento de Investigacion de Accidentes e Incidentes",
        "category": "Procedimiento",
        "description": "Procedimiento de investigacion conforme Resolucion 1401/2007.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE INVESTIGACION DE INCIDENTES Y ACCIDENTES DE TRABAJO conforme a la Resolucion 1401/2007. Incluye: 1) Equipo investigador, 2) Plazo (15 dias habiles), 3) Metodologia (Arbol de causas o Espina de pescado), 4) Reporte FURAT a ARL en 48 horas, 5) Determinacion de causas inmediatas y basicas, 6) Plan de accion correctivo, 7) Lecciones aprendidas y socializacion.",
    },
    {
        "template_id": "proc_examenes_medicos",
        "title": "Procedimiento de Examenes Medicos Ocupacionales",
        "category": "Procedimiento",
        "description": "Procedimiento para examenes ingreso, periodicos, retiro - Res. 2346/2007.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE EXAMENES MEDICOS OCUPACIONALES conforme Resolucion 2346/2007. Tipos: ingreso, periodicos, retiro, post-incapacidad. Incluye: profesiograma por cargo, IPS aliada, contenido de cada examen, custodia de la historia clinica ocupacional (en la IPS o IL), confidencialidad, recomendaciones laborales, reubicacion. Cumple estandar 3.1 Res. 0312.",
    },
    {
        "template_id": "proc_entrega_epp",
        "title": "Procedimiento de Entrega y Reposicion de EPP",
        "category": "Procedimiento",
        "description": "Procedimiento de gestion de Elementos de Proteccion Personal.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE SELECCION, ENTREGA, USO Y REPOSICION DE EPP. Incluye: matriz de EPP por cargo, criterios de seleccion (norma tecnica), entrega contra firma, capacitacion en uso, inspecciones, reposicion (semestre o por desgaste), control de inventario. Anexar formato de entrega. Cumple Art. 2.2.4.6.24 Dec. 1072.",
    },
    {
        "template_id": "proc_trabajo_alturas",
        "title": "Procedimiento Seguro de Trabajo en Alturas",
        "category": "Procedimiento",
        "description": "Procedimiento para trabajos a partir de 2 metros - Res. 4272/2021.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE TRABAJO SEGURO EN ALTURAS conforme Resolucion 4272/2021. Aplica trabajos > 2 metros. Incluye: 1) Permiso de trabajo en alturas, 2) Certificacion del trabajador (Coordinador, Avanzado, Reentrenamiento), 3) Inspeccion de equipos (arnes, eslingas, lineas de vida), 4) Plan de rescate, 5) ATS, 6) Controles colectivos antes que individuales, 7) Prohibiciones.",
    },
    {
        "template_id": "proc_espacios_confinados",
        "title": "Procedimiento de Trabajo en Espacios Confinados",
        "category": "Procedimiento",
        "description": "Procedimiento para espacios confinados - Resolucion 491/2020.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE TRABAJO EN ESPACIOS CONFINADOS conforme Resolucion 491/2020. Incluye: identificacion de espacios confinados, permiso de trabajo, monitoreo atmosferico (O2, gases, vapores, LEL), ventilacion, vigilante externo, plan de rescate, EPP especifico, capacitacion certificada.",
    },
    {
        "template_id": "proc_trabajo_caliente",
        "title": "Procedimiento de Trabajo en Caliente",
        "category": "Procedimiento",
        "description": "Procedimiento para soldadura, corte y operaciones que generan chispa.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE TRABAJO EN CALIENTE (soldadura, corte oxiacetilenico, esmerilado). Incluye: permiso de trabajo, inspeccion del area (radio 11m libre de combustibles), vigilante de fuego, equipos contra incendio cercanos, ventilacion, EPP especifico (mascara de soldar, guantes, chaqueta cuero), revision posterior 30 minutos.",
    },
    {
        "template_id": "proc_lockout_tagout",
        "title": "Procedimiento de Bloqueo y Etiquetado (LOTO)",
        "category": "Procedimiento",
        "description": "Procedimiento de aislamiento de energias peligrosas.",
        "system_prompt": "Redacta el PROCEDIMIENTO DE BLOQUEO Y ETIQUETADO (LOCKOUT/TAGOUT) para mantenimiento de equipos. Incluye: identificacion de fuentes de energia (electrica, mecanica, hidraulica, neumatica, termica, quimica, gravitacional), pasos del bloqueo (notificar, apagar, aislar, bloquear, disipar energia residual, verificar cero energia), candados personales, etiquetas, levantamiento del bloqueo.",
    },
    {
        "template_id": "proc_emergencias",
        "title": "Plan de Preparacion y Respuesta ante Emergencias",
        "category": "Plan",
        "description": "Plan completo de emergencias por tipo de evento - Art. 2.2.4.6.25.",
        "system_prompt": "Redacta el PLAN DE PREPARACION Y RESPUESTA ANTE EMERGENCIAS Y CONTINGENCIAS por sede. Estructura: 1) Analisis de amenazas y vulnerabilidad (matriz colores), 2) Inventario de recursos (botiquin, extintores, alarma, camillas), 3) Procedimientos especificos por tipo (incendio, sismo, evacuacion, accidente grave, derrame quimico, atentado), 4) Rutas de evacuacion y puntos de encuentro, 5) Cadena de llamadas, 6) Brigada (jefe, lider area, brigadistas), 7) Simulacros (minimo 1 al ano por amenaza), 8) Atencion psicosocial post-emergencia. Cumple Art. 2.2.4.6.25 Dec. 1072.",
    },
    # ======= REGLAMENTOS =======
    {
        "template_id": "reg_higiene_seguridad",
        "title": "Reglamento de Higiene y Seguridad Industrial",
        "category": "Reglamento",
        "description": "Reglamento interno - Resolucion 2400/1979 y Codigo Sustantivo del Trabajo.",
        "system_prompt": "Redacta el REGLAMENTO DE HIGIENE Y SEGURIDAD INDUSTRIAL conforme Resolucion 2400/1979 y Articulos 348 a 352 del CST. Estructura por capitulos: I Identificacion empresa, II Disposiciones generales, III Obligaciones del empleador, IV Obligaciones del trabajador, V Prohibiciones, VI Orden y aseo, VII Higiene en lugares de trabajo, VIII Servicios de higiene, IX Riesgos especificos, X Maquinaria y equipos, XI Examenes medicos, XII Accidentes, XIII Sanciones, XIV Vigencia. Articulos numerados. Linea de firma del representante legal y registro Mintrabajo si aplica.",
    },
    {
        "template_id": "reg_interno_trabajo",
        "title": "Reglamento Interno de Trabajo",
        "category": "Reglamento",
        "description": "Reglamento interno - Codigo Sustantivo del Trabajo Art. 104-125.",
        "system_prompt": "Redacta el REGLAMENTO INTERNO DE TRABAJO segun el Codigo Sustantivo del Trabajo (CST Art. 104 a 125). Estructura clasica: capitulos sobre admision, contrato, jornada laboral, descansos, salarios, prestaciones, obligaciones empleador y trabajador, prohibiciones, faltas y sanciones, mecanismo de quejas, retiro, vigencia.",
    },
    # ======= FORMATOS / REGISTROS =======
    {
        "template_id": "fmt_acta_copasst",
        "title": "Formato de Acta de Reunion COPASST",
        "category": "Formato",
        "description": "Plantilla de acta para reuniones mensuales del COPASST.",
        "system_prompt": "Redacta una PLANTILLA DE ACTA DE REUNION DEL COPASST con campos editables. Incluye: encabezado (acta No., fecha, lugar, hora inicio/fin), asistentes (representantes empleador y trabajadores), agenda (verificacion quorum, lectura acta anterior, seguimiento compromisos, temas nuevos, varios, cierre), desarrollo, compromisos (con responsables y fechas), proxima reunion, firmas. Diseno de tabla.",
    },
    {
        "template_id": "fmt_induccion",
        "title": "Formato de Induccion al SG-SST",
        "category": "Formato",
        "description": "Lista de chequeo y constancia de induccion - Estandar 1.2.1 Res. 0312.",
        "system_prompt": "Redacta un FORMATO DE INDUCCION AL SG-SST con: encabezado (datos del trabajador, fecha ingreso, cargo, area), lista de chequeo de temas cubiertos (politica SG-SST, peligros del cargo, EPP, plan emergencias, COPASST, comite convivencia, derechos y deberes, ARL, EPS, AFP), nombre del facilitador, evaluacion basica, constancia firmada por el trabajador. Cumple estandar 1.2.1 Res. 0312.",
    },
    {
        "template_id": "fmt_inspeccion_epp",
        "title": "Formato de Inspeccion de EPP",
        "category": "Formato",
        "description": "Formato de inspeccion mensual de elementos de proteccion personal.",
        "system_prompt": "Redacta un FORMATO DE INSPECCION DE EPP con: datos del trabajador, cargo, fecha, listado de EPP asignado (casco, gafas, protector auditivo, respirador, guantes, calzado, ropa de trabajo, otros), estado (OK, deteriorado, faltante), observaciones, accion requerida (reposicion, capacitacion), firma del inspector y trabajador.",
    },
    {
        "template_id": "fmt_furat",
        "title": "Formato de Reporte FURAT (Accidente de Trabajo)",
        "category": "Formato",
        "description": "Formulario de reporte de accidente a ARL - Resolucion 156/2005.",
        "system_prompt": "Redacta el FORMATO DE REPORTE DE ACCIDENTE DE TRABAJO (FURAT) conforme Resolucion 156/2005. Campos: I Identificacion empleador y ARL, II Identificacion trabajador, III Informacion del accidente (fecha, hora, lugar, descripcion, agente, mecanismo, parte del cuerpo, tipo de lesion), IV Personas que presenciaron, V Acciones tomadas, VI Observaciones, VII Firma representante legal o jefe inmediato. Tipo formulario llenable.",
    },
    {
        "template_id": "fmt_perm_alturas",
        "title": "Formato Permiso de Trabajo en Alturas",
        "category": "Formato",
        "description": "Permiso especifico para trabajos > 2 metros.",
        "system_prompt": "Redacta el FORMATO DE PERMISO DE TRABAJO EN ALTURAS conforme Res. 4272/2021. Campos: empresa, fecha, sede, area, descripcion del trabajo, altura, certificaciones del trabajador (vigentes), inspeccion del equipo (arnes, eslinga, linea de vida, ancla), inspeccion del area, plan de rescate, ATS asociado, vigencia del permiso, firmas (autorizador, ejecutor, vigia). Lista de chequeo previa.",
    },
    {
        "template_id": "fmt_perm_caliente",
        "title": "Formato Permiso de Trabajo en Caliente",
        "category": "Formato",
        "description": "Permiso para soldadura, corte y trabajos que generan chispa.",
        "system_prompt": "Redacta el FORMATO DE PERMISO DE TRABAJO EN CALIENTE: empresa, fecha, vigencia (max 8 horas), area, descripcion (soldadura, corte, esmerilado), inspeccion previa (combustibles removidos, area aislada, extintor disponible), vigia, EPP, monitoreo de gases si aplica, vigilancia post-trabajo, firmas.",
    },
    {
        "template_id": "fmt_perm_confinados",
        "title": "Formato Permiso de Trabajo en Espacios Confinados",
        "category": "Formato",
        "description": "Permiso para ingreso a espacios confinados.",
        "system_prompt": "Redacta el FORMATO DE PERMISO DE TRABAJO EN ESPACIOS CONFINADOS: identificacion del espacio, descripcion, riesgos, monitoreo atmosferico (O2 19.5-23.5%, LEL <10%, gases toxicos), ventilacion, EPP especifico (mascara, arnes, linea de vida), vigia externo, plan de rescate, equipos comunicacion, autorizacion del responsable.",
    },
    {
        "template_id": "fmt_ats",
        "title": "Formato Analisis de Trabajo Seguro (ATS)",
        "category": "Formato",
        "description": "Formato de analisis pre-tarea de riesgos.",
        "system_prompt": "Redacta el FORMATO DE ANALISIS DE TRABAJO SEGURO (ATS): empresa, fecha, area, tarea, equipo de trabajo, listado paso a paso de la actividad, riesgos identificados por paso, controles preventivos, EPP requerido, firma del equipo y supervisor. Tabla de 3 columnas (paso, riesgo, control).",
    },
    {
        "template_id": "fmt_acta_eleccion_copasst",
        "title": "Formato Acta de Eleccion del COPASST",
        "category": "Formato",
        "description": "Acta de votacion y eleccion del COPASST - Res. 2013/1986.",
        "system_prompt": "Redacta el FORMATO DE ACTA DE ELECCION DEL COPASST conforme Resolucion 2013/1986. Incluye: convocatoria con minimo 8 dias previos, lista de candidatos representantes trabajadores, resultados de votacion secreta, conformacion (paritaria, 2 anos), nombramiento del presidente y secretario, registro Mintrabajo. Lista de asistentes votantes.",
    },
]


CATEGORIES = sorted({t["category"] for t in DOCUMENT_TEMPLATES})


def list_templates(category: str = ""):
    if category:
        return [t for t in DOCUMENT_TEMPLATES if t["category"] == category]
    return DOCUMENT_TEMPLATES


def get_template(template_id: str):
    return next((t for t in DOCUMENT_TEMPLATES if t["template_id"] == template_id), None)
