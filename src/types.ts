export type UserRole = 'admin' | 'formateur' | 'apprenant';

export interface UserSession {
  username: string;
  name: string;
  role: UserRole;
}

export type CourseTheme =
  | 'Management'
  | 'Communication'
  | 'Commerciale'
  | 'Relation client'
  | 'Soft skills';

export type CourseType = 'obligatoire' | 'information';

export type CourseStatus = 'draft' | 'editing' | 'published';

export type VisibilityMode =
  | 'assigned_only'
  | 'auto_enrollment_with_validation'
  | 'unlock_by_progression'
  | 'mandatory';

export interface QuizQuestion {
  type: 'qcm_single' | 'qcm_multiple' | 'text';
  question: string;
  options: string[];
  correct: string | number | number[];
}

export interface CourseModule {
  type: 'section' | 'video' | 'quiz';
  title?: string;
  content?: string;
  url?: string;
  questions?: QuizQuestion[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  theme: string;
  niveau: number;
  duree: string;
  type: CourseType;
  auto_inscription?: boolean;
  autoInscription?: boolean;
  color: string;
  syllabus?: string[];
  modules?: CourseModule[];
  status?: CourseStatus;
  visibility_mode?: VisibilityMode;
  availability_date?: string | null;
  deadline?: string | null;
  prerequisite_course_id?: number | null;
  html_content?: string | null;
  external_url?: string | null;
  assigned?: boolean;
  created_by?: string;
  progress?: number;
  score?: number | null;
}

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  matricule?: string;
  bu?: string;
  fonction?: string;
  role?: string;
}

export interface GroupParticipant {
  user_id: string;
  nom: string;
  matricule?: string;
  bu?: string;
  fonction?: string;
}

export interface EnrollmentGroup {
  id: number;
  nom: string;
  coursId: number;
  dateDebut: string;
  dateFin: string;
  participants: GroupParticipant[];
}

export interface EnrollmentRequest {
  id: number;
  user_id: string;
  course_id: number;
  reason: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    matricule?: string;
    bu?: string;
    fonction?: string;
  } | null;
  courses?: {
    title?: string;
    duree?: string;
  } | null;
}

export interface ProgressRecord {
  id?: number;
  user_id: string;
  course_id: number;
  completed: boolean;
  score?: number | null;
  completed_at?: string | null;
}
