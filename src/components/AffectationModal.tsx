import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Course, Profile } from '../types';
import { supabaseClient } from '../lib/supabase';

interface AffectationModalProps {
  course: Course | null;
  onClose: () => void;
  onAssigned: () => Promise<void>;
}

export const AffectationModal: React.FC<AffectationModalProps> = ({
  course,
  onClose,
  onAssigned,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [buFilter, setBuFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!course) return;
    setSelectedIds([]);
    setGroupName('');
    setBuFilter('');
    setError('');
    setLoading(true);
    supabaseClient
      .from('profiles')
      .select('*')
      .order('full_name')
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError('Impossible de charger la liste des collaborateurs.');
          return;
        }
        setProfiles((data || []).filter((p) => p.role !== 'admin'));
      });
  }, [course]);

  const bus = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.bu).filter(Boolean) as string[])).sort(),
    [profiles]
  );

  const visibleProfiles = useMemo(
    () => (buFilter ? profiles.filter((p) => p.bu === buFilter) : profiles),
    [profiles, buFilter]
  );

  if (!course) return null;

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    setError('');
    if (!groupName.trim()) {
      setError('Veuillez saisir un nom de groupe.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Veuillez sélectionner au moins un participant.');
      return;
    }

    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const rows = selectedIds.map((userId) => ({
      user_id: userId,
      course_id: course.id,
      groupe: groupName.trim(),
      date_debut: today,
      date_fin: in30Days,
    }));

    const { error: insertErr } = await supabaseClient.from('enrollments').insert(rows);
    setSubmitting(false);

    if (insertErr) {
      setError(`Erreur d'affectation : ${insertErr.message}`);
      return;
    }

    await onAssigned();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d272c]/50 backdrop-blur-[3px] p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl border border-[#dce7e9] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5eeee] flex items-center justify-between bg-[#f8fbfb]">
          <div>
            <h3 className="text-base font-bold text-[#096475]">
              Affecter des participants
            </h3>
            <p className="text-xs text-[#6f7d81]">{course.title}</p>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#fdf2f2] border border-[#f5c6cb] text-xs font-semibold text-[#c0392b]">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#243238]">Filtrer par BU :</label>
              <select
                value={buFilter}
                onChange={(e) => setBuFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#dce7e9] text-xs bg-white"
              >
                <option value="">Toutes les BU</option>
                {bus.map((bu) => (
                  <option key={bu} value={bu}>
                    {bu}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-semibold text-[#096475] tabular-nums">
              {selectedIds.length} sélectionné(s)
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-[#6f7d81] py-8 text-center">
              Chargement des collaborateurs...
            </p>
          ) : (
            <div className="border border-[#e4ecee] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#edf7f6] text-[#096475] border-b border-[#dce8e9]">
                    <th className="py-2.5 px-3 w-10">Choix</th>
                    <th className="py-2.5 px-3">Nom complet</th>
                    <th className="py-2.5 px-3">Matricule</th>
                    <th className="py-2.5 px-3">BU</th>
                    <th className="py-2.5 px-3">Fonction</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#6f7d81]">
                        Aucun collaborateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    visibleProfiles.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[#edf3f4] last:border-0 hover:bg-[#f8fbfb]"
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleUser(p.id)}
                            className="accent-[#00afa9] cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#243238]">
                          {p.full_name || p.username}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular text-[#5d6c71]">
                          {p.matricule || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#5d6c71]">{p.bu || '—'}</td>
                        <td className="py-2.5 px-3 text-[#5d6c71]">{p.fonction || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#243238] mb-1">
              Nom du groupe / de la session *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex : Cohorte Manager T4 2026"
              className="w-full h-10 px-3 rounded-lg border border-[#dce7e9] text-sm focus:outline-none focus:border-[#00afa9]"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e5eeee] bg-[#f8fbfb] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#dce7e9] bg-white text-xs font-bold text-[#46575c] cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleAssign}
            className="h-10 px-4 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white text-xs font-bold cursor-pointer"
          >
            {submitting ? 'Affectation...' : 'Valider le groupe'}
          </button>
        </div>
      </div>
    </div>
  );
};
