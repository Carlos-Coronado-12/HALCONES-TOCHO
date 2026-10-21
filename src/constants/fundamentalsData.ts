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
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 60 }, { x: 48, y: 64 }]
  },
  {
    number: 5,
    name: 'Comeback',
    alias: 'Regreso Profundo',
    type: 'out',
    depthYards: '10 a 12 yardas',
    description: 'Ruta profunda por la banda. A las 10-12 yardas, clava el pie y corta a 45 grados de regreso hacia el QB y la línea lateral.',
    keyCoachingPoint: 'Excelente arma contra defensivas en zona o esquineros con colchón profundo (Off-Coverage). El balón debe ser lanzado antes del corte.',
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 46 }, { x: 82, y: 56 }]
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
    pathPoints: [{ x: 50, y: 80 }, { x: 50, y: 50 }, { x: 50, y: 15 }]
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
export const IFAF_QUIZ_QUESTIONS: QuizQuestion[] = [
  // 1. REGLAMENTO IFAF: EL RUSHER
  {
    id: 'ifaf_rush_1',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'Bajo reglamento oficial IFAF 5v5, ¿a qué distancia mínima de la línea de golpeo (LOS) debe alinearse el Rusher para poder presionar al QB?',
    options: [
      'A 5 yardas',
      'A 7 yardas',
      'A 10 yardas',
      'Puede alinearse en la línea si levanta la mano'
    ],
    correctIndex: 1,
    explanation: 'En las reglas oficiales IFAF, el Rusher debe estar colocado a un mínimo de 7 yardas detrás de la línea de golpeo al momento del centro para tener derecho legal a presionar al mariscal.',
    ruleRef: 'Regla IFAF 5v5 - Sec. El Rusher (7 Yard Rule)'
  },
  {
    id: 'ifaf_rush_2',
    category: 'ifaf_rules',
    difficulty: 'intermedio',
    question: '¿Qué debe hacer el Rusher antes del snap para reclamar el "Derecho de Vía libre" (Right of Way) hacia el QB?',
    options: [
      'Gritar "¡RUSH!" en voz alta al árbitro',
      'Levantar una mano por encima de la cabeza al menos 1 segundo antes del snap',
      'Colocarse exactamente detrás del Centro',
      'Tocar el suelo con una mano en postura de 3 puntos'
    ],
    correctIndex: 1,
    explanation: 'El Rusher debe levantar una mano visiblemente por encima de su cabeza al menos 1 segundo antes del centro. Esto le otorga una línea recta despejada hacia el QB que los receptores ofensivos no pueden obstruir.',
    ruleRef: 'Regla IFAF - Right of Way del Rusher'
  },

  // 2. REGLAMENTO IFAF: NO-RUN ZONES
  {
    id: 'ifaf_norun_1',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'En la "Zona de No-Carrera" (No-Run Zone) de la IFAF (a 5 yardas de la zona de anotación), ¿cuál de las siguientes acciones es ILEGAL para la ofensiva?',
    options: [
      'Lanzar un pase hacia adelante a la zona de anotación',
      'Efectuar una entrega directa de mano (handoff) o carrera directa que cruce la línea de golpeo',
      'Hacer un pase completo detrás de la línea de anotación',
      'Lanzar al Centro en una ruta corta'
    ],
    correctIndex: 1,
    explanation: 'Dentro de la No-Run Zone (a 5 yardas de la zona prometida y antes del medio campo), la jugada DEBE ser un pase hacia adelante que cruce la línea de golpeo. Las carreras directas están prohibidas para evitar situaciones de fuerza física.',
    ruleRef: 'Regla IFAF - Restricciones de No-Run Zone'
  },

  // 3. REGLAMENTO IFAF: FUMBLES Y BALÓN MUERTO
  {
    id: 'ifaf_fumble_1',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'Un jugador ofensiva lleva el balón, se le resbala de las manos y cae al césped. ¿Qué señala el árbitro según el reglamento IFAF?',
    options: [
      'Balón libre; la defensa puede recogerlo y regresarlo para anotación',
      'Balón muerto de inmediato en el punto donde el balón tocó el suelo',
      'Incompleto y se repite el down desde la línea de scrimmage',
      'Falta técnica con castigo de 5 yardas'
    ],
    correctIndex: 1,
    explanation: 'En Flag Football IFAF NO existen balones sueltos recuperables (fumbles). Todo balón que toca el césped es declarado balón muerto inmediatamente en el punto donde cayó, finalizando la jugada.',
    ruleRef: 'Regla IFAF - Dead Ball / Fumbles'
  },

  // 4. REGLAMENTO IFAF: FLAG GUARDING Y CONTACTO
  {
    id: 'ifaf_guarding_1',
    category: 'ifaf_rules',
    difficulty: 'intermedio',
    question: '¿Qué constituye la infracción de "Flag Guarding" (Protección de Bandera) en IFAF?',
    options: [
      'Correr a máxima velocidad pegado a la línea lateral',
      'Girar 360 grados sobre tu propio eje (Spin move)',
      'Usar las manos, los brazos o el mismo balón para impedir o desviar el intento del defensa de jalar la cinta',
      'Frenar en seco para que el defensa pase de largo'
    ],
    correctIndex: 2,
    explanation: 'Bajar el brazo, poner el balón sobre la bandera, usar el codo o cubrir con la mano la cinta para impedir el jalón es Flag Guarding. Se penaliza con pérdida de yardas desde el punto de la infracción y pérdida de down.',
    ruleRef: 'Regla IFAF - Flag Guarding & Ball Carrier Infractions'
  },
  {
    id: 'ifaf_jumping_1',
    category: 'ifaf_rules',
    difficulty: 'intermedio',
    question: '¿Se le permite al corredor saltar (diving / jumping) hacia adelante sobre un defensor para ganar el primero y diez o el touchdown?',
    options: [
      'Sí, siempre y cuando no baje el hombro',
      'No; está prohibido brincar o lanzarse hacia un defensor para evitar una tacleada (Diving/Hurdling)',
      'Sí, únicamente en la yarda 1 para anotar',
      'Solo si el balón cruza el plano aéreo'
    ],
    correctIndex: 1,
    explanation: 'El reglamento IFAF prohíbe estrictamente lanzarse (diving) o saltar por encima de los defensas (hurdling) por motivos de seguridad y para preservar la naturaleza sin contacto del deporte.',
    ruleRef: 'Regla IFAF - Conducción del corredor y salto'
  },

  // 5. REGLAMENTO IFAF: RELOJ DEL QB Y TIEMPO DE PASE
  {
    id: 'ifaf_clock_1',
    category: 'ifaf_rules',
    difficulty: 'avanzado',
    question: 'Si la defensiva decide NO enviar a ningún Rusher, ¿cuántos segundos tiene el Quarterback para lanzar el balón antes de que se pite balón muerto?',
    options: [
      '5.0 segundos exactos',
      '7.0 segundos',
      '10.0 segundos',
      'Tiempo ilimitado hasta que encuentre a alguien libre'
    ],
    correctIndex: 1,
    explanation: 'Bajo el reglamento oficial de la IFAF, el QB tiene un límite de 7 segundos para deshacerse del balón. Si no lanza en ese tiempo, la jugada termina como bola muerta en la línea de golpeo y pérdida de down (equivalente a un sack).',
    ruleRef: 'Regla IFAF - 7-Second Pass Clock'
  },

  // 6. REGLAMENTO IFAF: BANDERA CAÍDA ACCIDENTALMENTE
  {
    id: 'ifaf_lostflag_1',
    category: 'ifaf_rules',
    difficulty: 'intermedio',
    question: 'Si la bandera de un receptor se cae al césped accidentalmente mientras corre su ruta y luego atrapa el balón, ¿cómo se le detiene legalmente?',
    options: [
      'El pase se declara automáticamente incompleto',
      'La jugada termina como Touchdown de forma automática',
      'La defensa solo necesita tocarlo con UNA mano entre los hombros y las rodillas (One-hand touch)',
      'La defensa debe tocarlo con AMBAS manos en la cadera'
    ],
    correctIndex: 2,
    explanation: 'Si un jugador no tiene banderas puestas (porque se cayeron solas o fueron jaladas antes del pase), queda "down" en el momento en que un defensor lo toca con al menos una mano.',
    ruleRef: 'Regla IFAF - Inadvertent Deflagging / One-Hand Touch'
  },

  // 7. PUNTOS EXTRAS EN IFAF
  {
    id: 'ifaf_pat_1',
    category: 'ifaf_rules',
    difficulty: 'basico',
    question: 'En un intento de punto extra en tocho IFAF, ¿desde qué yarda se juega para 1 punto y desde cuál para 2 puntos?',
    options: [
      '1 punto desde la yarda 2; 2 puntos desde la yarda 7',
      '1 punto desde la yarda 5 (obligatorio pase); 2 puntos desde la yarda 10 (pase o carrera)',
      '1 punto desde la yarda 10; 2 puntos desde medio campo',
      'Ambos se juegan desde la yarda 5 con jugadas distintas'
    ],
    correctIndex: 1,
    explanation: 'En IFAF 5v5: el punto extra de 1 punto se saca desde la yarda 5 (como está en la No-Run Zone, es pase forzoso). El de 2 puntos se saca desde la yarda 10 (puede ser pase o carrera).',
    ruleRef: 'Regla IFAF - Puntos Extras (Try / PAT)'
  },

  // 8. TÁCTICA Y ÁRBOL DE RUTAS
  {
    id: 'route_slant_1',
    category: 'route_tree',
    difficulty: 'basico',
    question: 'En el árbol numérico oficial de rutas, ¿qué número representa la ruta "SLANT" y qué corte realiza el receptor?',
    options: [
      'Número 1: corte recto hacia la banda',
      'Número 2: 3 pasos verticales y corte a 45 grados hacia el centro',
      'Número 4: freno en seco y regreso hacia el QB',
      'Número 8: quiebre profundo a los postes'
    ],
    correctIndex: 1,
    explanation: 'La ruta 2 es el SLANT clásico: 3 zancadas verticales para congelar las caderas del esquinero y un corte explosivo a 45° cortando el medio del terreno.',
    ruleRef: 'Fundamentos - Árbol de Rutas IFAF'
  },
  {
    id: 'route_out_1',
    category: 'route_tree',
    difficulty: 'intermedio',
    question: '¿Cuál es la principal diferencia técnica entre una ruta 3 (Quick Out) y una ruta 5 (Comeback)?',
    options: [
      'La ruta 3 corta a 90° hacia la banda a 5 yardas; la 5 sube a 10-12 yardas y quiebra a 45° regresando hacia el pasador',
      'La 3 es para el corredor y la 5 es para el receptor X',
      'La ruta 3 va hacia el centro y la 5 va hacia afuera',
      'Son exactamente la misma ruta con distinto nombre'
    ],
    correctIndex: 0,
    explanation: 'El Quick Out (3) es un corte en escuadra plana a 5 yardas. El Comeback (5) vende el pase profundo hasta las 10-12 yardas y rompe en diagonal de regreso hacia el balón protegiendo la línea de banda.',
    ruleRef: 'Fundamentos - Árbol de Rutas IFAF'
  },
  {
    id: 'route_post_corner_1',
    category: 'route_tree',
    difficulty: 'intermedio',
    question: '¿Qué números representan las rutas de POSTE y ESQUINA en el árbol de rutas?',
    options: [
      'Ruta 1 y Ruta 2',
      'Ruta 4 (Post) y Ruta 6 (Corner)',
      'Ruta 8 (Post) y Ruta 7 (Corner)',
      'Ruta 9 (Post) y Ruta 3 (Corner)'
    ],
    correctIndex: 2,
    explanation: 'Los números pares suelen romper adentro (2 Slant, 4 Curl, 6 Dig, 8 Post), y los impares rompen afuera (1 Flat, 3 Out, 5 Comeback, 7 Corner). Por ende, 7 es Corner y 8 es Post.',
    ruleRef: 'Fundamentos - Árbol de Rutas IFAF'
  },

  // 9. COBERTURAS DEFENSIVAS
  {
    id: 'cov_cover2_1',
    category: 'coverage_defense',
    difficulty: 'intermedio',
    question: 'Si la defensa de Halcones o el rival se para en COVER 2, ¿cuál es el punto débil o "hoyo" más evidente para el QB?',
    options: [
      'Las flats cortas laterales a 2 yardas',
      'El centro profundo entre ambos Safeties y la ventana intermedia detrás del Cornerback',
      'La línea de golpeo en el centro',
      'Cover 2 no tiene ningún punto débil'
    ],
    correctIndex: 1,
    explanation: 'En Cover 2, los dos Safeties están separados cubriendo las bandas profundas, dejando un corredor expuesto en el centro del campo (Deep Middle), además de la ventana entre el CB de la flat y el Safety.',
    ruleRef: 'Táctica Defensiva - Análisis Cover 2'
  },
  {
    id: 'cov_blitz_1',
    category: 'coverage_defense',
    difficulty: 'avanzado',
    question: '¿Qué es un "Hot Read" (Lectura Caliente) para el Quarterback cuando la defensa manda Blitz con rusher rápido?',
    options: [
      'Una jugada profunda de más de 20 yardas para ganar el juego',
      'Un pase de escape ultra rápido (como un Slant, Drag o Quick Out) al receptor que ocupa el espacio que dejó desprotegido el defensivo al presionar',
      'Correr hacia atrás para ganar tiempo',
      'Pedir tiempo fuera de inmediato'
    ],
    correctIndex: 1,
    explanation: 'Cuando hay Blitz, no hay tiempo para rutas largas. El QB debe identificar su Hot Read: un pase rápido en menos de 1.5 segundos al espacio libre antes de ser alcanzado por el rusher.',
    ruleRef: 'Táctica Ofensiva - Hot Reads anti-blitz'
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
