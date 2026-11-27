import type { CourseTheme, CourseType, VisibilityMode } from '../types';

export interface ParsedHtmlCourse {
  title: string;
  description: string;
  theme: CourseTheme;
  niveau: number;
  duree: string;
  type: CourseType;
  visibility_mode: VisibilityMode;
  auto_inscription: boolean;
  color: string;
  syllabus: string[];
  availability_date: string | null;
  html_content: string;
  detectedFields: string[];
}

const VALID_THEMES: CourseTheme[] = [
  'Management',
  'Communication',
  'Commerciale',
  'Relation client',
  'Soft skills',
];

function normalizeTheme(raw?: string | null): CourseTheme {
  if (!raw) return 'Management';
  const lower = raw.toLowerCase().trim();
  const exact = VALID_THEMES.find((t) => t.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('comm') && !lower.includes('commer')) return 'Communication';
  if (lower.includes('commer') || lower.includes('vent')) return 'Commerciale';
  if (lower.includes('client') || lower.includes('relation')) return 'Relation client';
  if (lower.includes('soft') || lower.includes('savoir')) return 'Soft skills';
  return 'Management';
}

function normalizeVisibility(raw?: string | null): VisibilityMode {
  if (!raw) return 'assigned_only';
  const lower = raw.toLowerCase().trim();
  if (lower === 'auto_enrollment_with_validation' || lower.includes('auto')) {
    return 'auto_enrollment_with_validation';
  }
  if (lower === 'unlock_by_progression' || lower.includes('unlock') || lower.includes('progression')) {
    return 'unlock_by_progression';
  }
  if (lower === 'mandatory' || lower.includes('obligatoire')) {
    return 'mandatory';
  }
  return 'assigned_only';
}

function normalizeType(raw?: string | null): CourseType {
  if (!raw) return 'obligatoire';
  return raw.toLowerCase().includes('info') ? 'information' : 'obligatoire';
}

function normalizeNiveau(raw?: string | number | null): number {
  if (typeof raw === 'number' && raw >= 1 && raw <= 4) return raw;
  const match = String(raw || '').match(/[1-4]/);
  return match ? parseInt(match[0], 10) : 1;
}

export function parseCourseFromHtml(htmlContent: string, fileName = 'module.html'): ParsedHtmlCourse {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const detectedFields: string[] = [];

  // 1. Chercher un bloc JSON dédié <script type="application/json" id="course-metadata">
  let jsonMeta: Record<string, unknown> = {};
  const jsonScript =
    doc.querySelector('script#course-metadata[type="application/json"]') ||
    doc.querySelector('script[data-course-meta]');
  if (jsonScript?.textContent) {
    try {
      jsonMeta = JSON.parse(jsonScript.textContent.trim());
    } catch {
      // Ignore invalid JSON and fall back to meta/DOM
    }
  }

  // Helper pour lire les balises <meta>
  const getMeta = (...names: string[]): string | null => {
    for (const name of names) {
      const el =
        doc.querySelector(`meta[name="${name}"]`) ||
        doc.querySelector(`meta[property="${name}"]`);
      const content = el?.getAttribute('content')?.trim();
      if (content) return content;
    }
    return null;
  };

  // Titre
  const fallbackName = fileName.replace(/\.(html?|HTML?)$/, '').replace(/[-_]+/g, ' ').trim();
  const rawTitle =
    (typeof jsonMeta.title === 'string' && jsonMeta.title.trim()) ||
    getMeta('course:title', 'og:title', 'title') ||
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    fallbackName ||
    'Module HTML importé';
  if (jsonMeta.title || getMeta('course:title', 'og:title') || doc.querySelector('title') || doc.querySelector('h1')) {
    detectedFields.push('Titre');
  }

  // Description
  const firstParagraph = Array.from(doc.querySelectorAll('p'))
    .map((p) => p.textContent?.trim() || '')
    .find((txt) => txt.length > 20);
  const rawDescription =
    (typeof jsonMeta.description === 'string' && jsonMeta.description.trim()) ||
    getMeta('course:description', 'description', 'og:description') ||
    firstParagraph ||
    `Module interactif HTML : ${rawTitle}`;
  if (jsonMeta.description || getMeta('course:description', 'description', 'og:description') || firstParagraph) {
    detectedFields.push('Description');
  }

  // Thématique
  const rawTheme =
    (typeof jsonMeta.theme === 'string' && jsonMeta.theme) ||
    getMeta('course:theme', 'theme', 'category', 'course:category');
  if (rawTheme) detectedFields.push('Thématique');
  const theme = normalizeTheme(rawTheme || `${rawTitle} ${rawDescription}`);

  // Niveau
  const rawNiveau =
    (jsonMeta.niveau as string | number | undefined) ??
    (jsonMeta.level as string | number | undefined) ??
    getMeta('course:niveau', 'course:level', 'level');
  if (rawNiveau !== undefined && rawNiveau !== null) detectedFields.push('Niveau');
  const niveau = normalizeNiveau(rawNiveau);

  // Durée
  const bodyDurationMatch = doc.body?.textContent?.match(/\b(\d+\s*(?:h(?:\s*\d+)?|min(?:utes?)?|mn))\b/i);
  const rawDuree =
    (typeof jsonMeta.duree === 'string' && jsonMeta.duree.trim()) ||
    (typeof jsonMeta.duration === 'string' && jsonMeta.duration.trim()) ||
    getMeta('course:duree', 'course:duration', 'duration') ||
    bodyDurationMatch?.[1] ||
    '30 min';
  if (jsonMeta.duree || jsonMeta.duration || getMeta('course:duree', 'course:duration', 'duration') || bodyDurationMatch) {
    detectedFields.push('Durée');
  }

  // Type
  const rawType =
    (typeof jsonMeta.type === 'string' && jsonMeta.type) ||
    getMeta('course:type');
  if (rawType) detectedFields.push('Type');
  const type = normalizeType(rawType);

  // Mode de visibilité
  const rawVisibility =
    (typeof jsonMeta.visibility_mode === 'string' && jsonMeta.visibility_mode) ||
    getMeta('course:visibility', 'course:visibility_mode');
  if (rawVisibility) detectedFields.push('Visibilité');
  const visibility_mode = normalizeVisibility(rawVisibility);

  // Couleur
  const rawColor =
    (typeof jsonMeta.color === 'string' && jsonMeta.color) ||
    getMeta('course:color', 'theme-color') ||
    '#00afa9';
  const color = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : '#00afa9';

  // Syllabus
  let syllabus: string[] = [];
  if (Array.isArray(jsonMeta.syllabus)) {
    syllabus = jsonMeta.syllabus.map((s) => String(s).trim()).filter(Boolean);
  } else {
    const metaSyllabus = getMeta('course:syllabus');
    if (metaSyllabus) {
      syllabus = metaSyllabus
        .split(/[|;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      const domSyllabus = Array.from(
        doc.querySelectorAll('[data-syllabus] li, .syllabus li, section h2, main h2')
      )
        .map((el) => el.textContent?.trim() || '')
        .filter((txt) => txt.length > 2 && txt.length < 120)
        .slice(0, 8);
      syllabus = domSyllabus;
    }
  }
  if (syllabus.length > 0) detectedFields.push('Syllabus');

  const auto_inscription =
    typeof jsonMeta.auto_inscription === 'boolean'
      ? jsonMeta.auto_inscription
      : visibility_mode === 'auto_enrollment_with_validation';

  const availability_date =
    (typeof jsonMeta.availability_date === 'string' && jsonMeta.availability_date) ||
    getMeta('course:availability_date') ||
    null;

  return {
    title: rawTitle,
    description: rawDescription,
    theme,
    niveau,
    duree: rawDuree,
    type,
    visibility_mode,
    auto_inscription,
    color,
    syllabus,
    availability_date,
    html_content: htmlContent,
    detectedFields,
  };
}

export function generateSampleHtmlCourse(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Communication assertive en équipe</title>
  <meta name="description" content="Maîtriser les techniques d'écoute active et de feedback constructif au quotidien." />
  <meta name="course:theme" content="Communication" />
  <meta name="course:niveau" content="2" />
  <meta name="course:duree" content="45 min" />
  <meta name="course:type" content="obligatoire" />
  <meta name="course:visibility" content="auto_enrollment_with_validation" />
  <meta name="course:color" content="#00afa9" />
  <meta name="course:syllabus" content="Les bases de l'écoute active | Formuler un feedback structuré | Gérer les objections avec calme" />
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f4f7f8; color: #1f2d32; }
    .card { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 14px; padding: 36px; border: 1px solid #dce7e9; }
    h1 { color: #096475; margin-top: 0; }
    button { background: #00afa9; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem; }
    button:hover { background: #096475; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Communication assertive en équipe</h1>
    <p>Maîtriser les techniques d'écoute active et de feedback constructif au quotidien.</p>
    <h2>1. Les bases de l'écoute active</h2>
    <p>Reformuler, questionner de manière ouverte et valider la compréhension mutuelle.</p>
    <h2>2. Formuler un feedback structuré</h2>
    <p>Utiliser la méthode DESC : Décrire, Exprimer, Spécifier, Conclure.</p>
    <p style="margin-top: 28px;">
      <button onclick="completeModule()">Valider et terminer le module</button>
    </p>
  </main>
  <script>
    function completeModule() {
      window.parent.postMessage({ type: 'COURSE_COMPLETED', score: 100 }, '*');
    }
  </script>
</body>
</html>`;
}
