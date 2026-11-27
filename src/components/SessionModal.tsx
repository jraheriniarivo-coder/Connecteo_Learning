import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import type { Course, EnrollmentGroup } from '../types';

interface SessionModalProps {
  course: Course | null;
  groups: EnrollmentGroup[];
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  course,
  groups,
  onClose,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<EnrollmentGroup | null>(null);

  if (!course) return null;

  const courseGroups = groups.filter((g) => g.coursId === course.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d272c]/50 backdrop-blur-[3px] p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl border border-[#dce7e9] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5eeee] flex items-center justify-between bg-[#f8fbfb]">
          <div>
            <h3 className="text-base font-bold text-[#096475]">
              {selectedGroup
                ? `Groupe : ${selectedGroup.nom}`
                : `Sessions · ${course.title}`}
            </h3>
            <p className="text-xs text-[#6f7d81] tabular-nums">
              {selectedGroup
                ? `${selectedGroup.participants.length} participant(s)`
                : `${courseGroups.length} session(s) enregistrée(s)`}
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

        <div className="flex-1 overflow-y-auto p-6">
          {selectedGroup ? (
            <div className="space-y-4">
              <div className="text-xs text-[#5d6c71] flex flex-wrap gap-4 pb-3 border-b border-[#edf3f4]">
                <span>
                  <strong className="text-[#243238]">Cours :</strong> {course.title}
                </span>
                <span className="tabular-nums">
                  <strong className="text-[#243238]">Période :</strong>{' '}
                  {selectedGroup.dateDebut} → {selectedGroup.dateFin}
                </span>
              </div>

              {selectedGroup.participants.length === 0 ? (
                <p className="text-sm text-[#6f7d81] py-6 text-center">
                  Aucun participant rattaché.
                </p>
              ) : (
                <ul className="divide-y divide-[#edf3f4] border border-[#e4ecee] rounded-xl overflow-hidden">
                  {selectedGroup.participants.map((p, idx) => (
                    <li
                      key={`${p.user_id}-${idx}`}
                      className="px-4 py-3 text-sm flex items-center justify-between bg-white"
                    >
                      <span className="font-semibold text-[#243238]">{p.nom}</span>
                      <span className="text-xs text-[#6f7d81]">
                        {[p.fonction, p.bu].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="text-xs font-bold text-[#096475] hover:underline cursor-pointer"
              >
                ← Retour aux sessions
              </button>
            </div>
          ) : courseGroups.length === 0 ? (
            <p className="text-sm text-[#6f7d81] py-8 text-center">
              Aucune session affectée pour ce cours.
            </p>
          ) : (
            <div className="space-y-3">
              {courseGroups.map((g) => (
                <button
                  key={`${g.id}-${g.nom}`}
                  type="button"
                  onClick={() => setSelectedGroup(g)}
                  className="w-full text-left p-4 rounded-xl border border-[#dce7e9] bg-[#fbfdfd] hover:border-[#00afa9] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold text-[#096475]">{g.nom}</p>
                    <p className="text-xs text-[#6f7d81] mt-1 tabular-nums">
                      {g.dateDebut} → {g.dateFin} · {g.participants.length} participant(s)
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#66757a]" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-[#e5eeee] bg-[#f8fbfb] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
