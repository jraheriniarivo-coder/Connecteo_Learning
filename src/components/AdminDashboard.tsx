import React, { useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Pencil,
  Users,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import type {
  Course,
  EnrollmentGroup,
  Profile,
  ProgressRecord,
} from '../types';
import { STATIC_FILES_EXPORT } from '../lib/staticSiteExport';

export type AdminTab = 'global' | 'cours' | 'utilisateurs' | 'resultats' | 'code';

interface AdminDashboardProps {
  activeTab: AdminTab;
  courses: Course[];
  groups: EnrollmentGroup[];
  profiles: Profile[];
  progressList: ProgressRecord[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onPreviewCourse: (course: Course) => void;
  onAssignCourse: (course: Course) => void;
  onOpenSessions: (course: Course) => void;
  onDeleteCourse: (courseId: number) => Promise<void>;
  onImportUsersCsv: (rows: Array<Record<string, string>>) => Promise<{ count: number; error?: string }>;
  onDeleteProfile: (id: string) => Promise<void>;
  onDeleteAllProfiles: () => Promise<void>;
}

const THEMES = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
const THEME_COLORS = ['#00afa9', '#096475', '#ffa900', '#7200a9', '#8bbec0'];

const VISIBILITY_LABELS: Record<string, string> = {
  assigned_only: 'Affectation uniquement',
  auto_enrollment_with_validation: 'Auto-inscription validée',
  unlock_by_progression: 'Déblocage par progression',
  mandatory: 'Obligatoire avec échéance',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  courses,
  groups,
  profiles,
  progressList,
  onAddCourse,
  onEditCourse,
  onPreviewCourse,
  onAssignCourse,
  onOpenSessions,
  onDeleteCourse,
  onImportUsersCsv,
  onDeleteProfile,
  onDeleteAllProfiles,
}) => {
  // Course filters
  const [filterTheme, setFilterTheme] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterDuree, setFilterDuree] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<number | null>(null);

  // User filters & CSV import
  const [profileSearch, setProfileSearch] = useState('');
  const [profileBu, setProfileBu] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'loading' | 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteAllUsers, setConfirmDeleteAllUsers] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Results filter
  const [filterResultCourseId, setFilterResultCourseId] = useState('');

  // Code maintenance tab
  const [selectedExportIdx, setSelectedExportIdx] = useState(0);
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);

  // Derived Global KPIs
  const totalTargeted = useMemo(
    () => groups.reduce((acc, g) => acc + g.participants.length, 0),
    [groups]
  );
  const totalCompleted = useMemo(
    () => progressList.filter((p) => p.completed).length,
    [progressList]
  );
  const avgCompletion = useMemo(() => {
    if (totalTargeted > 0) {
      return Math.min(100, Math.round((totalCompleted / totalTargeted) * 100));
    }
    return 0;
  }, [totalTargeted, totalCompleted]);

  const themeBreakdown = useMemo(() => {
    const total = courses.length || 1;
    let offset = 0;
    return THEMES.map((t, idx) => {
      const count = courses.filter((c) => c.theme === t).length;
      const pct = (count / total) * 100;
      const item = { theme: t, count, pct, offset, color: THEME_COLORS[idx] };
      offset += pct;
      return item;
    });
  }, [courses]);

  const visibilityRows = useMemo(() => {
    return Object.entries(VISIBILITY_LABELS)
      .map(([mode, label]) => {
        const modeCourses = courses.filter(
          (c) => (c.visibility_mode || 'assigned_only') === mode
        );
        const courseIds = new Set(modeCourses.map((c) => c.id));
        const targeted = groups
          .filter((g) => courseIds.has(g.coursId))
          .reduce((sum, g) => sum + g.participants.length, 0);
        const completed = progressList.filter(
          (p) => courseIds.has(p.course_id) && p.completed
        ).length;
        const rate =
          targeted > 0
            ? Math.round((completed / targeted) * 100)
            : completed > 0
            ? 100
            : null;
        return { mode, label, count: modeCourses.length, targeted, completed, rate };
      })
      .filter((r) => r.count > 0);
  }, [courses, groups, progressList]);

  // Filtered Courses
  const uniqueThemes = useMemo(
    () => Array.from(new Set(courses.map((c) => c.theme).filter(Boolean))).sort(),
    [courses]
  );
  const uniqueTitles = useMemo(
    () => Array.from(new Set(courses.map((c) => c.title).filter(Boolean))).sort(),
    [courses]
  );
  const uniqueDurees = useMemo(
    () => Array.from(new Set(courses.map((c) => c.duree).filter(Boolean))).sort(),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (filterTheme && c.theme !== filterTheme) return false;
      if (filterTitle && c.title !== filterTitle) return false;
      if (filterNiveau && String(c.niveau) !== filterNiveau) return false;
      if (filterDuree && c.duree !== filterDuree) return false;
      if (filterType && c.type !== filterType) return false;
      const sessionCount = groups.filter((g) => g.coursId === c.id).length;
      if (filterSession === 'with' && sessionCount === 0) return false;
      if (filterSession === 'without' && sessionCount > 0) return false;
      return true;
    });
  }, [courses, groups, filterTheme, filterTitle, filterNiveau, filterDuree, filterType, filterSession]);

  // Filtered Profiles
  const uniqueBus = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.bu).filter(Boolean) as string[])).sort(),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase();
    return profiles.filter((p) => {
      const matchText =
        !q ||
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q) ||
        (p.matricule || '').toLowerCase().includes(q);
      const matchBu = !profileBu || p.bu === profileBu;
      const matchRole = !profileRole || (p.role || '').toLowerCase() === profileRole;
      return matchText && matchBu && matchRole;
    });
  }, [profiles, profileSearch, profileBu, profileRole]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    if (!filterResultCourseId) return progressList;
    return progressList.filter((r) => String(r.course_id) === String(filterResultCourseId));
  }, [progressList, filterResultCourseId]);

  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus({ type: 'loading', text: 'Lecture du fichier CSV...' });
    try {
      const text = await file.text();
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) throw new Error('Le fichier CSV est vide.');

      const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
      const headers = lines[0]
        .split(sep)
        .map((h) => h.trim().toLowerCase().replace(/^\ufeff/, ''));

      const rows: Array<Record<string, string>> = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx] || '';
        });
        row.role = (row.role || 'apprenant').toLowerCase();
        row.username = (row.username || '').trim();
        row.full_name = (row.full_name || '').trim();
        if (row.username) rows.push(row);
      }

      setImportStatus({ type: 'loading', text: `Import de ${rows.length} utilisateur(s)...` });
      const res = await onImportUsersCsv(rows);
      if (res.error) {
        setImportStatus({ type: 'error', text: `Erreur : ${res.error}` });
      } else {
        setImportStatus({ type: 'success', text: `${res.count} utilisateur(s) importé(s) avec succès.` });
      }
    } catch (err) {
      setImportStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur de lecture CSV.',
      });
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const handleExportResultsCsv = () => {
    const now = new Date();
    const rows: string[][] = [
      [`RAPPORT DE FORMATION - Export du ${now.toLocaleString('fr-FR')}`],
      [],
      ['Nom', 'Matricule', 'BU', 'Fonction', 'Cours', 'Thématique', 'Statut', 'Score', 'Date de complétion'],
    ];

    filteredResults.forEach((r) => {
      const prof = profiles.find((p) => p.id === r.user_id || p.username === r.user_id);
      const course = courses.find((c) => c.id === r.course_id);
      rows.push([
        prof?.full_name || prof?.username || r.user_id,
        prof?.matricule || '',
        prof?.bu || '',
        prof?.fonction || '',
        course?.title || `Cours #${r.course_id}`,
        course?.theme || '',
        r.completed ? 'Terminé' : 'En cours',
        r.score != null ? `${r.score}%` : '—',
        r.completed_at ? new Date(r.completed_at).toLocaleString('fr-FR') : '—',
      ]);
    });

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_formations_${now.toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async (filename: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFilename(filename);
      setTimeout(() => setCopiedFilename(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadCode = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\s*\(.*\)$/, '');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* VUE GLOBALE */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#096475]">
              Tableau de bord global
            </h1>
            <p className="text-sm text-[#66757a] mt-1">
              Vue consolidée du catalogue, des cohortes et de la complétion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Total cours</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {courses.length}
              </p>
              <p className="text-xs text-[#748186] mt-1 tabular-nums">
                {courses.filter((c) => c.status === 'published').length} publié(s)
              </p>
            </div>

            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Groupes actifs</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {groups.length}
              </p>
              <p className="text-xs text-[#748186] mt-1 tabular-nums">
                {totalTargeted} affectation(s)
              </p>
            </div>

            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Complétion moyenne</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {avgCompletion}%
              </p>
              <p className="text-xs text-[#748186] mt-1 tabular-nums">
                {totalCompleted} validation(s) enregistrée(s)
              </p>
            </div>

            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Utilisateurs enregistrés</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {profiles.length}
              </p>
              <p className="text-xs text-[#748186] mt-1 tabular-nums">
                {profiles.filter((p) => p.role !== 'admin').length} apprenant(s)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Répartition par thématique */}
            <div className="lg:col-span-5 bg-white border border-[#dce7e9] rounded-xl p-6 space-y-5">
              <h2 className="text-base font-bold text-[#096475]">
                Répartition par thématique
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <svg viewBox="0 0 36 36" className="w-40 h-40 shrink-0 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#edf3f4"
                    strokeWidth="5"
                  />
                  {courses.length > 0 &&
                    themeBreakdown.map((item) =>
                      item.count > 0 ? (
                        <circle
                          key={item.theme}
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="5"
                          strokeDasharray={`${(item.pct * 87.96) / 100} 87.96`}
                          strokeDashoffset={-((item.offset * 87.96) / 100)}
                        />
                      ) : null
                    )}
                </svg>

                <div className="flex-1 w-full space-y-2.5">
                  {themeBreakdown.map((item) => (
                    <div
                      key={item.theme}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-[#243238] truncate">
                          {item.theme}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-[#5d6c71] shrink-0">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Récapitulatif par mode de visibilité */}
            <div className="lg:col-span-7 bg-white border border-[#dce7e9] rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-[#096475]">
                Récapitulatif par type de visibilité
              </h2>

              <div className="overflow-x-auto border border-[#e4ecee] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#edf7f6] text-[#096475] border-b border-[#dce8e9]">
                      <th className="py-2.5 px-3.5 font-bold">Type</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Cours</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Ciblés</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Terminés</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibilityRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#6f7d81]">
                          Aucun cours disponible.
                        </td>
                      </tr>
                    ) : (
                      visibilityRows.map((row) => (
                        <tr
                          key={row.mode}
                          className="border-b border-[#edf3f4] last:border-0"
                        >
                          <td className="py-2.5 px-3.5 font-semibold text-[#243238]">
                            {row.label}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono-tabular">
                            {row.count}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono-tabular">
                            {row.targeted > 0 ? row.targeted : '—'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono-tabular">
                            {row.completed}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono-tabular font-bold text-[#096475]">
                            {row.rate != null ? `${row.rate}%` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Progression par cours */}
          <div className="bg-white border border-[#dce7e9] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#096475]">
              Complétion par formation
            </h2>
            {courses.length === 0 ? (
              <p className="text-sm text-[#6f7d81]">Aucun cours enregistré.</p>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 12).map((c) => {
                  const targeted = groups
                    .filter((g) => g.coursId === c.id)
                    .reduce((s, g) => s + g.participants.length, 0);
                  const completed = progressList.filter(
                    (p) => p.course_id === c.id && p.completed
                  ).length;
                  const pct =
                    targeted > 0
                      ? Math.min(100, Math.round((completed / targeted) * 100))
                      : completed > 0
                      ? 100
                      : 0;
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#243238] truncate pr-4">
                          {c.title}
                        </span>
                        <span className="font-mono-tabular text-[#5d6c71] shrink-0">
                          {completed} terminé(s) · {pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#edf3f4] overflow-hidden">
                        <div
                          className="h-full bg-[#00afa9] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GESTION DES COURS */}
      {activeTab === 'cours' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#096475]">
                Gestion des cours
              </h1>
              <p className="text-sm text-[#66757a] mt-0.5">
                Créez un cours manuellement ou importez directement un module HTML autonome.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddCourse}
              className="h-10 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un cours</span>
            </button>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl p-4 flex flex-wrap items-center gap-2.5">
            <select
              value={filterTheme}
              onChange={(e) => setFilterTheme(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Toutes les thématiques</option>
              {uniqueThemes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white max-w-[200px]"
            >
              <option value="">Tous les titres</option>
              {uniqueTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filterNiveau}
              onChange={(e) => setFilterNiveau(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Tous les niveaux</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={String(n)}>
                  Niveau {n}
                </option>
              ))}
            </select>

            <select
              value={filterDuree}
              onChange={(e) => setFilterDuree(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Toutes les durées</option>
              {uniqueDurees.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Tous les types</option>
              <option value="obligatoire">Obligatoire</option>
              <option value="information">Information</option>
            </select>

            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Toutes les sessions</option>
              <option value="with">Avec session(s)</option>
              <option value="without">Sans session</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setFilterTheme('');
                setFilterTitle('');
                setFilterNiveau('');
                setFilterDuree('');
                setFilterType('');
                setFilterSession('');
              }}
              className="h-9 px-3 rounded-lg border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-xs font-bold text-[#096475] cursor-pointer"
            >
              Réinitialiser
            </button>

            <span className="ml-auto text-xs font-bold text-[#096475] tabular-nums">
              {filteredCourses.length} / {courses.length} cours
            </span>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#edf7f6] text-[#096475] border-b border-[#dce8e9]">
                    <th className="py-3 px-4 font-bold">Thématique</th>
                    <th className="py-3 px-4 font-bold">Titre &amp; statut</th>
                    <th className="py-3 px-4 font-bold">Format</th>
                    <th className="py-3 px-4 font-bold text-center">Niveau</th>
                    <th className="py-3 px-4 font-bold">Durée</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold text-center">Sessions</th>
                    <th className="py-3 px-4 font-bold text-center">Terminés</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#6f7d81]">
                        Aucun cours trouvé. Cliquez sur &laquo; Ajouter un cours &raquo; pour commencer.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => {
                      const sessionCount = groups.filter((g) => g.coursId === course.id).length;
                      const completedCount = progressList.filter(
                        (p) => p.course_id === course.id && p.completed
                      ).length;
                      const isHtml = Boolean(course.html_content);

                      return (
                        <tr
                          key={course.id}
                          className="border-b border-[#edf3f4] last:border-0 hover:bg-[#f8fbfb]"
                        >
                          <td className="py-3 px-4 font-medium text-[#5d6c71]">
                            {course.theme}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#243238]">{course.title}</div>
                            <div className="text-[11px] text-[#6f7d81]">
                              {course.status === 'published'
                                ? 'Publié'
                                : course.status === 'editing'
                                ? 'En édition'
                                : 'Brouillon'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#5d6c71]">
                            {isHtml ? 'HTML autonome' : 'Modules'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono-tabular">
                            {course.niveau}
                          </td>
                          <td className="py-3 px-4 font-mono-tabular text-[#5d6c71]">
                            {course.duree}
                          </td>
                          <td className="py-3 px-4 text-[#5d6c71]">
                            {course.type === 'obligatoire' ? 'Obligatoire' : 'Information'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenSessions(course)}
                              className="font-mono-tabular font-bold text-[#7200a9] underline cursor-pointer"
                            >
                              {sessionCount}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center font-mono-tabular font-bold text-[#096475]">
                            {completedCount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onPreviewCourse(course)}
                                title="Aperçu du cours"
                                className="h-8 px-2.5 rounded-md border border-[#dce7e9] bg-white hover:bg-[#f4f7f8] text-[#096475] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Aperçu</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditCourse(course)}
                                title="Modifier"
                                className="h-8 px-2.5 rounded-md bg-[#00afa9] hover:bg-[#096475] text-white font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Modifier</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onAssignCourse(course)}
                                title="Affecter"
                                className="h-8 px-2.5 rounded-md border border-[#d6ecea] bg-[#edf7f6] hover:bg-[#dff2f0] text-[#096475] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Affecter</span>
                              </button>

                              {confirmDeleteCourseId === course.id ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onDeleteCourse(course.id);
                                    setConfirmDeleteCourseId(null);
                                  }}
                                  className="h-8 px-2.5 rounded-md bg-[#c0392b] text-white font-bold cursor-pointer"
                                >
                                  Confirmer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCourseId(course.id)}
                                  title="Supprimer"
                                  className="h-8 w-8 rounded-md border border-[#f2d0cd] bg-[#fdf2f2] hover:bg-[#c0392b] hover:text-white text-[#c0392b] flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* UTILISATEURS */}
      {activeTab === 'utilisateurs' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#096475]">
                Gestion des utilisateurs
              </h1>
              <p className="text-sm text-[#66757a] mt-0.5">
                Importez vos collaborateurs au format CSV et gérez les profils.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvChange}
              />
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="h-10 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Importer CSV</span>
              </button>
              {confirmDeleteAllUsers ? (
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteAllProfiles();
                    setConfirmDeleteAllUsers(false);
                  }}
                  className="h-10 px-4 rounded-lg bg-[#c0392b] text-white text-xs font-bold cursor-pointer"
                >
                  Confirmer la suppression totale
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAllUsers(true)}
                  className="h-10 px-4 rounded-lg border border-[#f2d0cd] bg-[#fdf2f2] hover:bg-[#c0392b] hover:text-white text-[#c0392b] text-xs font-bold cursor-pointer transition-colors"
                >
                  Tout supprimer
                </button>
              )}
            </div>
          </div>

          {importStatus && (
            <div
              className={`p-3.5 rounded-lg border text-sm font-semibold ${
                importStatus.type === 'success'
                  ? 'bg-[#edf8f7] border-[#bce5e2] text-[#096475]'
                  : importStatus.type === 'error'
                  ? 'bg-[#fdf2f2] border-[#f5c6cb] text-[#c0392b]'
                  : 'bg-[#fff9eb] border-[#f6dfa8] text-[#8a5a00]'
              }`}
            >
              {importStatus.text}
            </div>
          )}

          <div className="bg-white border border-[#dce7e9] rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#748186] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                placeholder="Rechercher un nom, identifiant, matricule..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#dce7e9] text-xs focus:outline-none focus:border-[#00afa9]"
              />
            </div>

            <select
              value={profileBu}
              onChange={(e) => setProfileBu(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Toutes les BU</option>
              {uniqueBus.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={profileRole}
              onChange={(e) => setProfileRole(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="formateur">Formateur</option>
              <option value="apprenant">Apprenant</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setProfileSearch('');
                setProfileBu('');
                setProfileRole('');
              }}
              className="h-9 px-3 rounded-lg border border-[#d6ecea] bg-[#edf7f6] text-xs font-bold text-[#096475] cursor-pointer"
            >
              Réinitialiser
            </button>

            <span className="ml-auto text-xs font-bold text-[#096475] tabular-nums">
              {filteredProfiles.length} / {profiles.length} utilisateur(s)
            </span>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#edf7f6] text-[#096475] border-b border-[#dce8e9]">
                    <th className="py-3 px-4 font-bold">Nom complet</th>
                    <th className="py-3 px-4 font-bold">Identifiant</th>
                    <th className="py-3 px-4 font-bold">Matricule</th>
                    <th className="py-3 px-4 font-bold">BU</th>
                    <th className="py-3 px-4 font-bold">Fonction</th>
                    <th className="py-3 px-4 font-bold">Rôle</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#6f7d81]">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[#edf3f4] last:border-0 hover:bg-[#f8fbfb]"
                      >
                        <td className="py-3 px-4 font-bold text-[#243238]">
                          {p.full_name || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono-tabular text-[#5d6c71]">
                          {p.username || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono-tabular text-[#5d6c71]">
                          {p.matricule || '—'}
                        </td>
                        <td className="py-3 px-4 text-[#5d6c71]">{p.bu || '—'}</td>
                        <td className="py-3 px-4 text-[#5d6c71]">{p.fonction || '—'}</td>
                        <td className="py-3 px-4 text-[#5d6c71]">{p.role || 'apprenant'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteProfile(p.id)}
                            title="Supprimer"
                            className="h-8 w-8 rounded-md border border-[#f2d0cd] bg-[#fdf2f2] hover:bg-[#c0392b] hover:text-white text-[#c0392b] inline-flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RÉSULTATS */}
      {activeTab === 'resultats' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#096475]">
                Résultats des formations
              </h1>
              <p className="text-sm text-[#66757a] mt-0.5">
                Suivez les complétions, scores et exportez les données au format CSV.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportResultsCsv}
              className="h-10 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exporter en CSV</span>
            </button>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl p-4 flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold text-[#243238]">Filtrer par cours :</label>
            <select
              value={filterResultCourseId}
              onChange={(e) => setFilterResultCourseId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white min-w-[240px]"
            >
              <option value="">Tous les cours</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#dce7e9] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#6f7d81]">Total lignes</p>
              <p className="text-2xl font-black text-[#096475] mt-1 tabular-nums">
                {filteredResults.length}
              </p>
            </div>
            <div className="bg-white border border-[#dce7e9] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#6f7d81]">Cours terminés</p>
              <p className="text-2xl font-black text-[#096475] mt-1 tabular-nums">
                {filteredResults.filter((r) => r.completed).length}
              </p>
            </div>
            <div className="bg-white border border-[#dce7e9] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#6f7d81]">Apprenants uniques</p>
              <p className="text-2xl font-black text-[#096475] mt-1 tabular-nums">
                {new Set(filteredResults.map((r) => r.user_id)).size}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#edf7f6] text-[#096475] border-b border-[#dce8e9]">
                    <th className="py-3 px-4 font-bold">Apprenant</th>
                    <th className="py-3 px-4 font-bold">Cours</th>
                    <th className="py-3 px-4 font-bold">Statut</th>
                    <th className="py-3 px-4 font-bold text-right">Score</th>
                    <th className="py-3 px-4 font-bold">Date de complétion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#6f7d81]">
                        Aucun résultat enregistré.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r, idx) => {
                      const prof = profiles.find(
                        (p) => p.id === r.user_id || p.username === r.user_id
                      );
                      const course = courses.find((c) => c.id === r.course_id);
                      return (
                        <tr
                          key={`${r.user_id}-${r.course_id}-${idx}`}
                          className="border-b border-[#edf3f4] last:border-0 hover:bg-[#f8fbfb]"
                        >
                          <td className="py-3 px-4 font-semibold text-[#243238]">
                            {prof?.full_name || prof?.username || r.user_id}
                          </td>
                          <td className="py-3 px-4 text-[#5d6c71]">
                            {course?.title || `Cours #${r.course_id}`}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span
                              className={
                                r.completed ? 'text-[#16a34a]' : 'text-[#d97706]'
                              }
                            >
                              {r.completed ? 'Terminé' : 'En cours'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-tabular">
                            {r.score != null ? `${r.score}%` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono-tabular text-[#5d6c71]">
                            {r.completed_at
                              ? new Date(r.completed_at).toLocaleString('fr-FR')
                              : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE CODE SOURCE (COPIER-COLLER) */}
      {activeTab === 'code' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#096475]">
              Code source corrigé (Copier-Coller)
            </h1>
            <p className="text-sm text-[#66757a] mt-1">
              Versions corrigées de vos fichiers statiques pour la maintenance directe de votre hébergement.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATIC_FILES_EXPORT.map((entry, idx) => (
              <button
                key={entry.filename}
                type="button"
                onClick={() => setSelectedExportIdx(idx)}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  selectedExportIdx === idx
                    ? 'bg-[#096475] text-white border-[#096475]'
                    : 'bg-white text-[#46575c] border-[#dce7e9] hover:bg-[#f4f9f9]'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {STATIC_FILES_EXPORT[selectedExportIdx] && (
            <div className="bg-white border border-[#dce7e9] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#e5eeee] bg-[#f8fbfb] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#096475]">
                    {STATIC_FILES_EXPORT[selectedExportIdx].filename}
                  </h2>
                  <p className="text-xs text-[#6f7d81]">
                    {STATIC_FILES_EXPORT[selectedExportIdx].description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCode(
                        STATIC_FILES_EXPORT[selectedExportIdx].filename,
                        STATIC_FILES_EXPORT[selectedExportIdx].content
                      )
                    }
                    className="h-9 px-3.5 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFilename === STATIC_FILES_EXPORT[selectedExportIdx].filename ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le code</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadCode(
                        STATIC_FILES_EXPORT[selectedExportIdx].filename,
                        STATIC_FILES_EXPORT[selectedExportIdx].content
                      )
                    }
                    className="h-9 px-3.5 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f7f8] text-xs font-bold text-[#096475] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger</span>
                  </button>
                </div>
              </div>

              <pre className="p-5 overflow-x-auto max-h-[540px] text-xs font-mono-tabular leading-relaxed bg-[#142327] text-[#e7f2f3]">
                <code>{STATIC_FILES_EXPORT[selectedExportIdx].content}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
