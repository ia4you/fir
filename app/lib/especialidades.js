import { query } from "../../lib/db";

// TODO(pir): DESCRIPCIONES de abajo es la taxonomía de 17 especialidades de
// EIR (Enfermería) heredada del fork, sin adaptar. No corresponde a ningún
// valor real de `especialidad` que vaya a tener pir-db (aún vacía) — hay que
// redefinirla por completo según el temario oficial del PIR una vez se sepa
// cómo se van a clasificar las preguntas en la ingesta.

// Casos donde la transliteración automática del nombre no da una URL clara
// para SEO (siglas, abreviaturas); el resto se genera con slugify().
// Ninguna de las 17 especialidades EIR actuales lo necesita (verificado al
// definir la taxonomía): slugify() ya da URLs limpias para todas.
const SLUG_OVERRIDES = {};

export function slugify(nombre) {
  if (SLUG_OVERRIDES[nombre]) return SLUG_OVERRIDES[nombre];
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DESCRIPCIONES = {
  "Enfermería Familiar y Comunitaria":
    "Enfermería Familiar y Comunitaria es el bloque con más peso en el EIR, con preguntas sobre atención primaria, promoción y educación para la salud, vacunas y cribados poblacionales. Es habitual que combine calendarios vacunales y programas de salud pública con casos clínicos de seguimiento en consulta.",
  "Enfermería Materno-Infantil / Obstétrico-Ginecológica":
    "Este bloque cubre el embarazo, el parto y el puerperio, la lactancia y la patología ginecológica, con especial peso de los protocolos obstétricos vigentes y la anticoncepción. El EIR suele plantear casos clínicos evolutivos que exigen conocer las guías de seguimiento del embarazo del Ministerio de Sanidad.",
  "Enfermería Pediátrica":
    "Enfermería Pediátrica abarca el desarrollo infantil, la patología neonatal y las particularidades del cuidado del niño y el adolescente. Muchas preguntas exigen adaptar el razonamiento clínico general a las dosis, escalas y protocolos propios de la edad pediátrica.",
  "Cardiovascular y Respiratorio":
    "El bloque Cardiovascular y Respiratorio reúne cardiopatías, arritmias e insuficiencia cardiaca junto con EPOC, asma y ventilación mecánica. El EIR combina interpretación de electrocardiogramas y pruebas funcionales respiratorias con el manejo de enfermería en cada caso.",
  "Bloque Quirúrgico y Perioperatorio":
    "Bloque Quirúrgico y Perioperatorio cubre el quirófano, la anestesia y los cuidados pre y postoperatorios, con especial peso de la esterilización y los protocolos de cirugía segura. Las preguntas suelen centrarse en el papel de la enfermera en cada fase del proceso quirúrgico.",
  "Paciente Crítico, Urgencias y Emergencias":
    "Este bloque reúne el manejo del paciente en estado crítico, la reanimación cardiopulmonar y el triaje en urgencias, con fuerte peso de los protocolos y algoritmos estandarizados. Prioriza el razonamiento rápido y la aplicación de guías internacionales de soporte vital.",
  Farmacología:
    "Farmacología evalúa dosis, vías de administración, efectos adversos e interacciones de los fármacos más relevantes para la práctica enfermera. El EIR suele plantear casos clínicos donde hay que identificar el fármaco implicado o anticipar una complicación farmacológica.",
  "Bioética y Legislación":
    "Bioética y Legislación cubre el contenido de leyes y reales decretos que regulan la profesión (consentimiento informado, eutanasia, protección de datos) y los principios bioéticos como objeto directo de la pregunta. Es un bloque muy protocolizado, donde suele pedirse el contenido literal de la norma.",
  "Salud Mental":
    "Salud Mental evalúa los trastornos psiquiátricos, las adicciones y el manejo psicofarmacológico, junto con la comunicación terapéutica. El EIR incide en el reconocimiento de síntomas y en la elección de la intervención de enfermería más adecuada.",
  "Geriatría y Neurología":
    "Este bloque cubre el cuidado de la persona mayor, las demencias y la patología neurológica como el ictus o el Parkinson. Muchas preguntas se apoyan en escalas de valoración geriátrica y en el razonamiento clínico-topográfico neurológico.",
  "Cuidados Paliativos y Oncología":
    "Cuidados Paliativos y Oncología aborda el manejo del paciente oncológico, el control de síntomas y el acompañamiento en el final de la vida. El EIR incide en el enfoque multidisciplinar y en la valoración integral del sufrimiento del paciente y su familia.",
  "Endocrino y Digestivo":
    "Endocrino y Digestivo reúne la diabetes mellitus, la patología tiroidea y las enfermedades del aparato digestivo y hepatobiliar. Es frecuente encontrar casos clínicos que requieren interpretar analíticas y ajustar la dieta o el tratamiento del paciente.",
  "Gestión, Calidad y Fundamentos de Enfermería":
    "Este bloque cubre los modelos teóricos de enfermería, la taxonomía NANDA-NOC-NIC y las herramientas de gestión de la calidad asistencial como el ciclo PDCA. El EIR suele plantear casos con un diagnóstico enfermero ya formulado que hay que completar o evaluar.",
  "Investigación, Metodología y Epidemiología":
    "Investigación, Metodología y Epidemiología tiene un peso creciente en el EIR, con preguntas sobre diseño de estudios, medidas de frecuencia y de asociación, y la interpretación de pruebas diagnósticas. Exige manejar con soltura conceptos como sensibilidad, especificidad, intervalos de confianza y los distintos tipos de sesgo.",
  "Nefrología y Urología":
    "Nefrología y Urología se centra en la enfermedad renal crónica, la diálisis y la patología del aparato urinario. Requiere un dominio sólido del equilibrio hidroelectrolítico y de los cuidados específicos del paciente en programa de diálisis.",
  "Técnicas de Enfermería y Seguridad del Paciente":
    "Este bloque cubre catéteres, vías y sondajes, la higiene de manos y la prevención de la infección nosocomial. Son preguntas muy técnicas y procedimentales, centradas en la seguridad clínica directa del paciente.",
  "Traumatología y Cuidado de Heridas":
    "Traumatología y Cuidado de Heridas abarca fracturas, inmovilizaciones y el manejo de heridas, quemaduras y úlceras por presión. Las preguntas suelen apoyarse en escalas de valoración de heridas y en el razonamiento sobre el proceso de cicatrización.",
};

export async function getEspecialidadesConConteo() {
  const { rows } = await query(
    `SELECT especialidad, COUNT(*)::int AS total,
            MIN(año)::int AS anio_min, MAX(año)::int AS anio_max
     FROM preguntas
     WHERE especialidad IS NOT NULL
     GROUP BY especialidad
     ORDER BY total DESC`
  );
  return rows.map((r) => ({
    nombre: r.especialidad,
    slug: slugify(r.especialidad),
    total: r.total,
    anioMin: r.anio_min,
    anioMax: r.anio_max,
    descripcion: DESCRIPCIONES[r.especialidad] || "",
  }));
}

// Cifras reales para el marketing copy (hero, metadata, CTAs). Mientras la
// tabla esté vacía, totalPreguntas viene a 0 y cada sitio que lo usa cae a
// un texto de fallback sin cifra en vez de mostrar "0 preguntas".
export async function getTotalPreguntasYEspecialidades() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total_preguntas,
            COUNT(DISTINCT especialidad)::int AS total_especialidades
     FROM preguntas`
  );
  return {
    totalPreguntas: rows[0].total_preguntas,
    totalEspecialidades: rows[0].total_especialidades,
  };
}

export async function getEspecialidadPorSlug(slug) {
  const especialidades = await getEspecialidadesConConteo();
  return especialidades.find((e) => e.slug === slug) || null;
}

export async function getPreguntasMuestra(nombreEspecialidad, limite = 3) {
  const { rows } = await query(
    `SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e
     FROM preguntas
     WHERE especialidad = $1
       AND pregunta !~* '\\y(imagen|imágen|figura|radiografía)\\y'
     ORDER BY id
     LIMIT $2`,
    [nombreEspecialidad, limite]
  );
  return rows;
}

export const PREGUNTAS_POR_PAGINA = 12;

// Listado paginado con TODAS las preguntas de la especialidad (a diferencia
// de getPreguntasMuestra, sin excluir las que referencian una imagen): es la
// fuente del enlazado interno real hacia /preguntas/[especialidad]/[id], para
// que Google pueda rastrear cada pregunta individual desde un <a> real y no
// solo descubrirla vía sitemap.xml.
export async function getPreguntasPaginadas(nombreEspecialidad, pagina = 1) {
  const offset = (pagina - 1) * PREGUNTAS_POR_PAGINA;
  const { rows } = await query(
    `SELECT id, pregunta
     FROM preguntas
     WHERE especialidad = $1
     ORDER BY id
     LIMIT $2 OFFSET $3`,
    [nombreEspecialidad, PREGUNTAS_POR_PAGINA, offset]
  );
  return rows;
}

// Para el enlace "siguiente pregunta" en la página individual: la pregunta
// con id inmediatamente superior dentro de la misma especialidad (o null si
// es la última).
export async function getSiguientePregunta(nombreEspecialidad, idActual) {
  const { rows } = await query(
    `SELECT id FROM preguntas
     WHERE especialidad = $1 AND id > $2
     ORDER BY id
     LIMIT 1`,
    [nombreEspecialidad, idActual]
  );
  return rows[0] || null;
}

// Página pública /preguntas/[especialidad]/[id]: solo devuelve la pregunta
// si su especialidad real corresponde al slug de la URL (evita que
// /preguntas/cardiologia/42 sirva una pregunta de otra especialidad si
// alguien cambia el id a mano).
export async function getPreguntaPublica(especialidadSlug, id) {
  const idNumerico = parseInt(id, 10);
  if (!Number.isInteger(idNumerico)) return null;

  const especialidad = await getEspecialidadPorSlug(especialidadSlug);
  if (!especialidad) return null;

  const { rows } = await query(
    `SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e,
            especialidad, explicacion, imagen_path, año
     FROM preguntas
     WHERE id = $1 AND especialidad = $2`,
    [idNumerico, especialidad.nombre]
  );
  if (rows.length === 0) return null;

  return { ...rows[0], especialidadSlug: especialidad.slug };
}

// Para el sitemap: id + slug de especialidad de todas las preguntas reales.
export async function getTodasLasPreguntasParaSitemap() {
  const { rows } = await query(`SELECT id, especialidad FROM preguntas ORDER BY id`);
  return rows.map((r) => ({ id: r.id, especialidadSlug: slugify(r.especialidad) }));
}
