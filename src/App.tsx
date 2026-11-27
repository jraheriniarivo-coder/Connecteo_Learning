/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  Course,
  EnrollmentGroup,
  EnrollmentRequest,
  Profile,
  ProgressRecord,
  UserSession,
} from './types';
import { supabaseClient } from './lib/supabase';
import { LoginView } from './components/LoginView';
import { TopBar, type NavItem } from './components/TopBar';
import { AdminDashboard, type AdminTab } from './components/AdminDashboard';
import { LearnerView, type LearnerTab } from './components/LearnerView';
import { CourseModal } from './components/CourseModal';
import { AffectationModal } from './components/AffectationModal';
import { SessionModal } from './components/SessionModal';
import { NotificationPanel } from './components/NotificationPanel';
import { CoursePlayerView } from './components/CoursePlayerView';

const ADMIN_NAV: NavItem[] = [
  { id: 'global', label: 'Vue globale' },
  { id: 'cours', label: 'Gestion des cours' },
  { id: 'utilisateurs', label: 'Utilisateurs' },
  { id: 'resultats', label: 'Résultats' },
  { id: 'code', label: 'Code maintenance' },
];

const LEARNER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'mes-formations', label: 'Mes formations' },
];

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const raw = sessionStorage.getItem('sessionUser');
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  });

  const [workspaceMode, setWorkspaceMode] = useState<'admin' | 'learner'>(() => {
    try {
      const raw = sessionStorage.getItem('sessionUser');
      const parsed = raw ? (JSON.parse(raw) as UserSession) : null;
      return parsed?.role === 'admin' ? 'admin' : 'learner';
    } catch {
      return 'learner';
    }
  });

  const [adminTab, setAdminTab] = useState<AdminTab>('global');
  const [learnerTab, setLearnerTab] = useState<LearnerTab>('dashboard');

  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<EnrollmentGroup[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [progressList, setProgressList] = useState<ProgressRecord[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<number[]>([]);
  const [userPendingRequests, setUserPendingRequests] = useState<number[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EnrollmentRequest[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Modals & Player
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [assignCourse, setAssignCourse] = useState<Course | null>(null);
  const [sessionCourse, setSessionCourse] = useState<Course | null>(null);
  const [playingCourse, setPlayingCourse] = useState<{
    course: Course;
    previewOnly: boolean;
  } | null>(null);

  const loadAllData = useCallback(async (activeUser: UserSession | null) => {
    if (!activeUser) return;
    setLoadingData(true);

    try {
      const [coursesRes, enrollmentsRes, profilesRes, progressRes] = await Promise.all([
        supabaseClient.from('courses').select('*').order('id', { ascending: true }),
        supabaseClient.from('enrollments').select(`
          id, user_id, course_id, groupe, date_debut, date_fin,
          profiles:user_id (full_name, matricule, bu, fonction)
        `),
        supabaseClient.from('profiles').select('*').order('full_name', { ascending: true }),
        supabaseClient.from('progress').select('*').order('completed_at', { ascending: false }),
      ]);

      const loadedCourses: Course[] = (coursesRes.data as Course[] | null) || [];
      const loadedProfiles: Profile[] = (profilesRes.data as Profile[] | null) || [];
      const loadedProgress: ProgressRecord[] = (progressRes.data as ProgressRecord[] | null) || [];

      // Groupes
      const groupsMap: Record<string, EnrollmentGroup> = {};
      ((enrollmentsRes.data as Array<Record<string, unknown>> | null) || []).forEach((g) => {
        const key = `${String(g.groupe)}__${String(g.course_id)}`;
        if (!groupsMap[key]) {
          groupsMap[key] = {
            id: Number(g.id),
            nom: String(g.groupe || 'Groupe'),
            coursId: Number(g.course_id),
            dateDebut: String(g.date_debut || ''),
            dateFin: String(g.date_fin || ''),
            participants: [],
          };
        }
        const prof = g.profiles as Record<string, unknown> | null;
        if (prof) {
          groupsMap[key].participants.push({
            user_id: String(g.user_id),
            nom: String(prof.full_name || ''),
            matricule: prof.matricule ? String(prof.matricule) : undefined,
            bu: prof.bu ? String(prof.bu) : undefined,
            fonction: prof.fonction ? String(prof.fonction) : undefined,
          });
        }
      });
      setGroups(Object.values(groupsMap));
      setProfiles(loadedProfiles);
      setProgressList(loadedProgress);

      // User specific enrollments & progress
      const currentProfile = loadedProfiles.find((p) => p.username === activeUser.username);
      if (currentProfile) {
        const [myEnrollRes, myReqRes] = await Promise.all([
          supabaseClient
            .from('enrollments')
            .select('course_id')
            .eq('user_id', currentProfile.id),
          supabaseClient
            .from('enrollment_requests')
            .select('course_id')
            .eq('user_id', currentProfile.id)
            .eq('status', 'pending'),
        ]);

        setUserEnrollments(
          ((myEnrollRes.data as Array<{ course_id: number }> | null) || []).map(
            (e) => e.course_id
          )
        );
        setUserPendingRequests(
          ((myReqRes.data as Array<{ course_id: number }> | null) || []).map(
            (r) => r.course_id
          )
        );

        const myProgress = loadedProgress.filter((p) => p.user_id === currentProfile.id);
        loadedCourses.forEach((c) => {
          const match = myProgress.find((p) => p.course_id === c.id);
          if (match) {
            c.progress = match.completed ? 100 : 0;
            c.score = match.score ?? null;
          }
        });
      } else {
        setUserEnrollments([]);
        setUserPendingRequests([]);
      }

      setCourses(loadedCourses);

      // Pending notifications for admin
      if (activeUser.role === 'admin') {
        const { data: reqData } = await supabaseClient
          .from('enrollment_requests')
          .select(
            'id, user_id, course_id, reason, status, created_at, profiles:user_id (full_name, matricule, bu, fonction), courses:course_id (title, duree)'
          )
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setPendingRequests((reqData as unknown as EnrollmentRequest[] | null) || []);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadAllData(user);
    }
  }, [user, loadAllData]);

  const handleLogin = (loggedUser: UserSession) => {
    sessionStorage.setItem('sessionUser', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setWorkspaceMode(loggedUser.role === 'admin' ? 'admin' : 'learner');
    setAdminTab('global');
    setLearnerTab('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sessionUser');
    setUser(null);
    setPlayingCourse(null);
  };

  const refreshNotifications = async () => {
    setNotifLoading(true);
    const { data } = await supabaseClient
      .from('enrollment_requests')
      .select(
        'id, user_id, course_id, reason, status, created_at, profiles:user_id (full_name, matricule, bu, fonction), courses:course_id (title, duree)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingRequests((data as unknown as EnrollmentRequest[] | null) || []);
    setNotifLoading(false);
  };

  const handleNotifAction = async (
    req: EnrollmentRequest,
    action: 'accept' | 'refuse'
  ) => {
    if (action === 'accept') {
      const today = new Date().toISOString().split('T')[0];
      const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      await supabaseClient.from('enrollments').insert({
        user_id: req.user_id,
        course_id: req.course_id,
        groupe: 'Validation Directe',
        date_debut: today,
        date_fin: in30Days,
      });
      await supabaseClient
        .from('enrollment_requests')
        .update({ status: 'approved' })
        .eq('id', req.id);
    } else {
      await supabaseClient
        .from('enrollment_requests')
        .update({ status: 'rejected' })
        .eq('id', req.id);
    }
    await refreshNotifications();
    await loadAllData(user);
  };

  const handleDeleteCourse = async (courseId: number) => {
    await supabaseClient.from('courses').delete().eq('id', courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const handleImportUsersCsv = async (
    rows: Array<Record<string, string>>
  ): Promise<{ count: number; error?: string }> => {
    const { error } = await supabaseClient
      .from('profiles')
      .upsert(rows, { onConflict: 'username' });
    if (error) return { count: 0, error: error.message };
    await loadAllData(user);
    return { count: rows.length };
  };

  const handleDeleteProfile = async (id: string) => {
    await supabaseClient.from('progress').delete().eq('user_id', id);
    await supabaseClient.from('enrollments').delete().eq('user_id', id);
    await supabaseClient.from('profiles').delete().eq('id', id);
    await loadAllData(user);
  };

  const handleDeleteAllProfiles = async () => {
    await supabaseClient.from('progress').delete().not('id', 'is', null);
    await supabaseClient.from('enrollments').delete().not('id', 'is', null);
    await supabaseClient
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await loadAllData(user);
  };

  const handleRequestEnrollment = async (
    courseId: number,
    reason: string
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'Non connecté.' };
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('username', user.username)
      .maybeSingle();

    if (!profileData) {
      return { error: 'Profil introuvable dans la base Supabase.' };
    }

    const { error } = await supabaseClient.from('enrollment_requests').insert({
      user_id: profileData.id,
      course_id: courseId,
      reason,
      status: 'pending',
    });

    if (error) return { error: error.message };
    await loadAllData(user);
    return {};
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (playingCourse) {
    return (
      <CoursePlayerView
        course={playingCourse.course}
        user={user}
        previewOnly={playingCourse.previewOnly}
        onBack={() => setPlayingCourse(null)}
        onCompleted={async () => {
          await loadAllData(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f8]">
      <TopBar
        user={user}
        navItems={workspaceMode === 'admin' ? ADMIN_NAV : LEARNER_NAV}
        activeNav={workspaceMode === 'admin' ? adminTab : learnerTab}
        onSelectNav={(id) => {
          if (workspaceMode === 'admin') setAdminTab(id as AdminTab);
          else setLearnerTab(id as LearnerTab);
        }}
        workspaceMode={workspaceMode}
        onSwitchWorkspace={
          user.role === 'admin'
            ? () =>
                setWorkspaceMode((m) => (m === 'admin' ? 'learner' : 'admin'))
            : undefined
        }
        pendingNotifCount={pendingRequests.length}
        onOpenNotifications={() => {
          setNotifOpen(true);
          void refreshNotifications();
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        {loadingData && courses.length === 0 ? (
          <div className="bg-white border border-[#dce7e9] rounded-xl p-10 text-center text-sm text-[#6f7d81]">
            Chargement des données de la plateforme...
          </div>
        ) : workspaceMode === 'admin' ? (
          <AdminDashboard
            activeTab={adminTab}
            courses={courses}
            groups={groups}
            profiles={profiles}
            progressList={progressList}
            onAddCourse={() => {
              setEditingCourse(null);
              setCourseModalOpen(true);
            }}
            onEditCourse={(course) => {
              setEditingCourse(course);
              setCourseModalOpen(true);
            }}
            onPreviewCourse={(course) =>
              setPlayingCourse({ course, previewOnly: true })
            }
            onAssignCourse={(course) => setAssignCourse(course)}
            onOpenSessions={(course) => setSessionCourse(course)}
            onDeleteCourse={handleDeleteCourse}
            onImportUsersCsv={handleImportUsersCsv}
            onDeleteProfile={handleDeleteProfile}
            onDeleteAllProfiles={handleDeleteAllProfiles}
          />
        ) : (
          <LearnerView
            activeTab={learnerTab}
            user={user}
            courses={courses}
            userEnrollments={userEnrollments}
            userPendingRequests={userPendingRequests}
            onLaunchCourse={(course) =>
              setPlayingCourse({ course, previewOnly: false })
            }
            onRequestEnrollment={handleRequestEnrollment}
          />
        )}
      </main>

      <footer className="border-t border-[#e2ecee] bg-white/70 py-5 px-6 text-center text-xs text-[#6f7d81]">
        © 2026 Connecteo — Tous droits réservés.
      </footer>

      <CourseModal
        open={courseModalOpen}
        editingCourse={editingCourse}
        createdByName={user.name}
        onClose={() => {
          setCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSaved={async (savedCourse, action) => {
          await loadAllData(user);
          if (action === 'save_quit' || action === 'publish') {
            setCourseModalOpen(false);
            setEditingCourse(null);
          } else if (action === 'publish_assign') {
            setCourseModalOpen(false);
            setEditingCourse(null);
            if (savedCourse) setAssignCourse(savedCourse);
          }
        }}
      />

      <AffectationModal
        course={assignCourse}
        onClose={() => setAssignCourse(null)}
        onAssigned={async () => {
          await loadAllData(user);
        }}
      />

      <SessionModal
        course={sessionCourse}
        groups={groups}
        onClose={() => setSessionCourse(null)}
      />

      <NotificationPanel
        open={notifOpen}
        loading={notifLoading}
        requests={pendingRequests}
        onClose={() => setNotifOpen(false)}
        onAction={handleNotifAction}
      />
    </div>
  );
}
