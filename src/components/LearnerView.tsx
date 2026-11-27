import React, { useMemo, useState } from 'react';
import { Search, ArrowLeft, Lock, Clock, Play, Send, X } from 'lucide-react';
import type { Course, UserSession } from '../types';

export type LearnerTab = 'dashboard' | 'catalogue' | 'mes-formations';

interface LearnerViewProps {
  activeTab: LearnerTab;
  user: UserSession;
  courses: Course[];
  userEnrollments: number[];
  userPendingRequests: number[];
  onLaunchCourse: (course: Course) => void;
  onRequestEnrollment: (courseId: number, reason: string) => Promise<{ error?: string }>;
}

const THEMES = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];

export const LearnerView: React.FC<LearnerViewProps> = ({
  activeTab,
  user,
  courses,
  userEnrollments,
  userPendingRequests,
  onLaunchCourse,
  onRequestEnrollment,
}) => {
  const [currentTheme, setCurrentTheme] = useState('Management');
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [formationsSearch, setFormationsSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Enrollment request modal
  const [requestCourse, setRequestCourse] = useState<Course | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');

  const publishedCourses = useMemo(
    () => courses.filter((c) => !c.status || c.status === 'published'),
    [courses]
  );

  // Dashboard stats
  const assignedCourses = useMemo(
    () => publishedCourses.filter((c) => userEnrollments.includes(c.id)),
    [publishedCourses, userEnrollments]
  );
  const completedCount = useMemo(
    () => assignedCourses.filter((c) => c.progress === 100).length,
    [assignedCourses]
  );
  const globalPct = useMemo(
    () =>
      assignedCourses.length > 0
        ? Math.round((completedCount / assignedCourses.length) * 100)
        : 0,
    [assignedCourses.length, completedCount]
  );
  const niveau = Math.min(5, 1 + Math.floor(completedCount / 3));
  const niveauLabels: Record<number, string> = {
    1: 'Débutant',
    2: 'En développement',
    3: 'Confirmé',
    4: 'Avancé',
    5: 'Expert',
  };
  const points = completedCount * 100;

  const themeStats = useMemo(() => {
    return THEMES.map((theme) => {
      const tc = assignedCourses.filter((c) => c.theme === theme);
      const done = tc.filter((c) => c.progress === 100).length;
      const pct = tc.length > 0 ? Math.round((done / tc.length) * 100) : 0;
      return { theme, total: tc.length, done, pct };
    });
  }, [assignedCourses]);

  // Catalogue filtered
  const catalogueCourses = useMemo(() => {
    const q = catalogueSearch.trim().toLowerCase();
    return publishedCourses.filter(
      (c) =>
        c.theme === currentTheme &&
        c.visibility_mode !== 'assigned_only' &&
        (!q ||
          c.title.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q))
    );
  }, [publishedCourses, currentTheme, catalogueSearch]);

  const selectedCourse = useMemo(
    () => publishedCourses.find((c) => c.id === selectedCourseId) || null,
    [publishedCourses, selectedCourseId]
  );

  const filteredAssigned = useMemo(() => {
    const q = formationsSearch.trim().toLowerCase();
    return assignedCourses.filter(
      (c) =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }, [assignedCourses, formationsSearch]);

  const handleSendRequest = async () => {
    if (!requestCourse) return;
    if (!requestReason.trim()) {
      setRequestMsg('Veuillez indiquer le motif de votre demande.');
      return;
    }
    setRequestSubmitting(true);
    setRequestMsg('');
    const res = await onRequestEnrollment(requestCourse.id, requestReason.trim());
    setRequestSubmitting(false);
    if (res.error) {
      setRequestMsg(`Erreur : ${res.error}`);
      return;
    }
    setRequestCourse(null);
    setRequestReason('');
  };

  return (
    <div className="space-y-6">
      {/* TABLEAU DE BORD APPRENANT */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#096475]">
              Tableau de bord · {user.name}
            </h1>
            <p className="text-sm text-[#66757a] mt-1">
              Suivez votre progression et vos parcours en cours.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Niveau actuel</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {niveau}
              </p>
              <p className="text-xs text-[#748186] mt-1">{niveauLabels[niveau]}</p>
            </div>

            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Points acquis</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {points}
              </p>
              <p className="text-xs text-[#748186] mt-1 tabular-nums">
                Prochain palier : {(Math.floor(points / 500) + 1) * 500} pts
              </p>
            </div>

            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Formations</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {completedCount} / {assignedCourses.length}
              </p>
              <p className="text-xs text-[#748186] mt-1 tabular-nums">
                {Math.max(0, assignedCourses.length - completedCount)} restante(s)
              </p>
            </div>

            <div className="bg-white border border-[#dce7e9] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#6f7d81]">Modules validés</p>
              <p className="text-3xl font-black text-[#096475] mt-1.5 tabular-nums">
                {completedCount}
              </p>
              <p className="text-xs text-[#748186] mt-1">
                {completedCount > 0 ? 'Parcours actif' : 'Aucun module terminé'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl p-5 flex flex-wrap items-center gap-4">
            <span className="text-sm font-bold text-[#243238] min-w-[160px]">
              Progression globale
            </span>
            <div className="flex-1 h-2.5 bg-[#edf3f4] rounded-full overflow-hidden min-w-[180px]">
              <div
                className="h-full bg-[#00afa9] rounded-full transition-all"
                style={{ width: `${globalPct}%` }}
              />
            </div>
            <span className="text-sm font-black text-[#096475] tabular-nums w-12 text-right">
              {globalPct}%
            </span>
          </div>

          <div className="bg-white border border-[#dce7e9] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#096475]">
              Avancement par thématique
            </h2>
            <div className="space-y-3">
              {themeStats.map((st) => (
                <div key={st.theme} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#243238]">{st.theme}</span>
                    <span className="font-mono-tabular text-[#5d6c71]">
                      {st.done}/{st.total} · {st.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#edf3f4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#096475] rounded-full transition-all"
                      style={{ width: `${st.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-60 shrink-0 bg-white border border-[#dce7e9] rounded-xl p-4 lg:sticky lg:top-24">
            <h3 className="text-sm font-bold text-[#096475] pb-3 mb-3 border-b border-[#edf3f4]">
              Thématiques
            </h3>
            <ul className="flex flex-wrap lg:flex-col gap-1.5">
              {THEMES.map((t) => {
                const active = currentTheme === t;
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentTheme(t);
                        setSelectedCourseId(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#00afa9] text-white'
                          : 'text-[#46575c] hover:bg-[#edf7f6] hover:text-[#096475]'
                      }`}
                    >
                      {t}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="flex-1 min-w-0 w-full space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-black tracking-tight text-[#096475]">
                {selectedCourse ? selectedCourse.title : currentTheme}
              </h1>

              {!selectedCourse && (
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#748186] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogueSearch}
                    onChange={(e) => {
                      setCatalogueSearch(e.target.value);
                      setSelectedCourseId(null);
                    }}
                    placeholder="Rechercher un cours..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#dce7e9] bg-white text-sm focus:outline-none focus:border-[#00afa9]"
                  />
                </div>
              )}
            </div>

            {selectedCourse ? (
              <div className="bg-white border border-[#dce7e9] rounded-xl p-6 sm:p-8 space-y-5">
                <button
                  type="button"
                  onClick={() => setSelectedCourseId(null)}
                  className="text-xs font-bold text-[#096475] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour au catalogue</span>
                </button>

                <div>
                  <p className="text-xs font-semibold text-[#6f7d81]">
                    {selectedCourse.theme} · Niveau {selectedCourse.niveau} · {selectedCourse.duree}
                  </p>
                  <h2 className="text-xl font-black text-[#096475] mt-1">
                    {selectedCourse.title}
                  </h2>
                  <p className="text-sm text-[#46575c] mt-2 leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>

                {selectedCourse.syllabus && selectedCourse.syllabus.length > 0 && (
                  <div className="pt-3 border-t border-[#edf3f4]">
                    <h3 className="text-sm font-bold text-[#243238] mb-2">Syllabus</h3>
                    <ul className="list-disc pl-5 text-sm text-[#46575c] space-y-1">
                      {selectedCourse.syllabus.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3">
                  {(() => {
                    const mode = selectedCourse.visibility_mode || 'assigned_only';
                    const isAssigned = userEnrollments.includes(selectedCourse.id);
                    const isPending = userPendingRequests.includes(selectedCourse.id);

                    if (mode === 'unlock_by_progression') {
                      const prereq = publishedCourses.find(
                        (c) => c.id === selectedCourse.prerequisite_course_id
                      );
                      const prereqDone = prereq && prereq.progress === 100;
                      if (prereqDone) {
                        return (
                          <button
                            type="button"
                            onClick={() => onLaunchCourse(selectedCourse)}
                            className="h-10 px-5 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                            <span>Commencer</span>
                          </button>
                        );
                      }
                      return (
                        <button
                          type="button"
                          disabled
                          className="h-10 px-5 rounded-lg bg-[#e4ecee] text-[#66757a] text-sm font-bold flex items-center gap-2 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4" />
                          <span>
                            À débloquer après : {prereq ? prereq.title : 'un cours préalable'}
                          </span>
                        </button>
                      );
                    }

                    if (mode === 'auto_enrollment_with_validation') {
                      if (isAssigned) {
                        return (
                          <button
                            type="button"
                            onClick={() => onLaunchCourse(selectedCourse)}
                            className="h-10 px-5 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                            <span>Commencer</span>
                          </button>
                        );
                      }
                      if (isPending) {
                        return (
                          <button
                            type="button"
                            disabled
                            className="h-10 px-5 rounded-lg bg-[#e4ecee] text-[#66757a] text-sm font-bold flex items-center gap-2 cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Demande en attente de validation</span>
                          </button>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestCourse(selectedCourse);
                            setRequestReason('');
                            setRequestMsg('');
                          }}
                          className="h-10 px-5 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Demander l&apos;inscription</span>
                        </button>
                      );
                    }

                    if (mode === 'mandatory' || isAssigned) {
                      return (
                        <button
                          type="button"
                          onClick={() => onLaunchCourse(selectedCourse)}
                          className="h-10 px-5 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>Commencer</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        disabled
                        className="h-10 px-5 rounded-lg bg-[#e4ecee] text-[#66757a] text-sm font-bold cursor-not-allowed"
                      >
                        Réservé aux personnes affectées
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                {[1, 2, 3, 4].map((lvl) => {
                  const list = catalogueCourses.filter((c) => c.niveau === lvl);
                  return (
                    <div
                      key={lvl}
                      className="bg-white border border-[#dce7e9] rounded-xl p-3.5 space-y-3"
                    >
                      <h4 className="text-xs font-black text-[#096475] bg-[#edf7f6] rounded-lg py-2 px-3 text-center">
                        Niveau {lvl}
                      </h4>
                      {list.length === 0 ? (
                        <p className="text-xs text-[#879296] text-center py-4">
                          Aucun cours
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {list.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCourseId(c.id)}
                              className="w-full text-left p-3 rounded-lg border border-[#e5eeee] bg-[#fbfdfd] hover:border-[#00afa9] transition-colors cursor-pointer space-y-1.5"
                            >
                              <p className="text-sm font-bold text-[#243238] leading-snug">
                                {c.title}
                              </p>
                              <p className="text-xs text-[#6f7d81] tabular-nums">
                                {c.duree}
                                {c.progress === 100
                                  ? ' · Terminé'
                                  : c.visibility_mode === 'mandatory'
                                  ? ' · Obligatoire'
                                  : c.visibility_mode === 'unlock_by_progression'
                                  ? ' · À débloquer'
                                  : ' · Auto-inscription'}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MES FORMATIONS */}
      {activeTab === 'mes-formations' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#096475]">
                Mes formations
              </h1>
              <p className="text-sm text-[#66757a] mt-0.5">
                Modules qui vous ont été assignés ou validés.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#748186] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formationsSearch}
                onChange={(e) => setFormationsSearch(e.target.value)}
                placeholder="Rechercher dans mes formations..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#dce7e9] bg-white text-sm focus:outline-none focus:border-[#00afa9]"
              />
            </div>
          </div>

          {filteredAssigned.length === 0 ? (
            <div className="bg-white border border-[#dce7e9] rounded-xl p-10 text-center text-sm text-[#6f7d81]">
              Aucune formation assignée pour le moment. Consultez le catalogue pour demander une inscription.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssigned.map((course) => {
                const pct = course.progress || 0;
                const deadline = course.deadline ? new Date(course.deadline) : null;
                const isLate = deadline && deadline < new Date() && pct < 100;

                return (
                  <div
                    key={course.id}
                    className="bg-white border border-[#dce7e9] rounded-xl overflow-hidden flex flex-col"
                  >
                    <div
                      className="px-5 py-4 text-white font-bold text-sm"
                      style={{
                        background: `linear-gradient(135deg, ${course.color || '#00afa9'}, #096475)`,
                      }}
                    >
                      {course.theme} · Niveau {course.niveau}
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <h3 className="text-base font-bold text-[#243238]">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#5d6c71] flex-1 leading-relaxed">
                        {course.description}
                      </p>

                      {deadline && (
                        <p
                          className={`text-xs font-bold ${
                            isLate ? 'text-[#c0392b]' : 'text-[#096475]'
                          }`}
                        >
                          {isLate ? 'En retard · Échéance : ' : 'À terminer avant le '}
                          {deadline.toLocaleDateString('fr-FR')}
                        </p>
                      )}

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-[#5d6c71] tabular-nums">
                          <span>{course.duree}</span>
                          <span className="font-bold text-[#096475]">{pct}% terminé</span>
                        </div>
                        <div className="h-2 bg-[#edf3f4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#ffa900] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onLaunchCourse(course)}
                        className="mt-2 h-10 w-full rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-sm font-bold cursor-pointer transition-colors"
                      >
                        {pct > 0 ? 'Continuer' : 'Commencer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALE DEMANDE D'INSCRIPTION */}
      {requestCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d272c]/50 backdrop-blur-[3px] p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#dce7e9] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eeee] bg-[#f8fbfb] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#096475]">
                Demande d&apos;inscription
              </h3>
              <button
                type="button"
                onClick={() => setRequestCourse(null)}
                className="h-8 w-8 rounded-lg border border-[#dce7e9] bg-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#f4f9f9] border border-[#dce7e9] text-xs space-y-1">
                <p className="font-bold text-[#096475] text-sm">{requestCourse.title}</p>
                <p className="text-[#5d6c71]">
                  {requestCourse.theme} · Niveau {requestCourse.niveau} · {requestCourse.duree}
                </p>
              </div>

              {requestMsg && (
                <p className="text-xs font-semibold text-[#c0392b]">{requestMsg}</p>
              )}

              <div>
                <label className="block text-xs font-bold text-[#243238] mb-1.5">
                  Motif de la demande *
                </label>
                <textarea
                  rows={4}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Expliquez brièvement votre besoin de formation..."
                  className="w-full p-3 rounded-lg border border-[#dce7e9] text-sm focus:outline-none focus:border-[#00afa9]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#e5eeee] bg-[#f8fbfb] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRequestCourse(null)}
                className="h-9 px-4 rounded-lg border border-[#dce7e9] bg-white text-xs font-bold text-[#46575c] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={requestSubmitting}
                onClick={handleSendRequest}
                className="h-9 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold cursor-pointer"
              >
                {requestSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
