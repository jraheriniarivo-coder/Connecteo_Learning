import { createClient } from '@supabase/supabase-js';
import type { Course } from '../types';

export const SUPABASE_URL = 'https://txdvluhigwkyrduqxmyr.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHZsdWhpZ3dreXJkdXF4bXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTYzMzEsImV4cCI6MjEwMjg5MjMzMX0.waXh6ptcSMocNPJMbF36IPGIH4E-EGdTvj9NwGoiSV0';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Insère ou met à jour un cours de manière résiliente :
 * si la table Supabase ne possède pas certaines colonnes optionnelles
 * (ex: availability_date, assigned, created_by), on retire uniquement
 * la colonne signalée et on retente proprement.
 */
export async function saveCourseResilient(
  payload: Record<string, unknown>,
  editId?: number | null
): Promise<{ data: Course | null; error: string | null }> {
  const workingPayload = { ...payload };

  for (let attempt = 0; attempt < 5; attempt++) {
    const query = editId
      ? supabaseClient
          .from('courses')
          .update(workingPayload)
          .eq('id', editId)
          .select()
          .maybeSingle()
      : supabaseClient
          .from('courses')
          .insert(workingPayload)
          .select()
          .maybeSingle();

    const { data, error } = await query;

    if (!error) {
      return { data: (data as Course | null) ?? null, error: null };
    }

    // Détecte une colonne manquante dans le schéma Supabase (PGRST204 ou 42703)
    const msg = error.message || '';
    const matchPgrst = msg.match(/Could not find the '([^']+)' column/i);
    const matchPg = msg.match(/column "([^"]+)" of relation/i);
    const missingCol = matchPgrst?.[1] || matchPg?.[1];

    if (missingCol && missingCol in workingPayload) {
      delete workingPayload[missingCol];
      continue;
    }

    return { data: null, error: error.message };
  }

  return { data: null, error: 'Impossible d’enregistrer le cours après plusieurs tentatives.' };
}
