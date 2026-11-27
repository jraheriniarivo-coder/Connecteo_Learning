import React, { useEffect, useState } from 'react';
import { X, Upload, Download, Plus, Trash2, FileCode2, Layers } from 'lucide-react';
import type {
  Course,
  CourseModule,
  CourseTheme,
  CourseType,
  QuizQuestion,
  VisibilityMode,
} from '../types';
import {
  generateSampleHtmlCourse,
  parseCourseFromHtml,
  type ParsedHtmlCourse,
} from '../lib/htmlCourseParser';
import { saveCourseResilient } from '../lib/supabase';

interface CourseModalProps {
  open: boolean;
  editingCourse: Course | null;
  createdByName: string;
  onClose: () => void;
  onSaved: (savedCourse: Course | null, action: 'save' | 'save_quit' | 'publish' | 'publish_assign') => Promise<void>;
}

const THEMES: CourseTheme[] = [
  'Management',
  'Communication',
  'Commerciale',
  'Relation client',
  'Soft skills',
];

const VISIBILITY_LABELS: Record<VisibilityMode, string> = {
  assigned_only: 'Affectation uniquement',
  auto_enrollment_with_validation: 'Auto-inscription avec validation',
  unlock_by_progression: 'Déblocage par progression',
  mandatory: 'Obligatoire avec date limite',
};

export const CourseModal: React.FC<CourseModalProps> = ({
  open,
  editingCourse,
  createdByName,
  onClose,
  onSaved,
}) => {
  const [mode, setMode] = useState<'manual' | 'html'>('manual');
  const [editId, setEditId] = useState<number | null>(null);

  // Metadata fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<CourseTheme>('Management');
  const [niveau, setNiveau] = useState<number>(1);
  const [duree, setDuree] = useState('');
  const [type, setType] = useState<CourseType>('obligatoire');
  const [autoInscription, setAutoInscription] = useState(true);
  const [color, setColor] = useState('#00afa9');
  const [syllabusText, setSyllabusText] = useState('');
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('assigned_only');
  const [availabilityDate, setAvailabilityDate] = useState('');

  // Manual modules
  const [modules, setModules] = useState<CourseModule[]>([]);

  // HTML import state
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlFileName, setHtmlFileName] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<ParsedHtmlCourse | null>(null);
  const [allowOverride, setAllowOverride] = useState(false);

  // Feedback
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    setInfoMsg('');
    setAllowOverride(false);

    if (editingCourse) {
      setEditId(editingCourse.id);
      setTitle(editingCourse.title || '');
      setDescription(editingCourse.description || '');
      setTheme((editingCourse.theme as CourseTheme) || 'Management');
      setNiveau(editingCourse.niveau || 1);
      setDuree(editingCourse.duree || '');
      setType(editingCourse.type || 'obligatoire');
      setAutoInscription(
        editingCourse.auto_inscription !== undefined
          ? Boolean(editingCourse.auto_inscription)
          : Boolean(editingCourse.autoInscription)
      );
      setColor(editingCourse.color || '#00afa9');
      setSyllabusText(
        Array.isArray(editingCourse.syllabus) ? editingCourse.syllabus.join('\n') : ''
      );
      setVisibilityMode(editingCourse.visibility_mode || 'assigned_only');
      setAvailabilityDate(editingCourse.availability_date || '');
      setModules(
        editingCourse.modules ? JSON.parse(JSON.stringify(editingCourse.modules)) : []
      );
      setHtmlContent(editingCourse.html_content || null);
      setHtmlFileName(editingCourse.html_content ? 'Fichier HTML existant en base' : '');

      if (editingCourse.html_content && (!editingCourse.modules || editingCourse.modules.length === 0)) {
        setMode('html');
        setParsedPreview(parseCourseFromHtml(editingCourse.html_content, `${editingCourse.title}.html`));
      } else {
        setMode('manual');
        setParsedPreview(null);
      }
    } else {
      setEditId(null);
      setTitle('');
      setDescription('');
      setTheme('Management');
      setNiveau(1);
      setDuree('');
      setType('obligatoire');
      setAutoInscription(true);
      setColor('#00afa9');
      setSyllabusText('');
      setVisibilityMode('assigned_only');
      setAvailabilityDate('');
      setModules([]);
      setHtmlContent(null);
      setHtmlFileName('');
      setParsedPreview(null);
      setMode('manual');
    }
  }, [open, editingCourse]);

  if (!open) return null;

  const handleHtmlFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg('');
    try {
      const content = await file.text();
      const parsed = parseCourseFromHtml(content, file.name);
      setHtmlContent(content);
      setHtmlFileName(file.name);
      setParsedPreview(parsed);

      // Auto-remplit tous les champs sans obliger l'utilisateur à les saisir
      setTitle(parsed.title);
      setDescription(parsed.description);
      setTheme(parsed.theme);
      setNiveau(parsed.niveau);
      setDuree(parsed.duree);
      setType(parsed.type);
      setVisibilityMode(parsed.visibility_mode);
      setAutoInscription(parsed.auto_inscription);
      setColor(parsed.color);
      setSyllabusText(parsed.syllabus.join('\n'));
      setAvailabilityDate(parsed.availability_date || '');
      setInfoMsg(`Métadonnées extraites automatiquement depuis "${file.name}".`);
    } catch {
      setErrorMsg('Impossible de lire ce fichier HTML.');
    }
  };

  const handleDownloadSampleHtml = () => {
    const sample = generateSampleHtmlCourse();
    const blob = new Blob([sample], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele-cours-connecteo.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Modules manipulation helpers
  const addSection = () =>
    setModules((prev) => [...prev, { type: 'section', title: '', content: '' }]);
  const addVideo = () =>
    setModules((prev) => [...prev, { type: 'video', url: '' }]);
  const addQuiz = () =>
    setModules((prev) => [...prev, { type: 'quiz', questions: [] }]);

  const removeModule = (idx: number) =>
    setModules((prev) => prev.filter((_, i) => i !== idx));

  const updateModule = (idx: number, patch: Partial<CourseModule>) =>
    setModules((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));

  const addQuestion = (mIdx: number) => {
    const nextQ: QuizQuestion = {
      type: 'qcm_single',
      question: '',
      options: ['', ''],
      correct: 0,
    };
    setModules((prev) =>
      prev.map((m, i) =>
        i === mIdx ? { ...m, questions: [...(m.questions || []), nextQ] } : m
      )
    );
  };

  const updateQuestion = (mIdx: number, qIdx: number, patch: Partial<QuizQuestion>) => {
    setModules((prev) =>
      prev.map((m, i) => {
        if (i !== mIdx) return m;
        const questions = (m.questions || []).map((q, j) =>
          j === qIdx ? { ...q, ...patch } : q
        );
        return { ...m, questions };
      })
    );
  };

  const removeQuestion = (mIdx: number, qIdx: number) => {
    setModules((prev) =>
      prev.map((m, i) =>
        i === mIdx
          ? { ...m, questions: (m.questions || []).filter((_, j) => j !== qIdx) }
          : m
      )
    );
  };

  const handleSave = async (
    action: 'save' | 'save_quit' | 'publish' | 'publish_assign'
  ) => {
    setErrorMsg('');
    setInfoMsg('');

    if (mode === 'html' && !htmlContent) {
      setErrorMsg('Veuillez sélectionner un fichier HTML pour créer le cours.');
      return;
    }

    const finalTitle = title.trim();
    const finalDescription = description.trim();
    const finalDuree = duree.trim();

    if (mode === 'manual' && (!finalTitle || !finalDescription || !finalDuree)) {
      setErrorMsg('Veuillez renseigner le titre, la description et la durée du cours.');
      return;
    }

    setSaving(true);
    const status = action === 'save' || action === 'save_quit' ? 'draft' : 'published';

    const payload: Record<string, unknown> = {
      title: finalTitle || 'Module HTML',
      description: finalDescription || 'Module interactif HTML',
      theme,
      niveau: Number(niveau) || 1,
      duree: finalDuree || '30 min',
      type,
      auto_inscription: autoInscription,
      color,
      syllabus: syllabusText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      modules: mode === 'html' ? [] : modules,
      status,
      visibility_mode: visibilityMode,
      availability_date: availabilityDate || null,
    };

    if (mode === 'html' && htmlContent) {
      payload.html_content = htmlContent;
    } else if (mode === 'manual' && !htmlContent) {
      payload.html_content = null;
    }

    if (!editId) {
      payload.assigned = false;
      payload.created_by = createdByName || 'Admin';
    }

    const { data, error } = await saveCourseResilient(payload, editId);
    setSaving(false);

    if (error) {
      setErrorMsg(`Erreur lors de l'enregistrement : ${error}`);
      return;
    }

    if (action === 'save' && data?.id) {
      setEditId(data.id);
      setInfoMsg(`Brouillon enregistré à ${new Date().toLocaleTimeString('fr-FR')}.`);
    }

    await onSaved(data, action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d272c]/50 backdrop-blur-[3px] p-4">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl border border-[#dce7e9] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5eeee] flex items-center justify-between bg-[#f8fbfb]">
          <div>
            <h3 className="text-lg font-bold text-[#096475]">
              {editId ? `Modifier le cours : ${title || 'Sans titre'}` : 'Nouveau cours'}
            </h3>
            <p className="text-xs text-[#6f7d81]">
              Choisissez la création guidée ou l&apos;import direct d&apos;un package HTML autonome.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="h-9 w-9 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f7f8] text-[#46575c] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-[#edf3f4] bg-white">
          <div className="inline-flex p-1 rounded-lg bg-[#eef4f5] border border-[#dce7e9]">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'manual'
                  ? 'bg-white text-[#096475] shadow-xs'
                  : 'text-[#66757a] hover:text-[#243238]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Création manuelle</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'html'
                  ? 'bg-white text-[#096475] shadow-xs'
                  : 'text-[#66757a] hover:text-[#243238]'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Import cours HTML</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#fdf2f2] border border-[#f5c6cb] text-sm font-semibold text-[#c0392b]">
              {errorMsg}
            </div>
          )}
          {infoMsg && (
            <div className="p-3.5 rounded-lg bg-[#edf8f7] border border-[#bce5e2] text-sm font-semibold text-[#096475]">
              {infoMsg}
            </div>
          )}

          {/* MODE IMPORT HTML */}
          {mode === 'html' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-[#00afa9] bg-[#f6fbfb] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#096475]">
                      Importer un cours au format HTML
                    </h4>
                    <p className="text-xs text-[#5d6c71] max-w-xl">
                      Aucun formulaire manuel à remplir : le titre, la description, la thématique, le niveau, la durée, la visibilité et le syllabus sont lus directement depuis votre fichier HTML.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleHtml}
                    className="px-3.5 py-2 rounded-lg border border-[#cce1e1] bg-white hover:bg-[#e4f5f4] text-xs font-bold text-[#096475] flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Modèle HTML</span>
                  </button>
                </div>

                <label className="mt-4 flex items-center justify-center gap-2.5 h-12 px-4 rounded-lg border border-[#cfe0e2] bg-white hover:border-[#00afa9] text-sm font-semibold text-[#096475] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>
                    {htmlFileName
                      ? `Fichier chargé : ${htmlFileName}`
                      : 'Sélectionner un fichier .html'}
                  </span>
                  <input
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={(e) => handleHtmlFileSelected(e.target.files?.[0])}
                  />
                </label>
              </div>

              {parsedPreview && (
                <div className="rounded-xl border border-[#dce7e9] bg-[#fbfdfd] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4 border-b border-[#edf3f4] pb-3">
                    <div>
                      <p className="text-xs font-semibold text-[#6f7d81]">
                        Informations extraites du fichier HTML
                      </p>
                      <h4 className="text-base font-bold text-[#096475] mt-0.5">
                        {title || parsedPreview.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono-tabular text-[#096475]">
                      {theme} · Niveau {niveau} · {duree}
                    </span>
                  </div>

                  <p className="text-sm text-[#46575c]">
                    {description || parsedPreview.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-[#5d6c71]">
                    <div>
                      <span className="font-bold text-[#243238]">Type :</span>{' '}
                      {type === 'obligatoire' ? 'Obligatoire' : 'Information'}
                    </div>
                    <div>
                      <span className="font-bold text-[#243238]">Visibilité :</span>{' '}
                      {VISIBILITY_LABELS[visibilityMode]}
                    </div>
                    <div>
                      <span className="font-bold text-[#243238]">Champs détectés :</span>{' '}
                      {parsedPreview.detectedFields.length > 0
                        ? parsedPreview.detectedFields.join(', ')
                        : 'Valeurs par défaut'}
                    </div>
                  </div>

                  {syllabusText.trim() && (
                    <div className="pt-2 border-t border-[#edf3f4]">
                      <p className="text-xs font-bold text-[#243238] mb-1">Syllabus détecté :</p>
                      <ul className="list-disc pl-5 text-xs text-[#46575c] space-y-0.5">
                        {syllabusText
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#096475] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowOverride}
                        onChange={(e) => setAllowOverride(e.target.checked)}
                        className="accent-[#00afa9]"
                      />
                      <span>Ajuster manuellement les métadonnées (optionnel)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHAMPS MÉTADONNÉES (Mode manuel OU ajustement optionnel en mode HTML) */}
          {(mode === 'manual' || allowOverride) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">
                    Titre du cours {mode === 'manual' && '*'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex : Management de proximité"
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm focus:outline-none focus:border-[#00afa9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">
                    Durée {mode === 'manual' && '*'}
                  </label>
                  <input
                    type="text"
                    value={duree}
                    onChange={(e) => setDuree(e.target.value)}
                    placeholder="Ex : 2h ou 45 min"
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm focus:outline-none focus:border-[#00afa9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243238] mb-1">
                  Description {mode === 'manual' && '*'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectifs pédagogiques et contexte du cours..."
                  className="w-full p-3 rounded-lg border border-[#dce7e9] text-sm focus:outline-none focus:border-[#00afa9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">Thématique</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as CourseTheme)}
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm bg-white focus:outline-none focus:border-[#00afa9]"
                  >
                    {THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">Niveau</label>
                  <select
                    value={niveau}
                    onChange={(e) => setNiveau(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm bg-white focus:outline-none focus:border-[#00afa9]"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        Niveau {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CourseType)}
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm bg-white focus:outline-none focus:border-[#00afa9]"
                  >
                    <option value="obligatoire">Obligatoire</option>
                    <option value="information">Information</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">
                    Mode de visibilité
                  </label>
                  <select
                    value={visibilityMode}
                    onChange={(e) => setVisibilityMode(e.target.value as VisibilityMode)}
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm bg-white focus:outline-none focus:border-[#00afa9]"
                  >
                    <option value="assigned_only">
                      Affectation uniquement (assigné par le formateur)
                    </option>
                    <option value="auto_enrollment_with_validation">
                      Auto-inscription avec validation
                    </option>
                    <option value="unlock_by_progression">
                      Déblocage par progression (montée en compétence)
                    </option>
                    <option value="mandatory">Obligatoire avec date limite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#243238] mb-1">
                    Date de disponibilité (optionnel)
                  </label>
                  <input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm bg-white focus:outline-none focus:border-[#00afa9]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#243238] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoInscription}
                    onChange={(e) => setAutoInscription(e.target.checked)}
                    className="accent-[#00afa9]"
                  />
                  <span>Autoriser l&apos;auto-inscription</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#243238]">Couleur</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-9 rounded border border-[#dce7e9] p-0.5 bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243238] mb-1">
                  Syllabus (un point par ligne)
                </label>
                <textarea
                  rows={3}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder={'Rôle et missions du manager\nLes styles de management'}
                  className="w-full p-3 rounded-lg border border-[#dce7e9] text-sm focus:outline-none focus:border-[#00afa9]"
                />
              </div>
            </div>
          )}

          {/* BUILDER MODULES MANUELS */}
          {mode === 'manual' && (
            <div className="pt-4 border-t border-[#e5eeee] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#096475]">Contenu pédagogique</h4>
                  <p className="text-xs text-[#6f7d81]">
                    Structurez le cours avec des sections texte, vidéos et quiz évalués.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-3 py-1.5 rounded-lg border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-xs font-bold text-[#096475] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Section</span>
                  </button>
                  <button
                    type="button"
                    onClick={addVideo}
                    className="px-3 py-1.5 rounded-lg border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-xs font-bold text-[#096475] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Vidéo</span>
                  </button>
                  <button
                    type="button"
                    onClick={addQuiz}
                    className="px-3 py-1.5 rounded-lg border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-xs font-bold text-[#096475] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quiz</span>
                  </button>
                </div>
              </div>

              {modules.length === 0 ? (
                <p className="text-xs text-[#6f7d81] py-4 text-center border border-dashed border-[#dce7e9] rounded-xl">
                  Aucun module ajouté. Utilisez les boutons ci-dessus pour ajouter du contenu.
                </p>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-4 rounded-xl border border-[#dce7e9] bg-[#f8fbfb] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#096475]">
                          {mod.type === 'section'
                            ? `Module ${mIdx + 1} · Section texte`
                            : mod.type === 'video'
                            ? `Module ${mIdx + 1} · Vidéo`
                            : `Module ${mIdx + 1} · Quiz`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeModule(mIdx)}
                          className="text-xs font-semibold text-[#c0392b] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Retirer</span>
                        </button>
                      </div>

                      {mod.type === 'section' && (
                        <div className="space-y-2.5">
                          <input
                            type="text"
                            value={mod.title || ''}
                            onChange={(e) => updateModule(mIdx, { title: e.target.value })}
                            placeholder="Titre de la section"
                            className="w-full h-9 px-3 rounded-lg border border-[#dce7e9] bg-white text-sm"
                          />
                          <textarea
                            rows={3}
                            value={mod.content || ''}
                            onChange={(e) => updateModule(mIdx, { content: e.target.value })}
                            placeholder="Contenu de la section..."
                            className="w-full p-3 rounded-lg border border-[#dce7e9] bg-white text-sm"
                          />
                        </div>
                      )}

                      {mod.type === 'video' && (
                        <input
                          type="text"
                          value={mod.url || ''}
                          onChange={(e) => updateModule(mIdx, { url: e.target.value })}
                          placeholder="URL YouTube, Vimeo ou lien embed"
                          className="w-full h-9 px-3 rounded-lg border border-[#dce7e9] bg-white text-sm"
                        />
                      )}

                      {mod.type === 'quiz' && (
                        <div className="space-y-3">
                          {(mod.questions || []).map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="p-3.5 rounded-lg border border-[#e3ecee] bg-white space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#243238]">
                                  Question {qIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(mIdx, qIdx)}
                                  className="text-xs text-[#c0392b] hover:underline cursor-pointer"
                                >
                                  Supprimer
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <select
                                  value={q.type}
                                  onChange={(e) => {
                                    const nextType = e.target.value as QuizQuestion['type'];
                                    updateQuestion(mIdx, qIdx, {
                                      type: nextType,
                                      options: nextType === 'text' ? [] : q.options.length ? q.options : ['', ''],
                                      correct: nextType === 'qcm_multiple' ? [] : '',
                                    });
                                  }}
                                  className="h-9 px-2.5 rounded-lg border border-[#dce7e9] text-xs bg-white"
                                >
                                  <option value="qcm_single">QCM (choix unique)</option>
                                  <option value="qcm_multiple">QCM (choix multiple)</option>
                                  <option value="text">Réponse libre</option>
                                </select>

                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) =>
                                    updateQuestion(mIdx, qIdx, { question: e.target.value })
                                  }
                                  placeholder="Intitulé de la question"
                                  className="sm:col-span-2 h-9 px-3 rounded-lg border border-[#dce7e9] text-xs"
                                />
                              </div>

                              {q.type !== 'text' ? (
                                <div className="space-y-2 pt-1">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type={q.type === 'qcm_single' ? 'radio' : 'checkbox'}
                                        name={`correct-${mIdx}-${qIdx}`}
                                        checked={
                                          q.type === 'qcm_single'
                                            ? String(q.correct) === String(optIdx)
                                            : Array.isArray(q.correct) && q.correct.includes(optIdx)
                                        }
                                        onChange={() => {
                                          if (q.type === 'qcm_single') {
                                            updateQuestion(mIdx, qIdx, { correct: optIdx });
                                          } else {
                                            const prev = Array.isArray(q.correct) ? q.correct : [];
                                            const next = prev.includes(optIdx)
                                              ? prev.filter((x) => x !== optIdx)
                                              : [...prev, optIdx];
                                            updateQuestion(mIdx, qIdx, { correct: next });
                                          }
                                        }}
                                        title="Marquer comme bonne réponse"
                                        className="accent-[#00afa9]"
                                      />
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const nextOpts = [...q.options];
                                          nextOpts[optIdx] = e.target.value;
                                          updateQuestion(mIdx, qIdx, { options: nextOpts });
                                        }}
                                        placeholder={`Option ${optIdx + 1}`}
                                        className="flex-1 h-8 px-2.5 rounded border border-[#dce7e9] text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextOpts = q.options.filter((_, idx) => idx !== optIdx);
                                          updateQuestion(mIdx, qIdx, { options: nextOpts });
                                        }}
                                        className="text-xs px-2 py-1 text-[#66757a] hover:text-[#c0392b] cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuestion(mIdx, qIdx, { options: [...q.options, ''] })
                                    }
                                    className="text-xs font-semibold text-[#096475] hover:underline cursor-pointer"
                                  >
                                    + Ajouter une option
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={String(q.correct || '')}
                                  onChange={(e) =>
                                    updateQuestion(mIdx, qIdx, { correct: e.target.value })
                                  }
                                  placeholder="Réponse attendue"
                                  className="w-full h-9 px-3 rounded-lg border border-[#dce7e9] text-xs"
                                />
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addQuestion(mIdx)}
                            className="px-3 py-1.5 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f7f8] text-xs font-bold text-[#096475] cursor-pointer"
                          >
                            + Ajouter une question
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#e5eeee] bg-[#f8fbfb] flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-4 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f7f8] text-xs font-bold text-[#46575c] cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('save')}
            className="h-10 px-4 rounded-lg border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-xs font-bold text-[#096475] cursor-pointer"
          >
            Enregistrer brouillon
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('save_quit')}
            className="h-10 px-4 rounded-lg border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-xs font-bold text-[#096475] cursor-pointer"
          >
            Enregistrer et quitter
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('publish')}
            className="h-10 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold cursor-pointer"
          >
            {saving ? 'Enregistrement...' : 'Publier'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('publish_assign')}
            className="h-10 px-4 rounded-lg bg-[#096475] hover:bg-[#064a57] text-white text-xs font-bold cursor-pointer"
          >
            Publier et affecter
          </button>
        </div>
      </div>
    </div>
  );
};
