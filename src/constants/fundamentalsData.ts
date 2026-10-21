import { RouteDefinition, QuizQuestion, CoverageConcept, UserStudyStats } from '../types/study';

/**
 * Catálogo Oficial del Árbol de Rutas (Route Tree 1 - 9 + Rutas Clave de Tocho Bandera)
 * Coordenadas normalizadas sobre una mini-cancha para visualización animada SVG
 */
export const OFFICIAL_ROUTE_TREE: RouteDefinition[] = [
  {
    number: 1,
    name: 'Flat / Arrow',
    alias: 'Flecha / Flat',
    type: 'out',
    depthYards: '3 a 5 yardas',
    description: 'Ruta corta hacia la banda. El receptor corre 3 pasos verticales y quiebra rápidamente en ángulo diagonal hacia la línea lateral para estirar la cobertura horizontal.',
    keyCoachingPoint: 'Atrapa y gira de inmediato hacia la banda; busca asegurar yardas después de la recepción antes de que llegue el Safety.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 70 }, { x: 85, y: 65 }]
  },
  {
    number: 2,
    name: 'Slant',
    alias: 'Diagonal Corta',
    type: 'in',
    depthYards: '3 a 5 yardas',
    description: '3 pasos verticales a fondo para vender la ruta vertical, corte violento con el pie exterior en ángulo de 45° cruzando la cara del esquinero hacia el centro del campo.',
    keyCoachingPoint: 'Cruza delante del defensivo; no permitas que te empuje hacia afuera. Mantén las manos listas para recibir rápido.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 70 }, { x: 15, y: 55 }]
  },
  {
    number: 3,
    name: 'Quick Out',
    alias: 'Escuadra Afuera',
    type: 'out',
    depthYards: '5 yardas',
    description: 'Corte estricto a 90 grados hacia la línea de banda. Se clava el pie interior y se rompe en línea recta hacia la línea lateral.',
    keyCoachingPoint: 'El corte debe ser a 90° exactos; si flotas hacia atrás le das tiempo al CB de anticipar e interceptar.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 66 }, { x: 88, y: 66 }]
  },
  {
    number: 4,
    name: 'Curl / Hitch',
    alias: 'Gancho Corto',
    type: 'stop',
    depthYards: '5 a 7 yardas',
    description: 'Ataque vertical al defensivo a máxima velocidad para obligarlo a retroceder en backpedal, freno en seco y regreso de 1 yarda hacia el quarterback.',
    keyCoachingPoint: 'Frena agresivamente y ven hacia el balón; nunca esperes el pase quieto porque el defensor te arrancará la bandera o bateará.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 58 }, { x: 42, y: 58 }, { x: 38, y: 68 }]
  },
  {
    number: 5,
    name: 'Comeback',
    alias: 'Regreso Profundo',
    type: 'out',
    depthYards: '10 a 12 yardas',
    description: 'Ruta profunda por la banda. A las 10-12 yardas, clava el pie y corta a 45 grados de regreso hacia el QB y la línea lateral.',
    keyCoachingPoint: 'Excelente arma contra defensivas en zona o esquineros con colchón profundo (Off-Coverage). El balón debe ser lanzado antes del corte.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 46 }, { x: 58, y: 46 }, { x: 78, y: 58 }]
  },
  {
    number: 6,
    name: 'Dig / In',
    alias: 'Escuadra Adentro',
    type: 'in',
    depthYards: '10 a 12 yardas',
    description: 'Profundidad intermedia. Se ataca verticalmente hasta 10-12 yardas y se corta limpiamente en ángulo de 90° hacia el centro del campo.',
    keyCoachingPoint: 'Encuentra la ventana vacía entre los Safeties y corre plano sin flotar hacia el fondo.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 46 }, { x: 12, y: 46 }]
  },
  {
    number: 7,
    name: 'Corner / Flag',
    alias: 'Esquina / Bandera',
    type: 'out',
    depthYards: '10 a 12 yardas',
    description: 'Ataca el centro para que el safety se comprometa y a las 10 yardas quiebra a 45° hacia la esquina profunda del terreno de juego.',
    keyCoachingPoint: 'Ruta letal en zona roja y contra Cover 2 en el hueco entre el Esquinero de la flat y el Safety profundo.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 50 }, { x: 86, y: 24 }]
  },
  {
    number: 8,
    name: 'Post',
    alias: 'Poste Central',
    type: 'in',
    depthYards: '10 a 12 yardas',
    description: 'Vende la ruta recta hacia afuera y a las 10-12 yardas quiebra a 45° hacia los postes centrales de gol o el centro profundo del campo.',
    keyCoachingPoint: 'Ataca el espacio central. En tocho 5v5 obliga a los Safeties a dividirse o deja espacio para pases intermedios.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 48 }, { x: 18, y: 22 }]
  },
  {
    number: 9,
    name: 'Go / Fly / Streak',
    alias: 'Pase Bomba / Vertical',
    type: 'vertical',
    depthYards: '15+ yardas (Fondo)',
    description: 'Velocidad pura en línea recta por la banda o por los números para desbordar al defensivo en velocidad.',
    keyCoachingPoint: 'Mantén la separación de la banda (al menos 3 yardas para que haya espacio de atrapar) y ubica el hombro exterior.',
    pathPoints: [{ x: 75, y: 80 }, { x: 75, y: 48 }, { x: 75, y: 16 }]
  },
  {
    number: 0,
    name: 'Pivot / Whip',
    alias: 'Látigo / Finta',
    type: 'special',
    depthYards: '4 a 5 yardas',
    description: 'Inicia como un Slant hacia adentro durante 2 pasos, frena de golpe y regresa en reversa hacia la banda.',
    keyCoachingPoint: 'El engaño debe ser creíble. Muy efectivo en flag football para sacarle los tobillos al esquinero en hombre a hombre.',
    pathPoints: [{ x: 50, y: 80 }, { x: 40, y: 68 }, { x: 75, y: 66 }]
  },
  {
    number: 10,
    name: 'Drag / Shallow',
    alias: 'Cruce Rasante',
    type: 'special',
    depthYards: '2 a 4 yardas',
    description: 'El receptor cruza todo el campo horizontalmente a muy poca profundidad, justo enfrente de la línea de golpeo.',
    keyCoachingPoint: 'Corre a máxima velocidad horizontal; crea interferencias naturales y es el pase de escape perfecto cuando hay Blitz.',
    pathPoints: [{ x: 20, y: 80 }, { x: 25, y: 72 }, { x: 88, y: 70 }]
  },
  {
    number: 11,
    name: 'Wheel',
    alias: 'Rueda / Flanco',
    type: 'special',
    depthYards: '12 a 15 yardas',
    description: 'Ruta típicamente del corredor o receptor interior: sale hacia la banda plano y al llegar a la línea lateral gira vertical hacia el fondo.',
    keyCoachingPoint: 'Toma la espalda del esquinero que bajó a defender la flat. Sorprende a defensas en zona.',
    pathPoints: [{ x: 45, y: 85 }, { x: 75, y: 78 }, { x: 82, y: 25 }]
  }
];

/**
 * Conceptos de Cobertura Defensiva y Lecturas Tácticas
 */
export const DEFENSIVE_COVERAGES_GUIDE: CoverageConcept[] = [
  {
    id: 'cover2',
    name: 'Cover 2 (2 Safeties Profundos)',
    type: 'zone',
    safetiesCount: 2,
    description: '2 Safeties dividen el fondo del campo a la mitad (deep halves). 2 Cornerbacks defienden las flats cortas (línea lateral) y 1 Rusher presiona.',
    strengths: [
      'Excelente contra pases cortos a las bandas y pantallas',
      'Doble protección contra el pase bomba a las esquinas',
      'Fácil lectura para los esquineros'
    ],
    weaknesses: [
      'El centro profundo entre los dos Safeties (el hoyo del Post)',
      'La zona intermedia a la espalda del esquinero (ventana de Corner route)'
    ],
    bestBeaters: ['Smash (Corner + Hitch)', 'Post al centro', 'Flood de tres niveles']
  },
  {
    id: 'cover3',
    name: 'Cover 3 (3 Tercios Profundos)',
    type: 'zone',
    safetiesCount: 1,
    description: '1 Safety central y 2 Esquineros se reparten el fondo en 3 tercios (deep thirds). El centro/linebacker protege la zona intermedia baja.',
    strengths: [
      'Protección máxima contra pases largos y jugadas sorpresa',
      'Cierra las bandas profundas y el poste'
    ],
    weaknesses: [
      'Las flats y laterales cortas quedan desprotegidas',
      'Las zonas intermedias (Curles y Curls en 5-8 yardas)'
    ],
    bestBeaters: ['Quick Outs', 'Flats rápidas', 'Mesh (cruces cortos)', 'Curl-Flat']
  },
  {
    id: 'cover1',
    name: 'Cover 1 (Hombre a Hombre + Safety Libre)',
    type: 'man',
    safetiesCount: 1,
    description: '1 Safety libre profundo patrullando el centro; los otros 3 defensores marcan hombre a hombre (man coverage) pegados al receptor. 1 Rusher.',
    strengths: [
      'Presión inmediata en la línea; no regala yardas fáciles cortas',
      'El Safety ayuda donde vuele el balón profundo'
    ],
    weaknesses: [
      'Vulnerable a fintas dobles (Pivot / Whip, Slant & Go)',
      'Rutas cruzadas como Mesh generan choques y receptores libres'
    ],
    bestBeaters: ['Mesh / Cruces cruzados', 'Pivot / Whip', 'Rutas de opción con cortes secos']
  },
  {
    id: 'blitz_cover0',
    name: 'Cover 0 (Blitz Total / Sin Red de Seguridad)',
    type: 'man',
    safetiesCount: 0,
    description: 'Todos los defensores en hombre a hombre estricto sin ningún Safety en el fondo. Rusher a toda velocidad sobre el QB.',
    strengths: [
      'Fuerza al QB a soltar el balón en menos de 2.0 segundos',
      'Provoca sacks y errores por pánico'
    ],
    weaknesses: [
      'Si un receptor quiebra a su defensor, es Touchdown seguro',
      'No hay nadie en el fondo para detener la jugada'
    ],
    bestBeaters: ['Hot Read inmediato (Slant o Drag)', 'Pase pantalla rápido', 'Fade 1 a 1']
  }
];

/**
 * Banco Oficial de Preguntas - Reglamento IFAF 5v5 Flag Football y Fundamentos Tácticos
 */
/**
 * Banco Oficial de Preguntas - Reglamento IFAF 5v5 Flag Football y Árbol de Rutas
 * Preguntas claras, directas, con opciones equilibradas y diagramas tácticos.
 */
export const IFAF_QUIZ_QUESTIONS: QuizQuestion[] = [
  // ==========================================
  // SECCIÓN 1: IDENTIFICACIÓN VISUAL DE RUTAS (CON DIAGRAMA)
  // ==========================================
  {
    id: 'route_diag_post_8',
    category: 'route_tree',
    difficulty: 'basico',
    question: '¿Qué ruta del árbol numérico representa este diagrama táctico?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 48 }, { x: 18, y: 22 }],
    routeNumber: 8,
    options: [
      'Poste (Post - Ruta 8)',
      'Esquina (Corner - Ruta 7)',
      'Escuadra Adentro (Dig - Ruta 6)',
      'Pase Bomba (Fly - Ruta 9)'
    ],
    correctIndex: 0,
    explanation: 'Es un Poste (Post #8). Corre 10-12 yardas verticales y quiebra en ángulo de 45° hacia los postes centrales de gol.',
    ruleRef: 'Árbol de Rutas - Ruta 8 (Post)'
  },
  {
    id: 'route_diag_corner_7',
    category: 'route_tree',
    difficulty: 'basico',
    question: 'Observa la trayectoria hacia la banda profunda. ¿Cuál es esta ruta?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 50 }, { x: 86, y: 24 }],
    routeNumber: 7,
    options: [
      'Poste (Post - Ruta 8)',
      'Esquina (Corner / Flag - Ruta 7)',
      'Escuadra Afuera (Out - Ruta 3)',
      'Flecha (Flat - Ruta 1)'
    ],
    correctIndex: 1,
    explanation: 'Es una Esquina (Corner #7). Rompe a 45° hacia la esquina profunda del campo atacando la espalda del esquinero.',
    ruleRef: 'Árbol de Rutas - Ruta 7 (Corner)'
  },
  {
    id: 'route_diag_slant_2',
    category: 'route_tree',
    difficulty: 'basico',
    question: '¿Qué ruta rápida al centro muestra este diagrama?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 70 }, { x: 15, y: 55 }],
    routeNumber: 2,
    options: [
      'Quick Out (Ruta 3)',
      'Drag (Cruce corto)',
      'Slant (Diagonal - Ruta 2)',
      'Hitch (Gancho - Ruta 4)'
    ],
    correctIndex: 2,
    explanation: 'Es un Slant (#2). El receptor da 3 zancadas verticales y quiebra a 45° cortando hacia el centro del campo.',
    ruleRef: 'Árbol de Rutas - Ruta 2 (Slant)'
  },
  {
    id: 'route_diag_out_3',
    category: 'route_tree',
    difficulty: 'basico',
    question: 'El receptor corre 5 yardas y corta a 90° hacia la línea de banda. ¿Qué ruta es?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 66 }, { x: 88, y: 66 }],
    routeNumber: 3,
    options: [
      'Quick Out (Escuadra afuera - Ruta 3)',
      'Dig (Escuadra adentro - Ruta 6)',
      'Slant (Diagonal - Ruta 2)',
      'Comeback (Regreso - Ruta 5)'
    ],
    correctIndex: 0,
    explanation: 'Es un Quick Out (#3). Corte estricto en escuadra de 90° hacia la línea lateral para asegurar recepción y salir del reloj.',
    ruleRef: 'Árbol de Rutas - Ruta 3 (Out)'
  },
  {
    id: 'route_diag_curl_4',
    category: 'route_tree',
    difficulty: 'basico',
    question: 'El receptor ataca verticalmente, frena en seco a 5 yardas y regresa hacia el pasador. ¿Qué ruta es?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 58 }, { x: 42, y: 58 }, { x: 38, y: 68 }],
    routeNumber: 4,
    options: [
      'Quick Out (Ruta 3)',
      'Slant (Ruta 2)',
      'Gancho (Hitch / Curl - Ruta 4)',
      'Dig (Ruta 6)'
    ],
    correctIndex: 2,
    explanation: 'Es un Gancho o Curl (#4). Ataca la espalda del defensor, frena agresivamente y da un paso de regreso al QB.',
    ruleRef: 'Árbol de Rutas - Ruta 4 (Curl)'
  },
  {
    id: 'route_diag_dig_6',
    category: 'route_tree',
    difficulty: 'intermedio',
    question: '¿Qué ruta intermedia cruza a 90 grados por el medio del campo a 10-12 yardas?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 46 }, { x: 12, y: 46 }],
    routeNumber: 6,
    options: [
      'Escuadra Afuera (Out - Ruta 3)',
      'Poste (Post - Ruta 8)',
      'Drag (Cruce corto)',
      'Escuadra Adentro (Dig / In - Ruta 6)'
    ],
    correctIndex: 3,
    explanation: 'Es un Dig o In (#6). Ataca a profundidad intermedia (10-12 yds) y rompe en ángulo recto cruzando detrás de los linebackers.',
    ruleRef: 'Árbol de Rutas - Ruta 6 (Dig)'
  },
  {
    id: 'route_diag_fly_9',
    category: 'route_tree',
    difficulty: 'basico',
    question: '¿Qué ruta vertical a fondo por la banda representa este diagrama?',
    routePoints: [{ x: 75, y: 80 }, { x: 75, y: 48 }, { x: 75, y: 16 }],
    routeNumber: 9,
    options: [
      'Pase Bomba (Fly / Go - Ruta 9)',
      'Poste (Post - Ruta 8)',
      'Corner (Ruta 7)',
      'Comeback (Ruta 5)'
    ],
    correctIndex: 0,
    explanation: 'Es un Fly / Go (#9). Velocidad pura en línea recta vertical para desbordar al defensor al fondo de la cancha.',
    ruleRef: 'Árbol de Rutas - Ruta 9 (Go/Fly)'
  },
  {
    id: 'route_diag_comeback_5',
    category: 'route_tree',
    difficulty: 'intermedio',
    question: 'Sube 10-12 yardas a velocidad y rompe en diagonal de regreso hacia el QB y la banda. ¿Qué ruta es?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 46 }, { x: 58, y: 46 }, { x: 78, y: 58 }],
    routeNumber: 5,
    options: [
      'Quick Out (Ruta 3)',
      'Regreso (Comeback - Ruta 5)',
      'Gancho (Curl - Ruta 4)',
      'Poste (Ruta 8)'
    ],
    correctIndex: 1,
    explanation: 'Es un Comeback (#5). Vende el pase largo y clava el pie para regresar 45° hacia el balón y la banda.',
    ruleRef: 'Árbol de Rutas - Ruta 5 (Comeback)'
  },
  {
    id: 'route_diag_flat_1',
    category: 'route_tree',
    difficulty: 'basico',
    question: '¿Qué ruta corta de escape diagonal hacia la banda muestra este diagrama?',
    routePoints: [{ x: 50, y: 80 }, { x: 50, y: 70 }, { x: 85, y: 65 }],
    routeNumber: 1,
    options: [
      'Slant (Ruta 2)',
      'Flecha (Flat / Arrow - Ruta 1)',
      'Quick Out (Ruta 3)',
      'Corner (Ruta 7)'
    ],
    correctIndex: 1,
    explanation: 'Es una Flat o Flecha (#1). Salida rápida a la flat para recibir en carrera cerca de la banda lateral.',
    ruleRef: 'Árbol de Rutas - Ruta 1 (Flat)'
  },
  {
    id: 'route_diag_drag',
    category: 'route_tree',
    difficulty: 'intermedio',
    question: 'El receptor cruza de banda a banda muy cerca de la línea (2-3 yardas). ¿Cómo se llama esta ruta?',
    routePoints: [{ x: 80, y: 80 }, { x: 75, y: 74 }, { x: 15, y: 74 }],
    options: [
      'Slant (Diagonal)',
      'Dig (Escuadra adentro)',
      'Drag (Cruce corto)',
      'Flat (Flecha)'
    ],
    correctIndex: 2,
    explanation: 'Es un Drag. El receptor corre horizontalmente por debajo de los defensivos buscando atrapar en plena carrera.',
    ruleRef: 'Conceptos de Pase - Drag Route'
  },
  {
    id: 'route_diag_wheel',
    category: 'route_tree',
    difficulty: 'intermedio',
    question: 'El jugador simula salir a la banda y luego explota verticalmente pegado a la línea lateral. ¿Qué ruta es?',
    routePoints: [{ x: 50, y: 80 }, { x: 75, y: 75 }, { x: 85, y: 20 }],
    options: [
      'Rueda (Wheel)',
      'Flat corta',
      'Corner profunda',
      'Quick Out'
    ],
    correctIndex: 0,
    explanation: 'Es una Wheel (Rueda). Engaña a la defensa con una salida a la flat y luego acelera verticalmente a fondo.',
    ruleRef: 'Conceptos de Pase - Wheel Route'
  },

  // ==========================================
  // SECCIÓN 2: BASES Y REGLAS DE ORO DEL ÁRBOL
  // ==========================================
  {
    id: 'route_rule_even_odd_1',
    category: 'route_tree',
    difficulty: 'basico',
    question: 'En el árbol de rutas (Route Tree 1 al 9), ¿hacia dónde rompen siempre los números PARES (2, 4, 6, 8)?',
    options: [
      'Hacia adentro (al centro del campo)',
      'Hacia afuera (a la línea de banda)',
      'Siempre en línea recta vertical',
      'Hacia atrás en reversa'
    ],
    correctIndex: 0,
    explanation: 'Regla de oro: los números PARES (Slant 2, Curl 4, Dig 6, Post 8) rompen hacia ADENTRO (el centro del campo).',
    ruleRef: 'Bases del Árbol de Rutas'
  },
  {
    id: 'route_rule_even_odd_2',
    category: 'route_tree',
    difficulty: 'basico',
    question: 'En el árbol de rutas (Route Tree 1 al 9), ¿hacia dónde rompen siempre los números IMPARES (1, 3, 5, 7)?',
    options: [
      'Hacia adentro (al centro del campo)',
      'Hacia afuera (a la línea de banda)',
      'No tienen una dirección fija',
      'Hacia el backfield'
    ],
    correctIndex: 1,
    explanation: 'Regla de oro: los números IMPARES (Flat 1, Out 3, Comeback 5, Corner 7) rompen hacia AFUERA (la línea de banda).',
    ruleRef: 'Bases del Árbol de Rutas'
  },

  // ==========================================
  // SECCIÓN 3: REGLAMENTO OFICIAL IFAF 5V5
  // ==========================================
  {
    id: 'ifaf_rush_dist',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿A cuántas yardas de la línea de golpeo (LOS) debe formarse el Rusher para poder presionar al QB?',
    options: [
      'A 5 yardas',
      'A 7 yardas',
      'A 10 yardas',
      'En la línea de golpeo'
    ],
    correctIndex: 1,
    explanation: 'El Rusher debe estar colocado a un mínimo de 7 yardas detrás de la línea de golpeo al momento del centro para poder cruzar.',
    ruleRef: 'IFAF 5v5 - Regla del Rusher (7 Yardas)'
  },
  {
    id: 'ifaf_rush_hand',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Qué debe hacer el Rusher antes del centro para tener preferencia de paso hacia el QB?',
    options: [
      'Gritar "Rush" al árbitro',
      'Levantar una mano arriba de la cabeza al menos 1 segundo antes',
      'Ponerse en posición de tres puntos',
      'Alinearse frente al centro'
    ],
    correctIndex: 1,
    explanation: 'El Rusher debe levantar una mano visiblemente arriba de su cabeza al menos 1 segundo antes del snap para tener el Right of Way.',
    ruleRef: 'IFAF 5v5 - Derecho de Paso del Rusher'
  },
  {
    id: 'ifaf_qb_clock',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'Si la defensa decide NO mandar Rusher a presionar, ¿cuántos segundos tiene el QB para lanzar el balón?',
    options: [
      '5 segundos',
      '7 segundos',
      '10 segundos',
      'Tiempo ilimitado'
    ],
    correctIndex: 1,
    explanation: 'Si no hay Rusher, el árbitro cuenta 7 segundos. Si el QB no lanza en ese tiempo, se pita bola muerta y pérdida de down (sack).',
    ruleRef: 'IFAF 5v5 - Reloj de Pase de 7 Segundos'
  },
  {
    id: 'ifaf_norun_rule',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'En la "Zona de No-Carrera" (a 5 yardas de la zona de anotación), ¿qué jugada es obligatoria para la ofensiva?',
    options: [
      'Un pase hacia adelante que cruce la línea',
      'Cualquier acarreo del corredor',
      'Un pase lateral detrás de la línea',
      'Un acarreo directo del QB'
    ],
    correctIndex: 0,
    explanation: 'En la No-Run Zone están prohibidas las carreras directas; la jugada DEBE ser un pase hacia adelante que cruce la línea.',
    ruleRef: 'IFAF 5v5 - Restricción No-Run Zone'
  },
  {
    id: 'ifaf_fumble_rule',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'Si al portador del balón se le cae el ovoide al suelo, ¿qué marca el árbitro en Tocho Bandera?',
    options: [
      'Balón libre que cualquiera puede recuperar',
      'Balón muerto de inmediato en el punto donde cayó',
      'Pérdida de posesión automática para el rival',
      'Pase incompleto y se repite la jugada'
    ],
    correctIndex: 1,
    explanation: 'En Tocho Bandera NO hay balones sueltos (fumbles). Todo balón que toca el césped es bola muerta inmediatamente.',
    ruleRef: 'IFAF 5v5 - Bola Muerta / Fumble'
  },
  {
    id: 'ifaf_blocking_contact',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Está permitido que los receptores bloqueen o hagan pantalla física para proteger al corredor?',
    options: [
      'No, cualquier bloqueo o contacto físico es castigo',
      'Sí, con las manos abiertas en el pecho',
      'Sí, solo dentro de las primeras 5 yardas',
      'Sí, siempre y cuando no empujen por la espalda'
    ],
    correctIndex: 0,
    explanation: 'En Tocho Bandera el bloqueo (screening/blocking) está prohibido. Los jugadores deben evitar todo contacto físico.',
    ruleRef: 'IFAF 5v5 - Contacto Ilegal y Bloqueo'
  },
  {
    id: 'ifaf_flag_guarding',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Qué es la falta de "Protección de Bandera" (Flag Guarding)?',
    options: [
      'Bajar la mano, el codo o el balón para tapar las cintas',
      'Frenar en seco sobre la línea de banda',
      'Girar sobre tu propio eje (Spin)',
      'Cambiar el balón de mano'
    ],
    correctIndex: 0,
    explanation: 'Flag Guarding es cuando el corredor usa sus brazos, manos o el ovoide para obstruir o golpear el intento del rival de quitar la cinta.',
    ruleRef: 'IFAF 5v5 - Flag Guarding'
  },
  {
    id: 'ifaf_diving_jumping',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Puede un corredor lanzarse de cabeza (dive) o brincar hacia adelante sobre un defensor para anotar?',
    options: [
      'Sí, siempre que no baje el casco',
      'No, lanzarse o saltar hacia adelante es castigo',
      'Sí, solo en cuarta oportunidad',
      'Sí, si el balón cruza la línea en el aire'
    ],
    correctIndex: 1,
    explanation: 'El reglamento prohíbe aventarse (diving) o brincar hacia adelante (hurdling) para ganar yardas por seguridad de los jugadores.',
    ruleRef: 'IFAF 5v5 - Prohibición de Salto / Diving'
  },
  {
    id: 'ifaf_scoring_td',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Cuántos puntos otorga una anotación de Touchdown en Tocho Bandera?',
    options: [
      '5 puntos',
      '6 puntos',
      '7 puntos',
      '8 puntos'
    ],
    correctIndex: 1,
    explanation: 'El Touchdown vale 6 puntos. Después el equipo elige si intenta punto extra de 1 (desde la yarda 5) o de 2 (desde la yarda 10).',
    ruleRef: 'IFAF 5v5 - Puntuación'
  },
  {
    id: 'ifaf_pat_distances',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'En la jugada de punto extra (conversión), ¿desde qué yardas se juegan 1 punto y 2 puntos?',
    options: [
      '1 punto desde la yarda 5, y 2 puntos desde la yarda 10',
      '1 punto desde la yarda 3, y 2 puntos desde la yarda 7',
      '1 punto desde la yarda 2, y 2 puntos desde la yarda 5',
      'Ambos se juegan desde la yarda 5'
    ],
    correctIndex: 0,
    explanation: 'En reglas IFAF: la conversión de 1 punto se juega desde la yarda 5 (pase forzoso) y la de 2 puntos desde la yarda 10.',
    ruleRef: 'IFAF 5v5 - Puntos Extra'
  },
  {
    id: 'ifaf_reception_feet',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'Para que una recepción sea legal cerca de la línea lateral, ¿cuántos pies debe asentar el receptor dentro del campo?',
    options: [
      'Ambos pies obligatoriamente',
      'Al menos 1 pie con control del balón',
      'Un pie y una rodilla',
      'No importa si cae fuera si atrapó el balón en el aire'
    ],
    correctIndex: 1,
    explanation: 'En Flag Football se requiere al menos UN pie dentro del terreno con posesión controlada del balón antes de tocar la línea exterior.',
    ruleRef: 'IFAF 5v5 - Recepción Legal'
  },
  {
    id: 'ifaf_early_flag_pull',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'Si un defensivo le quita la bandera a un receptor ANTES de que el balón llegue a sus manos, ¿qué se marca?',
    options: [
      'Pase incompleto',
      'Castigo a la defensa por retiro ilegal de bandera',
      'Pase completo automático',
      'Jugada legal sin castigo'
    ],
    correctIndex: 1,
    explanation: 'Quitar la bandera antes de que el jugador atrape el balón es falta defensiva (Illegal Flag Pull) y se penaliza con yardas a favor del ataque.',
    ruleRef: 'IFAF 5v5 - Retiro Ilegal de Bandera'
  },
  {
    id: 'ifaf_safety_points',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Cuántos puntos otorga un Safety a la defensiva y cómo se anota?',
    options: [
      '1 punto al bloquear un pase',
      '2 puntos al jalar la bandera al portador dentro de su propia zona de gol',
      '3 puntos al interceptar en el fondo',
      '6 puntos al recuperar el balón en zona de gol'
    ],
    correctIndex: 1,
    explanation: 'Un Safety vale 2 puntos para la defensa y ocurre si le quitan la bandera al portador dentro de su propia zona de anotación.',
    ruleRef: 'IFAF 5v5 - Safety'
  },
  {
    id: 'ifaf_qb_run_direct',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: '¿Puede el Quarterback correr directamente con el balón tras recibir el centro (sin haber entregado el balón)?',
    options: [
      'Sí, siempre que no haya rusher',
      'No, el QB no puede cruzar la línea corriendo de forma directa',
      'Sí, en cualquier oportunidad',
      'Solo si corre hacia las bandas'
    ],
    correctIndex: 1,
    explanation: 'El QB no puede cruzar la línea de golpeo con una carrera directa. Solo puede correr si entrega el balón a un compañero y este se lo regresa.',
    ruleRef: 'IFAF 5v5 - Restricción de Carrera del QB'
  },

  // ==========================================
  // SECCIÓN 4: COBERTURAS Y LECTURAS DEFENSIVAS
  // ==========================================
  {
    id: 'cov_cover_2_safeties',
    category: 'coverage_defense',
    difficulty: 'basico',
    question: '¿Cuántos profundos (Safeties) cuidan el fondo del campo en una defensiva Cover 2?',
    options: [
      '1 Safety al centro',
      '2 Safeties dividiendo el fondo a la mitad',
      '3 defensores profundos',
      'Ninguno (Cover 0)'
    ],
    correctIndex: 1,
    explanation: 'En Cover 2, dos Safeties protegen las dos mitades profundas del campo, mientras los esquineros cuidan las bandas cortas (flats).',
    ruleRef: 'Esquemas Defensivos - Cover 2'
  },
  {
    id: 'cov_cover_2_weakness',
    category: 'coverage_defense',
    difficulty: 'intermedio',
    question: 'En una defensiva Cover 2 (2 Safeties profundos), ¿cuál es el espacio libre principal para atacar?',
    options: [
      'Las bandas cortas a 2 yardas',
      'El centro profundo entre los dos Safeties (zona de Poste)',
      'Pases detrás de la línea de golpeo',
      'No tiene puntos débiles'
    ],
    correctIndex: 1,
    explanation: 'Como los 2 Safeties se abren a las bandas, el hoyo más grande queda en el centro profundo (deep middle), ideal para la ruta de Poste.',
    ruleRef: 'Lecturas Tácticas - Ataque a Cover 2'
  },
  {
    id: 'cov_cover_3_split',
    category: 'coverage_defense',
    difficulty: 'intermedio',
    question: '¿Cómo se reparte el fondo del campo en una defensiva Cover 3?',
    options: [
      'En 3 tercios profundos (1 Safety al centro y 2 Esquineros en las esquinas)',
      '2 Safeties profundos y 1 en la línea',
      'Todos pegados en marca personal',
      '4 defensores al fondo'
    ],
    correctIndex: 0,
    explanation: 'Cover 3 divide el fondo en 3 tercios iguales: el Safety cuida el centro y los 2 esquineros bajan a cuidar las bandas profundas.',
    ruleRef: 'Esquemas Defensivos - Cover 3'
  },
  {
    id: 'cov_cover_0_blitz',
    category: 'coverage_defense',
    difficulty: 'basico',
    question: '¿Qué caracteriza a una defensiva Cover 0 (Cero)?',
    options: [
      'Marca personal (hombre a hombre) sin ningún Safety libre en el fondo',
      'Todos los jugadores esperando en la zona de gol',
      '2 Safeties cuidando las bandas',
      'Nadie presiona al QB'
    ],
    correctIndex: 0,
    explanation: 'Cover 0 significa cero ayuda profunda. Todos están hombre a hombre pegados a su receptor y envían presión agresiva al QB.',
    ruleRef: 'Esquemas Defensivos - Cover 0'
  }
];

const STATS_STORAGE_KEY = 'halcones_study_user_stats_v1';

export const loadUserStudyStats = (): UserStudyStats => {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error cargando estadísticas de estudio:', e);
  }
  return {
    totalAnswered: 0,
    correctAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    completedPlaybookTests: 0,
    categoryScores: {
      ifaf_rules: { answered: 0, correct: 0 },
      route_tree: { answered: 0, correct: 0 },
      coverage_defense: { answered: 0, correct: 0 },
      playbook_halcones: { answered: 0, correct: 0 }
    }
  };
};

export const saveUserStudyStats = (stats: UserStudyStats): void => {
  try {
    stats.lastStudyDate = new Date().toISOString();
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error guardando estadísticas de estudio:', e);
  }
};
