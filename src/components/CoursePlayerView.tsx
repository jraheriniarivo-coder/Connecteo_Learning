import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Course, UserSession } from '../types';
import { supabaseClient } from '../lib/supabase';

interface CoursePlayerViewProps {
  course: Course;
  user: UserSession;
  previewOnly?: boolean;
  onBack: () => void;
  onCompleted: () => Promise<void>;
}

function toEmbedUrl(url?: string): string {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export const CoursePlayerView: React.FC<CoursePlayerViewProps> = ({
  course,
  user,
  previewOnly = false,
  onBack,
  onCompleted,
}) => {
  const [answers, setAnswers] = useState<Record<string, string | number | number[]>>({});
  const [quizResults, setQuizResults] = useState<Record<number, { score: number; total: number; percent: number }>>({});
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isHtmlCourse = Boolean(course.html_content && (!course.modules || course.modules.length === 0));

  const persistCompletion = async (score = 100) => {
    if (previewOnly) {
      setStatusMessage({
        type: 'success',
        text: `Aperçu validé (score simulé : ${score}%). En mode apprenant, la progression est enregistrée dans Supabase.`,
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('username', user.username)
      .maybeSingle();

    if (!profileData) {
      setSaving(false);
      setStatusMessage({
        type: 'error',
        text: 'Profil utilisateur introuvable dans Supabase pour enregistrer la progression.',
      });
      return;
    }

    const { error } = await supabaseClient.from('progress').upsert(
      {
        user_id: profileData.id,
        course_id: course.id,
        completed: true,
        score,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );

    setSaving(false);

    if (error) {
      setStatusMessage({
        type: 'error',
        text: `Erreur lors de l'enregistrement : ${error.message}`,
      });
      return;
    }

    setStatusMessage({
      type: 'success',
      text: 'Progression enregistrée avec succès.',
    });
    await onCompleted();
  };

  useEffect(() => {
    if (!isHtmlCourse) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'COURSE_COMPLETED') {
        const incomingScore = typeof event.data.score === 'number' ? event.data.score : 100;
        void persistCompletion(incomingScore);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isHtmlCourse, course.id, user.username]);

  const validateQuiz = (mIdx: number) => {
    const mod = course.modules?.[mIdx];
    if (!mod || mod.type !== 'quiz' || !mod.questions) return;

    let score = 0;
    const total = mod.questions.length;

    mod.questions.forEach((q, qIdx) => {
      const key = `${mIdx}-${qIdx}`;
      const val = answers[key];
      if (q.type === 'text') {
        if (
          typeof val === 'string' &&
          q.correct &&
          val.trim().toLowerCase() === String(q.correct).trim().toLowerCase()
        ) {
          score++;
        }
      } else if (q.type === 'qcm_single') {
        if (val !== undefined && Number(val) === Number(q.correct)) {
          score++;
        }
      } else if (q.type === 'qcm_multiple') {
        const selected = Array.isArray(val) ? [...val].map(Number).sort((a, b) => a - b) : [];
        const expected = Array.isArray(q.correct)
          ? [...q.correct].map(Number).sort((a, b) => a - b)
          : [];
        if (JSON.stringify(selected) === JSON.stringify(expected)) {
          score++;
        }
      }
    });

    const percent = total > 0 ? Math.round((score / total) * 100) : 100;
    setQuizResults((prev) => ({ ...prev, [mIdx]: { score, total, percent } }));
  };

  const getFinalScore = () => {
    const values = Object.values(quizResults);
    if (values.length === 0) return 100;
    return Math.round(values.reduce((acc, r) => acc + r.percent, 0) / values.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f8]">
      <header className="h-14 bg-white border-b border-[#e2ecee] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-[#096475] hover:text-[#00afa9] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la plateforme</span>
        </button>

        <div className="text-sm font-bold text-[#243238] truncate">
          {course.title}
          {previewOnly ? ' · Mode aperçu' : ''}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => persistCompletion(getFinalScore())}
          className="h-9 px-3.5 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{saving ? 'Enregistrement...' : 'Terminer le cours'}</span>
        </button>
      </header>

      {statusMessage && (
        <div
          className={`px-6 py-3 text-sm font-semibold border-b ${
            statusMessage.type === 'success'
              ? 'bg-[#edf8f7] border-[#bce5e2] text-[#096475]'
              : 'bg-[#fdf2f2] border-[#f5c6cb] text-[#c0392b]'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {isHtmlCourse ? (
        <iframe
          title={course.title}
          srcDoc={course.html_content || ''}
          className="w-full flex-1 border-0 bg-white min-h-[calc(100vh-3.5rem)]"
        />
      ) : (
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div
            className="rounded-2xl p-8 text-white"
            style={{
              background: `linear-gradient(135deg, ${course.color || '#00afa9'}, #096475)`,
            }}
          >
            <p className="text-xs font-semibold opacity-90">
              {course.theme} · Niveau {course.niveau} · {course.duree}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">{course.title}</h1>
            <p className="text-sm opacity-95 mt-2 max-w-2xl">{course.description}</p>
          </div>

          {!course.modules || course.modules.length === 0 ? (
            <div className="bg-white border border-[#dce7e9] rounded-xl p-6 text-sm text-[#5d6c71]">
              Ce cours ne contient pas encore de modules pédagogiques.
            </div>
          ) : (
            course.modules.map((mod, mIdx) => (
              <div
                key={mIdx}
                className="bg-white border border-[#dce7e9] rounded-xl p-6 space-y-4"
              >
                {mod.type === 'section' && (
                  <>
                    <h2 className="text-lg font-bold text-[#096475]">
                      {mod.title || `Section ${mIdx + 1}`}
                    </h2>
                    <p className="text-sm text-[#3c4d52] whitespace-pre-line leading-relaxed">
                      {mod.content || 'Aucun contenu.'}
                    </p>
                  </>
                )}

                {mod.type === 'video' && (
                  <>
                    <h2 className="text-lg font-bold text-[#096475]">Ressource vidéo</h2>
                    {mod.url ? (
                      toEmbedUrl(mod.url).includes('embed') ||
                      toEmbedUrl(mod.url).includes('player.vimeo') ? (
                        <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#e2ecee]">
                          <iframe
                            title={`Vidéo ${mIdx + 1}`}
                            src={toEmbedUrl(mod.url)}
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      ) : (
                        <a
                          href={mod.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#00afa9] underline"
                        >
                          Ouvrir la vidéo : {mod.url}
                        </a>
                      )
                    ) : (
                      <p className="text-sm text-[#6f7d81]">Aucune URL vidéo fournie.</p>
                    )}
                  </>
                )}

                {mod.type === 'quiz' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[#096475]">Quiz d&apos;évaluation</h2>
                    {(mod.questions || []).map((q, qIdx) => {
                      const key = `${mIdx}-${qIdx}`;
                      return (
                        <div key={qIdx} className="space-y-2 pb-3 border-b border-[#edf3f4] last:border-0">
                          <p className="text-sm font-bold text-[#243238]">
                            {qIdx + 1}. {q.question}
                          </p>
                          {q.type === 'text' ? (
                            <input
                              type="text"
                              value={String(answers[key] || '')}
                              onChange={(e) =>
                                setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder="Votre réponse"
                              className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm"
                            />
                          ) : (
                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => {
                                const checked =
                                  q.type === 'qcm_single'
                                    ? Number(answers[key]) === optIdx
                                    : Array.isArray(answers[key]) &&
                                      (answers[key] as number[]).includes(optIdx);
                                return (
                                  <label
                                    key={optIdx}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#e4ecee] bg-[#f8fbfb] hover:border-[#00afa9] text-sm cursor-pointer"
                                  >
                                    <input
                                      type={q.type === 'qcm_single' ? 'radio' : 'checkbox'}
                                      name={`quiz-${key}`}
                                      checked={checked}
                                      onChange={() => {
                                        if (q.type === 'qcm_single') {
                                          setAnswers((prev) => ({ ...prev, [key]: optIdx }));
                                        } else {
                                          const prevArr = Array.isArray(answers[key])
                                            ? (answers[key] as number[])
                                            : [];
                                          const nextArr = prevArr.includes(optIdx)
                                            ? prevArr.filter((x) => x !== optIdx)
                                            : [...prevArr, optIdx];
                                          setAnswers((prev) => ({ ...prev, [key]: nextArr }));
                                        }
                                      }}
                                      className="accent-[#00afa9]"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => validateQuiz(mIdx)}
                        className="h-9 px-4 rounded-lg bg-[#096475] hover:bg-[#064a57] text-white text-xs font-bold cursor-pointer"
                      >
                        Valider le quiz
                      </button>
                      {quizResults[mIdx] && (
                        <span className="text-sm font-bold text-[#096475] tabular-nums">
                          Score : {quizResults[mIdx].score}/{quizResults[mIdx].total} (
                          {quizResults[mIdx].percent}%)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      )}
    </div>
  );
};
