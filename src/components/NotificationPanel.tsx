import React from 'react';
import { X, Check } from 'lucide-react';
import type { EnrollmentRequest } from '../types';

interface NotificationPanelProps {
  open: boolean;
  loading: boolean;
  requests: EnrollmentRequest[];
  onClose: () => void;
  onAction: (request: EnrollmentRequest, action: 'accept' | 'refuse') => Promise<void>;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  open,
  loading,
  requests,
  onClose,
  onAction,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0d272c]/40 backdrop-blur-[2px]">
      <div className="w-full max-w-md bg-white h-full border-l border-[#dce7e9] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-[#e5eeee] flex items-center justify-between bg-[#f8fbfb]">
          <div>
            <h3 className="text-base font-bold text-[#096475]">
              Demandes d&apos;inscription
            </h3>
            <p className="text-xs text-[#6f7d81] tabular-nums">
              {requests.length} demande(s) en attente
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="h-9 w-9 rounded-lg border border-[#dce7e9] bg-white hover:bg-[#f4f7f8] text-[#46575c] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <p className="text-sm text-[#6f7d81] text-center py-10">
              Chargement des demandes...
            </p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-[#6f7d81] text-center py-10">
              Aucune demande d&apos;inscription en attente.
            </p>
          ) : (
            requests.map((req) => {
              const prof = req.profiles || {};
              const course = req.courses || {};
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-[#dce7e9] bg-[#fbfdfd] space-y-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-[#096475]">
                      {course.title || 'Cours inconnu'}
                    </h4>
                    <p className="text-xs text-[#6f7d81] mt-1">
                      {prof.full_name || 'Apprenant inconnu'}
                      {prof.matricule ? ` · Matricule ${prof.matricule}` : ''}
                      {prof.bu ? ` · ${prof.bu}` : ''}
                      {prof.fonction ? ` · ${prof.fonction}` : ''}
                    </p>
                  </div>

                  {req.reason && (
                    <p className="text-sm text-[#243238] bg-white border border-[#e5eeee] rounded-lg px-3 py-2 italic">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onAction(req, 'accept')}
                      className="flex-1 h-9 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction(req, 'refuse')}
                      className="flex-1 h-9 rounded-lg border border-[#e3b8b4] bg-white hover:bg-[#fdf2f2] text-[#c0392b] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
