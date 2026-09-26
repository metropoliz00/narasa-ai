import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserRole,
  UserProfile,
  LearningMission,
  StudentActivitySession,
  PresentationSlide,
  AILearningBridgeResult,
  StudentAnswers,
  StudentReflection,
  PeerQuestion,
  StudentGroup,
  ConceptQuiz,
  QuizSubmission,
  GroupObservationRecord,
  PresentationSettings,
  Subject
} from './types';
import {
  DEMO_USERS,
  INITIAL_SYSTEM_USERS,
  DEFAULT_MISSIONS,
  FREE_EXPLORATION_MISSION,
  INITIAL_COMPLETED_SESSION,
  CLASS_STUDENTS_PROFILES,
  TEACHER_INSIGHTS,
  ASSESSMENT_DATA
} from './data/mockData';
import {
  INITIAL_GROUPS,
  INITIAL_CONCEPT_QUIZZES,
  INITIAL_QUIZ_SUBMISSIONS,
  INITIAL_GROUP_OBSERVATIONS,
  DEFAULT_PRESENTATION_SETTINGS
} from './data/quizAndGroupData';
import { getDefaultAvatar, UserGender } from './data/avatarData';
import { Navbar } from './components/Navbar';
import { StudentBottomNav, StudentTab } from './components/StudentBottomNav';
import { SchoolClassBadge } from './components/SchoolClassBadge';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { AIScanningAnimation } from './components/AIScanningAnimation';
import { LearningBridgeCards } from './components/LearningBridgeCards';
import { ChallengeStep } from './components/ChallengeStep';
import { ReflectionModal } from './components/ReflectionModal';
import { PresentationEditor } from './components/PresentationEditor';
import { PresentationViewer } from './components/PresentationViewer';
import { PortfolioGallery } from './components/PortfolioGallery';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentQuizHub } from './components/StudentQuizHub';
import { MissionCreatorModal } from './components/MissionCreatorModal';
import { ClassroomPresentationModal } from './components/ClassroomPresentationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { UserAccountModal } from './components/UserAccountModal';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { LoginModal } from './components/LoginModal';
import { LoginScreen } from './components/LoginScreen';
import { ToastContainer, toast } from './components/Toast';
import studentBannerBg from './assets/images/student_banner_bg_1789741989581.jpg';
import { AIClientService } from './services/aiClientService';
import {
  dbFetchUsers,
  dbFetchMissions,
  dbFetchSessions,
  dbUpsertUser,
  dbDeleteUser,
  dbUpsertMission,
  dbUpsertSession,
  isSupabaseConfigured
} from './lib/supabase';
import {
  Camera,
  Sparkles,
  BookOpen,
  ArrowRight,
  FolderKanban,
  Play,
  HelpCircle,
  Lightbulb,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Mic,
  X,
  Award,
  Trophy,
  TrendingUp,
  Activity
} from 'lucide-react';

export const normalizeUserAvatar = (u: UserProfile): UserProfile => {
  let gender: UserGender = u.gender || 'male';
  if (!u.gender) {
    const femaleKeywords = ['siti', 'nabila', 'ratna', 'rahma', 'zahra', 'putri', 'nurul', 'dewi', 'ibu', 'ani', 'rina', 'lia', 'ayu', 'fatimah', 'aisyah', 'anisa', 'fitri', 'wulan'];
    const lower = (u.name || '').toLowerCase();
    if (femaleKeywords.some((kw) => lower.includes(kw))) {
      gender = 'female';
    } else {
      gender = 'male';
    }
  }

  // Ensure avatar is ALWAYS a 100% valid Base64 string (either custom upload or default character base64)
  const isCustomBase64 = u.avatar && u.avatar.startsWith('data:image');
  const avatar = isCustomBase64 ? u.avatar : getDefaultAvatar(u.role, gender);

  return {
    ...u,
    gender,
    avatar
  };
};

export default function App() {
  // User Management state with localStorage persistence
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_users_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(
            (u: UserProfile) =>
              u.email !== 'maya.lestari@sdn01nusantara.sch.id' &&
              u.id !== 'user-teacher-2'
          );
          const normalized = filtered.map(normalizeUserAvatar);
          try {
            localStorage.setItem('narasa_users_data', JSON.stringify(normalized));
          } catch (e) {}
          return normalized;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const initialNormalized = INITIAL_SYSTEM_USERS.map(normalizeUserAvatar);
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(initialNormalized));
    } catch (e) {}
    return initialNormalized;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('narasa_is_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const isAuthStored = localStorage.getItem('narasa_is_authenticated') === 'true';
      if (isAuthStored) {
        const savedUserId = localStorage.getItem('narasa_active_user_id');
        if (savedUserId && savedUserId !== 'user-teacher-2') {
          const savedUsersJson = localStorage.getItem('narasa_users_data');
          if (savedUsersJson) {
            const parsed = JSON.parse(savedUsersJson);
            if (Array.isArray(parsed)) {
              const foundInSaved = parsed.find((u: UserProfile) => u.id === savedUserId && u.email !== 'maya.lestari@sdn01nusantara.sch.id');
              if (foundInSaved) return normalizeUserAvatar(foundInSaved);
            }
          }
          const found = INITIAL_SYSTEM_USERS.find(u => u.id === savedUserId && u.email !== 'maya.lestari@sdn01nusantara.sch.id');
          if (found) return normalizeUserAvatar(found);
        }
      }
    } catch (e) {}
    return normalizeUserAvatar(INITIAL_SYSTEM_USERS[0]);
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser.role);

  // Login & Account Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalEditingUser, setAccountModalEditingUser] = useState<UserProfile | null>(null);
  const [accountModalDefaultRole, setAccountModalDefaultRole] = useState<UserRole>('student');

  // Missions & Sessions state
  const [missions, setMissions] = useState<LearningMission[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_missions_data_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MISSIONS;
  });
  const [sessions, setSessions] = useState<StudentActivitySession[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_sessions_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [INITIAL_COMPLETED_SESSION];
  });
  const [activeMission, setActiveMission] = useState<LearningMission | null>(null);

  const handleToggleMissionActive = (missionId: string) => {
    setMissions((prev) => {
      const updated = prev.map((m) => (m.id === missionId ? { ...m, isActive: !m.isActive } : m));
      try {
        localStorage.setItem('narasa_missions_data_v3', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    const target = missions.find((m) => m.id === missionId);
    if (target) {
      if (!target.isActive) {
        toast.success('Misi Diaktifkan untuk Murid', target.title);
      } else {
        toast.info('Misi Dinonaktifkan', target.title);
      }
    }
  };

  // Student Groups & Concept Quizzes State
  const [groups, setGroups] = useState<StudentGroup[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_groups_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_GROUPS;
  });

  const [conceptQuizzes, setConceptQuizzes] = useState<ConceptQuiz[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_concept_quizzes_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CONCEPT_QUIZZES;
  });

  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_quiz_submissions_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_QUIZ_SUBMISSIONS;
  });

  // Group Observations state with local storage
  const [groupObservations, setGroupObservations] = useState<GroupObservationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('narasa_group_observations_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_GROUP_OBSERVATIONS;
  });

  // Presentation Settings state with local storage
  const [presentationSettings, setPresentationSettings] = useState<PresentationSettings>(() => {
    try {
      const saved = localStorage.getItem('narasa_presentation_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mode) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PRESENTATION_SETTINGS;
  });

  const handleSaveGroupObservation = (record: GroupObservationRecord) => {
    setGroupObservations((prev) => {
      const filtered = prev.filter((r) => r.id !== record.id && r.groupId !== record.groupId);
      const updated = [record, ...filtered];
      try {
        localStorage.setItem('narasa_group_observations_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdatePresentationSettings = (newSettings: PresentationSettings) => {
    setPresentationSettings(newSettings);
    try {
      localStorage.setItem('narasa_presentation_settings', JSON.stringify(newSettings));
    } catch (e) {}
  };

  // Student Navigation Tab
  const [studentTab, setStudentTab] = useState<StudentTab>('home');
  const [studentSelectedSubjectId, setStudentSelectedSubjectId] = useState<string>('all');

  // Student progress metrics
  const studentSessions = sessions.filter((s) => s.studentId === currentUser.id);
  const studentCompletedSessions = studentSessions.filter((s) => s.status === 'completed');
  const studentQuizSubmissions = quizSubmissions.filter((qs) => qs.userId === currentUser.id);

  const totalLit = studentCompletedSessions.reduce((acc, s) => acc + (s.metrics?.literacyScore || 0), 0);
  const avgLit = studentCompletedSessions.length > 0 ? Math.round(totalLit / studentCompletedSessions.length) : 0;

  const totalNum = studentCompletedSessions.reduce((acc, s) => acc + (s.metrics?.numeracyScore || 0), 0);
  const avgNum = studentCompletedSessions.length > 0 ? Math.round(totalNum / studentCompletedSessions.length) : 0;

  const totalReason = studentCompletedSessions.reduce((acc, s) => acc + (s.metrics?.reasoningScore || 0), 0);
  const avgReason = studentCompletedSessions.length > 0 ? Math.round(totalReason / studentCompletedSessions.length) : 0;

  const totalScaffoldingUsed = studentCompletedSessions.reduce((acc, s) => acc + (s.metrics?.scaffoldingUsedCount || 0), 0);

  const hasCompletedData = studentCompletedSessions.length > 0;

  const getPredicateInfo = (score: number, hasData: boolean) => {
    if (!hasData) return { label: 'Belum Ada Data', color: 'text-slate-400 bg-slate-50 border-slate-200' };
    if (score >= 85) return { label: 'Sangat Mahir', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { label: 'Mahir', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 50) return { label: 'Cakap', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Perlu Bimbingan', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const studentLitPred = getPredicateInfo(avgLit, hasCompletedData);
  const studentNumPred = getPredicateInfo(avgNum, hasCompletedData);
  const studentReasonPred = getPredicateInfo(avgReason, hasCompletedData);
  const [adminTab, setAdminTab] = useState<'accounts' | 'config' | 'schools' | 'school_settings'>('accounts');

  const handleNavigateToSchoolSettings = () => {
    setAdminTab('school_settings');
    if (currentRole !== 'admin' && currentRole !== 'school_admin' && currentRole !== 'central_admin') {
      const adminUser = users.find((u) => u.role === 'school_admin' || u.role === 'central_admin' || u.role === 'admin') || currentUser;
      handleLogin(adminUser);
      setCurrentRole(adminUser.role);
    }
  };

  const handleUpdateSchoolName = (schoolId: string, newSchoolName: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.schoolId === schoolId) {
          return { ...u, schoolName: newSchoolName };
        }
        return u;
      });
      try {
        localStorage.setItem('narasa_system_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser.schoolId === schoolId) {
      setCurrentUser((prev) => ({ ...prev, schoolName: newSchoolName }));
    }
  };

  // Determine if presentation tab is allowed based on teacher setting and current user
  const isPresentationAllowed = (() => {
    if (currentUser.role === 'teacher' || currentUser.role === 'admin') return true;
    if (presentationSettings.mode === 'both') return true;
    if (presentationSettings.mode === 'group_only') return Boolean(currentUser.isGroup);
    if (presentationSettings.mode === 'individual_only') return !currentUser.isGroup;
    return true;
  })();

  // Initial load from Supabase / Remote Database
  const refreshDatabase = useCallback(async () => {
    try {
      const [remoteUsers, remoteMissions, remoteSessions] = await Promise.all([
        dbFetchUsers(),
        dbFetchMissions(),
        dbFetchSessions()
      ]);
      if (isSupabaseConfigured()) {
        setUsers(remoteUsers || []);
        setMissions(remoteMissions || []);
        setSessions(remoteSessions || []);

        const isAuthStored = localStorage.getItem('narasa_is_authenticated') === 'true';
        if (isAuthStored) {
          const activeUsersList = remoteUsers || [];
          if (activeUsersList.length > 0) {
            const savedUserId = localStorage.getItem('narasa_active_user_id');
            const found = activeUsersList.find(u => u.id === savedUserId);
            if (found) {
              setCurrentUser(found);
              setCurrentRole(found.role);
              setIsAuthenticated(true);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } else {
        if (remoteUsers && remoteUsers.length > 0) {
          setUsers(remoteUsers);
        }
        if (remoteMissions && remoteMissions.length > 0) {
          setMissions(remoteMissions);
        }
        if (remoteSessions && remoteSessions.length > 0) {
          setSessions(remoteSessions);
        }
      }
    } catch (err) {
      console.warn('Database load fallback:', err);
    }
  }, []);

  useEffect(() => {
    refreshDatabase();
  }, [refreshDatabase]);

  // Interactive Learning Workflow States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeLearningBridge, setActiveLearningBridge] = useState<AILearningBridgeResult | null>(null);
  const [currentCapturedImage, setCurrentCapturedImage] = useState<string | null>(null);
  const [currentImageLabel, setCurrentImageLabel] = useState<string>('Foto Murid');
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [completedStudentAnswers, setCompletedStudentAnswers] = useState<StudentAnswers | null>(null);
  const [scaffoldingHistory, setScaffoldingHistory] = useState<{ questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]>([]);

  // Auto-save active exploration session to localStorage
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    const explorationDraftKey = `narasa_active_exploration_${currentUser.id}`;
    if (activeLearningBridge && currentCapturedImage) {
      try {
        localStorage.setItem(
          explorationDraftKey,
          JSON.stringify({
            activeLearningBridge,
            currentCapturedImage,
            currentImageLabel,
            isChallengeActive,
            activeMissionId: activeMission?.id || null,
            updatedAt: new Date().toISOString()
          })
        );
      } catch (e) {}
    } else if (!isChallengeActive && !isReflectionOpen) {
      try {
        localStorage.removeItem(explorationDraftKey);
      } catch (e) {}
    }
  }, [isAuthenticated, activeLearningBridge, currentCapturedImage, currentImageLabel, isChallengeActive, isReflectionOpen, activeMission, currentUser?.id]);

  // Restore active exploration session draft on initial load
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id || activeLearningBridge) return;
    try {
      const explorationDraftKey = `narasa_active_exploration_${currentUser.id}`;
      const saved = localStorage.getItem(explorationDraftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.activeLearningBridge && parsed.currentCapturedImage) {
          if (parsed.updatedAt) {
            const draftAgeMs = Date.now() - new Date(parsed.updatedAt).getTime();
            if (draftAgeMs > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(explorationDraftKey);
              return;
            }
          }
          setActiveLearningBridge(parsed.activeLearningBridge);
          setCurrentCapturedImage(parsed.currentCapturedImage);
          setCurrentImageLabel(parsed.currentImageLabel || 'Foto Murid');
          setIsChallengeActive(Boolean(parsed.isChallengeActive));
          if (parsed.activeMissionId) {
            const foundMission = missions.find((m) => m.id === parsed.activeMissionId);
            if (foundMission) setActiveMission(foundMission);
          }
        }
      }
    } catch (e) {}
  }, [isAuthenticated, currentUser?.id, missions]);

  // Active Presentation States
  const [activeSlides, setActiveSlides] = useState<PresentationSlide[]>([]);
  const [isPlayingFullscreen, setIsPlayingFullscreen] = useState(false);
  const [activeSessionForViewer, setActiveSessionForViewer] = useState<StudentActivitySession | null>(null);

  // Teacher Modals
  const [isNewMissionModalOpen, setIsNewMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<LearningMission | null>(null);
  const [isClassroomProjectorOpen, setIsClassroomProjectorOpen] = useState(false);

  // Dynamic Subjects state
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('narasa_subjects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'matematika', name: 'Matematika' },
      { id: 'ipas', name: 'IPAS' },
      { id: 'bahasa_indonesia', name: 'Bahasa Indonesia' },
      { id: 'pancasila', name: 'Pendidikan Pancasila' },
      { id: 'seni_budaya', name: 'Seni Budaya' }
    ];
  });

  const handleAddSubject = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    if (subjects.some((s) => s.id === id)) {
      toast.error('Mata Pelajaran Sudah Ada', `Mata pelajaran "${cleanName}" sudah terdaftar.`);
      return;
    }
    const updated = [...subjects, { id, name: cleanName }];
    setSubjects(updated);
    localStorage.setItem('narasa_subjects', JSON.stringify(updated));
    toast.success('Mata Pelajaran Ditambahkan', `Mata pelajaran "${cleanName}" berhasil ditambahkan.`);
  };

  const handleDeleteSubject = (id: string) => {
    const subjectToDelete = subjects.find((s) => s.id === id);
    if (!subjectToDelete) return;
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    localStorage.setItem('narasa_subjects', JSON.stringify(updated));
    toast.success('Mata Pelajaran Dihapus', `Mata pelajaran "${subjectToDelete.name}" berhasil dihapus.`);
  };

  const handleOpenNewMissionModal = () => {
    setEditingMission(null);
    setIsNewMissionModalOpen(true);
  };

  const handleOpenEditMissionModal = (mission: LearningMission) => {
    setEditingMission(mission);
    setIsNewMissionModalOpen(true);
  };

  // User Account Actions
  const handleAddUser = (userData: Omit<UserProfile, 'id'>) => {
    const rawUser: UserProfile = {
      ...userData,
      id: `user-${userData.role}-${Date.now()}`
    };
    const newUser = normalizeUserAvatar(rawUser);
    const updated = [newUser, ...users];
    setUsers(updated);
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(updated));
    } catch (e) {}
    toast.success('Pengguna Berhasil Ditambahkan', `Akun "${newUser.name}" (${newUser.role}) telah terdaftar.`);
    // Background cloud database persist
    dbUpsertUser(newUser).catch((e) => console.warn('Supabase upsert user:', e));
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const normalizedUser = normalizeUserAvatar(updatedUser);
    const updated = users.map((u) => (u.id === normalizedUser.id ? normalizedUser : u));
    setUsers(updated);
    if (currentUser.id === normalizedUser.id) {
      setCurrentUser(normalizedUser);
      setCurrentRole(normalizedUser.role);
    }
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(updated));
    } catch (e) {}
    toast.success('Profil Diperbarui', `Perubahan data "${normalizedUser.name}" berhasil disimpan.`);
    // Background cloud database persist
    dbUpsertUser(normalizedUser).catch((e) => console.warn('Supabase update user:', e));
  };

  const handleDeleteUser = (userId: string) => {
    const deleted = users.find((u) => u.id === userId);
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(updated));
    } catch (e) {}
    if (currentUser.id === userId) {
      const fallback = updated[0] || INITIAL_SYSTEM_USERS[0];
      setCurrentUser(fallback);
      setCurrentRole(fallback.role);
    }
    if (deleted) {
      toast.info('Pengguna Dihapus', `Akun "${deleted.name}" telah dihapus dari sistem.`);
    }
    // Background cloud database persist
    dbDeleteUser(userId).catch((e) => console.warn('Supabase delete user:', e));
  };

  const handleSwitchUser = (user: UserProfile, suppressToast = false) => {
    const normalizedUser = normalizeUserAvatar(user);
    if (currentUser && normalizedUser.id !== currentUser.id) {
      setActiveLearningBridge(null);
      setCurrentCapturedImage(null);
      setIsChallengeActive(false);
      setIsReflectionOpen(false);
      setCompletedStudentAnswers(null);
    }
    setCurrentUser(normalizedUser);
    setCurrentRole(normalizedUser.role);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('narasa_active_user_id', normalizedUser.id);
      localStorage.setItem('narasa_is_authenticated', 'true');
    } catch (e) {}
    if (!suppressToast) {
      const cleanName = normalizedUser.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim();
      toast.info('Beralih Pengguna', `Masuk sebagai ${cleanName}`);
    }
  };

  // Group Management Handlers (creates group & synchronizes student group login account)
  const handleSaveGroup = (group: StudentGroup, associatedUser: UserProfile) => {
    const groupExists = groups.some((g) => g.id === group.id);
    const updatedGroups = groupExists
      ? groups.map((g) => (g.id === group.id ? group : g))
      : [group, ...groups];

    setGroups(updatedGroups);
    try {
      localStorage.setItem('narasa_groups_data', JSON.stringify(updatedGroups));
    } catch (e) {}

    // Synchronize or create corresponding UserProfile so the group can login directly
    const userExists = users.some((u) => u.id === associatedUser.id || u.email === associatedUser.email);
    let updatedUsers: UserProfile[];
    if (userExists) {
      updatedUsers = users.map((u) => (u.id === associatedUser.id || u.email === associatedUser.email ? associatedUser : u));
    } else {
      updatedUsers = [associatedUser, ...users];
    }
    setUsers(updatedUsers);
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(updatedUsers));
    } catch (e) {}
    dbUpsertUser(associatedUser).catch((e) => console.warn('Supabase upsert group user:', e));
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = groups.filter((g) => g.id !== groupId);
    setGroups(updatedGroups);
    try {
      localStorage.setItem('narasa_groups_data', JSON.stringify(updatedGroups));
    } catch (e) {}

    // Also remove associated user
    const updatedUsers = users.filter((u) => u.groupId !== groupId && u.id !== `user-${groupId}`);
    setUsers(updatedUsers);
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(updatedUsers));
    } catch (e) {}
    dbDeleteUser(`user-${groupId}`).catch((e) => console.warn('Supabase delete group user:', e));
  };

  // Quiz Submission Handler & Teacher Manual Grading Handler
  const handleUpdateQuizSubmission = (submission: QuizSubmission) => {
    setQuizSubmissions((prev) => {
      const filtered = prev.filter((s) => s.id !== submission.id);
      const updated = [submission, ...filtered];
      try {
        localStorage.setItem('narasa_quiz_submissions_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSubmitQuizResult = (submission: QuizSubmission) => {
    handleUpdateQuizSubmission(submission);
  };

  // Add or Update Concept Quiz (e.g. AI-Generated Quizzes)
  const handleSaveConceptQuiz = (newQuiz: ConceptQuiz) => {
    setConceptQuizzes((prev) => {
      const filtered = prev.filter((q) => q.id !== newQuiz.id);
      const updated = [newQuiz, ...filtered];
      try {
        localStorage.setItem('narasa_concept_quizzes_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Handle Role Switching from Navbar Pill
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    const matched = users.find((u) => u.role === role) || INITIAL_SYSTEM_USERS.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      try {
        localStorage.setItem('narasa_active_user_id', matched.id);
      } catch (e) {}
    }
  };

  // Step 1: Camera capture confirmed -> Start AI Scanning & Analysis
  const handleConfirmPhoto = async (imageDataUrl: string, objectNameHint: string) => {
    setCurrentCapturedImage(imageDataUrl);
    setCurrentImageLabel(objectNameHint);
    setIsCameraOpen(false);
    setIsScanning(true);

    const targetMission = activeMission || FREE_EXPLORATION_MISSION;

    try {
      // Call AI Vision Analysis
      const bridgeResult = await AIClientService.analyzeImage(
        imageDataUrl,
        targetMission,
        objectNameHint
      );
      setActiveLearningBridge(bridgeResult);
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        toast.info(
          'Kuota AI Terbatas',
          'Coba beberapa saat lagi...'
        );
      } else {
        console.error('Analysis error:', err);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Step 2: From Learning Bridge -> Start Challenge
  const handleStartChallenge = (pemantikResponse?: string) => {
    if (pemantikResponse) {
      setCurrentImageLabel((prev) =>
        prev ? `${prev} | Respon Pemantik Siswa: ${pemantikResponse}` : `Respon Pemantik Siswa: ${pemantikResponse}`
      );
    }
    setIsChallengeActive(true);
  };

  // Step 3: Challenge completed -> Open 5-Question Reflection
  const handleChallengeComplete = (
    answers: StudentAnswers,
    scaffoldingUsed: { questionId: string; level: 1 | 2 | 3 | 4; hintText: string; requestedAt: string }[]
  ) => {
    setCompletedStudentAnswers(answers);
    setScaffoldingHistory(scaffoldingUsed);
    setIsChallengeActive(false);
    setIsReflectionOpen(true);
  };

  // Step 4: Reflection finished -> Generate Auto Presentation Slides
  const handleFinishReflection = async (reflection: StudentReflection) => {
    setIsReflectionOpen(false);

    if (activeLearningBridge && currentCapturedImage && completedStudentAnswers) {
      const currentMissionTarget = activeMission || FREE_EXPLORATION_MISSION;
      const tempSession: StudentActivitySession = {
        id: `session-${Date.now()}`,
        studentId: currentUser.id,
        studentName: currentUser.name,
        missionId: currentMissionTarget.id,
        missionTitle: currentMissionTarget.title,
        subject: currentMissionTarget.subject,
        image: currentCapturedImage,
        imageLabel: currentImageLabel,
        learningBridge: activeLearningBridge,
        answers: completedStudentAnswers,
        scaffoldingHistory,
        reflection,
        presentation: [],
        peerQuestions: [
          {
            id: `pq-${Date.now()}`,
            askerName: 'Siti Rahma',
            avatar: getDefaultAvatar('student', 'female'),
            question: `Apakah konsep ${currentMissionTarget.material} ini juga bisa kamu temukan di benda lain di rumahmu?`,
            aiCoachHint: 'Jawab dengan memberikan contoh nyata benda lain yang memiliki pola serupa.',
            timestamp: 'Baru saja'
          }
        ],
        completedAt: new Date().toISOString().split('T')[0],
        status: 'completed',
        metrics: {
          literacyScore: 88,
          numeracyScore: 92,
          reasoningScore: 90,
          scaffoldingUsedCount: scaffoldingHistory.length
        }
      };

      // Generate slides via AI Service
      const generatedSlides = await AIClientService.generateAutoPresentation(tempSession);
      const finalSession: StudentActivitySession = {
        ...tempSession,
        presentation: generatedSlides.length > 0 ? generatedSlides : []
      };

      const updatedSessions = [finalSession, ...sessions.filter((s) => s.id !== finalSession.id)];
      setSessions(updatedSessions);

      // Save to localStorage immediately so student work is always preserved locally
      try {
        localStorage.setItem('narasa_sessions_data', JSON.stringify(updatedSessions));
        if (currentUser?.id) {
          localStorage.removeItem(`narasa_active_exploration_${currentUser.id}`);
          localStorage.removeItem(`narasa_challenge_draft_${currentUser.id}_${currentMissionTarget.id}`);
          localStorage.removeItem(`narasa_reflection_draft_${currentUser.id}`);
        }
        localStorage.removeItem('narasa_challenge_draft_current');
        localStorage.removeItem('narasa_reflection_draft_current');
      } catch (e) {}

      // DIRECTLY push into database (both /api/sessions and Supabase)
      dbUpsertSession(finalSession).catch((err) => {
        console.warn('Gagal menyimpan karya portofolio ke database:', err);
      });

      setActiveSlides(finalSession.presentation);
      setActiveSessionForViewer(finalSession);
      setActiveLearningBridge(null);

      if (!isAuthenticated) {
        setIsPlayingFullscreen(true);
      } else if (currentRole === 'student') {
        setStudentTab('present');
      }

      toast.success(
        'Jawaban Disimpan & Masuk Database! 🎉',
        'Karyamu telah tersimpan di Local Storage perangkat dan langsung masuk ke database portofolio murid.'
      );

      // Celebration Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // safe
      }
    }
  };

  // Open Fullscreen Presentation Viewer
  const handleLaunchPresentation = (sessionToPlay?: StudentActivitySession) => {
    if (sessionToPlay) {
      setActiveSessionForViewer(sessionToPlay);
      setActiveSlides(sessionToPlay.presentation);
    }
    setIsPlayingFullscreen(true);
  };

  // Answer a peer question
  const handleAddPeerAnswer = (qId: string, answer: string) => {
    if (!activeSessionForViewer) return;
    const updated = sessions.map((s) => {
      if (s.id === activeSessionForViewer.id) {
        const newQuestions = s.peerQuestions.map((q) => {
          if (q.id === qId) {
            return { ...q, presenterAnswer: answer };
          }
          return q;
        });
        return { ...s, peerQuestions: newQuestions };
      }
      return s;
    });
    setSessions(updated);
    setActiveSessionForViewer((prev) =>
      prev
        ? {
            ...prev,
            peerQuestions: prev.peerQuestions.map((q) =>
              q.id === qId ? { ...q, presenterAnswer: answer } : q
            )
          }
        : null
    );
    toast.success('Tanggapan Terkirim', 'Jawaban berhasil ditambahkan ke sesi tanya-jawab.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLoginModalOpen(false);
    setActiveLearningBridge(null);
    setCurrentCapturedImage(null);
    setIsChallengeActive(false);
    setIsReflectionOpen(false);
    setCompletedStudentAnswers(null);
    setActiveMission(null);
    try {
      localStorage.removeItem('narasa_is_authenticated');
      localStorage.removeItem('narasa_active_user_id');
      if (currentUser?.id) {
        localStorage.removeItem(`narasa_active_exploration_${currentUser.id}`);
      }
      localStorage.removeItem('narasa_challenge_draft_current');
      localStorage.removeItem('narasa_reflection_draft_current');
    } catch (e) {}
    toast.info('Keluar Akun', 'Sesi login telah selesai.');
  };

  const handleLogin = (user: UserProfile) => {
    handleSwitchUser(user, true);
    setIsAuthenticated(true);
    // Remove role tags/brackets like [student, dsb] from the welcome message, ensuring it displays clean name only
    const cleanName = user.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim();
    toast.success(
      'Berhasil Masuk!',
      `Selamat datang, ${cleanName}`
    );
  };

  return (
    <div className="min-h-screen text-[#25324B] flex flex-col font-body">
      {/* Top Navbar */}
      <Navbar
        isAuthenticated={isAuthenticated}
        currentRole={currentRole}
        currentUser={currentUser}
        studentTab={studentTab}
        isPresentationAllowed={isPresentationAllowed}
        onSelectStudentTab={setStudentTab}
        onOpenDemoJourney={() => {
          // Open demo pedagogical journey directly without switching account or logging in
          handleConfirmPhoto(
            'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
            'Pola Susunan Undakan Tangga & Ubin Sekolah'
          );
        }}
        onStartExploration={() => {
          setActiveMission(null);
          setIsCameraOpen(true);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenEditProfile={() => {
          setAccountModalEditingUser(currentUser);
          setIsAccountModalOpen(true);
        }}
        onNavigateToAdmin={() => {
          const adminUser = users.find((u) => u.role === 'admin') || currentUser;
          handleLogin(adminUser);
          setCurrentRole('admin');
        }}
      />

      {/* Main Role Routing Canvas */}
      <main className="flex-1 pb-24 md:pb-12">
        {/* Active Pedagogical Journey Mode (Accessible directly in demo or active student session without switching user) */}
        {activeLearningBridge && currentCapturedImage ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Active Challenge Flow Mode */}
            {isChallengeActive ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsChallengeActive(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    ← Kembali ke Kartu Jembatan Pembelajaran
                  </button>
                  <span className="text-xs font-bold text-[#4F8EF7] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Misi: {activeMission?.title || 'Eksplorasi Kontekstual'}
                  </span>
                </div>
                <ChallengeStep
                  questions={activeLearningBridge.questions}
                  learningBridge={activeLearningBridge}
                  photoUrl={currentCapturedImage}
                  studentId={currentUser?.id}
                  missionId={activeMission?.id || 'misi-eksplorasi'}
                  onCompleteChallenge={handleChallengeComplete}
                />
              </div>
            ) : (
              /* Active Learning Bridge View Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveLearningBridge(null);
                      if (isAuthenticated && currentRole === 'student') {
                        setIsCameraOpen(true);
                      }
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    ← {isAuthenticated && currentRole === 'student' ? 'Ambil Foto Lain' : 'Kembali'}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4F8EF7] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Misi: {activeMission?.title || 'Eksplorasi Kontekstual'}
                    </span>
                  </div>
                </div>
                <LearningBridgeCards
                  bridgeResult={activeLearningBridge}
                  photoUrl={currentCapturedImage}
                  imageLabel={currentImageLabel}
                  onStartChallenge={handleStartChallenge}
                  onRetakePhoto={() => {
                    setActiveLearningBridge(null);
                    if (isAuthenticated && currentRole === 'student') {
                      setIsCameraOpen(true);
                    }
                  }}
                />
              </div>
            )}
          </div>
        ) : !isAuthenticated ? (
          <LoginScreen
            users={users}
            onLogin={handleLogin}
            onOpenRegisterModal={(role) => {
              setAccountModalEditingUser(null);
              setAccountModalDefaultRole(role || 'student');
              setIsAccountModalOpen(true);
            }}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onStartExploration={() => {
              // Set to student role first and open camera
              const studentUser = users.find((u) => u.role === 'student') || currentUser;
              handleLogin(studentUser);
              setIsCameraOpen(true);
            }}
          />
        ) : (
          <>
            {/* ==================== TEACHER VIEW ==================== */}
            {currentRole === 'teacher' && (
              <TeacherDashboard
                missions={missions}
                sessions={sessions}
                studentsProfiles={CLASS_STUDENTS_PROFILES}
                insights={TEACHER_INSIGHTS}
                assessments={ASSESSMENT_DATA}
                users={users}
                currentUser={currentUser}
                groups={groups}
                quizSubmissions={quizSubmissions}
                conceptQuizzes={conceptQuizzes}
                groupObservations={groupObservations}
                presentationSettings={presentationSettings}
                subjects={subjects}
                onAddSubject={handleAddSubject}
                onDeleteSubject={handleDeleteSubject}
                onSaveGroupObservation={handleSaveGroupObservation}
                onUpdatePresentationSettings={handleUpdatePresentationSettings}
                onOpenNewMissionModal={handleOpenNewMissionModal}
                onOpenEditMissionModal={handleOpenEditMissionModal}
                onOpenClassroomPresentation={() => setIsClassroomProjectorOpen(true)}
                onViewSessionDetail={(s) => {
                  setActiveSessionForViewer(s);
                  setActiveSlides(s.presentation);
                  setIsPlayingFullscreen(true);
                }}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onSwitchUser={handleSwitchUser}
                onSaveGroup={handleSaveGroup}
                onDeleteGroup={handleDeleteGroup}
                onUpdateQuizSubmission={handleUpdateQuizSubmission}
                onAddCustomQuiz={handleSaveConceptQuiz}
                onToggleMissionActive={handleToggleMissionActive}
              />
            )}

            {/* ==================== ADMIN VIEW (School Admin & Central Admin) ==================== */}
            {(currentRole === 'admin' || currentRole === 'school_admin' || currentRole === 'central_admin') && (
              <AdminDashboard
                users={users}
                currentUser={currentUser}
                missions={missions}
                sessions={sessions}
                groups={groups}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onSwitchUser={handleSwitchUser}
                onRefreshData={refreshDatabase}
              />
            )}

        {/* ==================== STUDENT VIEW ==================== */}
        {currentRole === 'student' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div key={studentTab} className="animate-tab-fade space-y-6">
              {/* 1. STUDENT HOME TAB */}
              {studentTab === 'home' && (
                  <div className="space-y-5 sm:space-y-6 text-left">
                    {/* Hero Student Banner (With Relevant Literacy & Numeracy Visual Background on Light Theme) */}
                    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-md relative overflow-hidden group border border-slate-200/90 bg-white">
                      {/* Panoramic Background Image - High Visibility */}
                      <img
                        src={studentBannerBg}
                        alt="Eksplorasi Literasi dan Numerasi Murid"
                        className="absolute inset-0 w-full h-full object-cover object-right sm:object-center group-hover:scale-102 transition-transform duration-700 opacity-80 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      {/* Crisp Light White Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/90 to-transparent sm:w-3/4 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/40 pointer-events-none" />

                      <div className="relative z-10 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs backdrop-blur-sm">
                            <span>Halo, {currentUser.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim()}! 👋</span>
                          </div>
                          {currentUser.isGroup ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs backdrop-blur-sm">
                                👥 Kelompok ({currentUser.groupMembers?.length || 0} Anggota)
                              </span>
                              <button
                                onClick={() => {
                                  setAccountModalEditingUser(currentUser);
                                  setIsAccountModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer active:scale-95 min-h-[32px]"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Foto Kelompok</span>
                              </button>
                            </>
                          ) : (
                            <SchoolClassBadge classNameStr={currentUser.className} schoolNameStr={currentUser.schoolName} size="md" />
                          )}
                        </div>

                        {currentUser.isGroup && currentUser.groupMembers && currentUser.groupMembers.length > 0 && (
                          <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">Anggota Tim:</span>
                            {currentUser.groupMembers.map((m, mIdx) => (
                              <span key={mIdx} className="px-2 py-0.5 rounded-md bg-white/95 border border-amber-200 text-amber-900 text-[11px] font-medium shadow-xs">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}

                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold font-display leading-snug sm:leading-tight text-[#1E293B]">
                          Foto Lingkungan Sekitar, Bangun Penalaran!
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-700 max-w-xl leading-relaxed">
                          Eksplorasi fenomena nyata di sekitarmu melalui fotografi kontekstual. Amati objek di sekitar, temukan keteraturan sains serta pola numerasi, lalu kembangkan penalaran kritismu!
                        </p>
                        <div className="pt-1 flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center sm:items-center gap-2 sm:gap-2.5">
                          <button
                            onClick={() => {
                              setActiveMission(null);
                              setIsCameraOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Ambil Foto Eksplorasi</span>
                          </button>
                          <button
                            onClick={() => setStudentTab('explore')}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:text-blue-600 transition-all cursor-pointer shadow-2xs min-h-[44px]"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Pilih Misi Belajar</span>
                          </button>
                        </div>
                      </div>

                      {/* 5-Step Process Explainer (Soft Pastel, Literasi & Numerasi Aligned Cards) */}
                      <div className="relative z-10 mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2.5 text-center text-[10px] sm:text-[11px] font-extrabold">
                        <div className="py-2.5 px-2 rounded-2xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 text-amber-900 shadow-2xs hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1">
                          <span className="text-base">📸</span>
                          <span>1. Foto Misi</span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md">Objek Nyata</span>
                        </div>
                        <div className="py-2.5 px-2 rounded-2xl bg-sky-50/90 hover:bg-sky-100/90 border border-sky-200/90 text-sky-950 shadow-2xs hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1">
                          <span className="text-base">🔗</span>
                          <span>2. Jembatan Konsep</span>
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.2 rounded-md">📖 Literasi</span>
                        </div>
                        <div className="py-2.5 px-2 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/90 text-indigo-950 shadow-2xs hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1">
                          <span className="text-base">💡</span>
                          <span>3. Nalar Kritis</span>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded-md">📐 Numerasi</span>
                        </div>
                        <div className="py-2.5 px-2 rounded-2xl bg-rose-50/90 hover:bg-rose-100/90 border border-rose-200/90 text-rose-950 shadow-2xs hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1">
                          <span className="text-base">🤔</span>
                          <span>4. Refleksi Diri</span>
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded-md">Evaluasi</span>
                        </div>
                        <div className="col-span-2 xs:col-span-1 sm:col-span-1 py-2.5 px-2 rounded-2xl bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-950 shadow-2xs hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1">
                          <span className="text-base">🎤</span>
                          <span>5. Presentasi</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md">Komunikasi</span>
                        </div>
                      </div>
                    </div>

                    {/* 1.1 DASBOR PROGRES & KEMAMPUAN BELAJAR */}
                    <div className="bg-gradient-to-b from-slate-50/70 via-white to-blue-50/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs shrink-0">
                            <Trophy className="w-5 h-5 text-white" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="text-sm sm:text-lg font-extrabold text-[#25324B] font-display leading-tight flex items-center gap-1.5 flex-wrap">
                              Dasbor Progres Belajarmu 🚀
                              <span className="text-[9px] sm:text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-300 font-bold uppercase tracking-wider">Live</span>
                            </h2>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">
                              Pantau pencapaian dan kedalaman pemahaman literasi & numerasimu setiap hari!
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl self-start sm:self-auto shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span className="text-[10px] font-bold text-emerald-800">Sinkronisasi Aktif</span>
                        </div>
                      </div>

                      {/* 3 Main Capabilities Progress in Soft Themed Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                        {/* 1. Literasi Sains (Soft Emerald & Mint) */}
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border-2 border-emerald-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-left">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 text-sm">🌱</span>
                              Literasi Sains & Teks
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${studentLitPred.color}`}>
                              {studentLitPred.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-display">{avgLit}</span>
                            <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                            <span className="ml-auto text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                              📖 Dimensi L1-L6
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-emerald-100/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-emerald-200">
                            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgLit}%` }}></div>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-snug italic pt-0.5 font-medium">
                            Mengamati detail objek nyata & mengaitkan fenomena lingkungan dengan konsep ilmiah logis.
                          </p>
                        </div>

                        {/* 2. Numerasi Kontekstual (Soft Sky & Blue) */}
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/60 border-2 border-sky-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-left">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                              <span className="p-1 rounded-lg bg-sky-100 text-sky-800 text-sm">📐</span>
                              Numerasi Kontekstual
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${studentNumPred.color}`}>
                              {studentNumPred.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-2xl sm:text-3xl font-black text-sky-950 font-display">{avgNum}</span>
                            <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                            <span className="ml-auto text-[10px] font-extrabold text-sky-700 bg-sky-100/90 px-2 py-0.5 rounded-md">
                              🔢 Dimensi N1-N8
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-sky-100/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-sky-200">
                            <div className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgNum}%` }}></div>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-snug italic pt-0.5 font-medium">
                            Mengenali pola matematika, menghitung data empiris, dan menarik relasi kuantitatif.
                          </p>
                        </div>

                        {/* 3. Penalaran Kritis & HOTS (Soft Lavender & Purple) */}
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/60 border-2 border-purple-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-left">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                              <span className="p-1 rounded-lg bg-purple-100 text-purple-800 text-sm">💡</span>
                              Penalaran Kritis (HOTS)
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${studentReasonPred.color}`}>
                              {studentReasonPred.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-2xl sm:text-3xl font-black text-purple-950 font-display">{avgReason}</span>
                            <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                            <span className="ml-auto text-[10px] font-extrabold text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded-md">
                              ✨ Berpikir Komputasional
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-purple-100/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-purple-200">
                            <div className="bg-gradient-to-r from-purple-400 to-fuchsia-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgReason}%` }}></div>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-snug italic pt-0.5 font-medium">
                            Merancang solusi inovatif, membangun argumen logis, dan berpikir mandiri.
                          </p>
                        </div>
                      </div>

                      {/* Stat Summary Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
                        {/* Misi Selesai */}
                        <div className="bg-gradient-to-br from-indigo-50/80 to-white hover:to-indigo-50 rounded-2xl p-3 border border-indigo-200/80 flex items-center gap-2.5 transition-all text-left shadow-2xs">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-extrabold text-indigo-700 block uppercase tracking-wider truncate">Misi Selesai</span>
                            <strong className="text-xs font-extrabold text-slate-900 block truncate">{studentCompletedSessions.length} Aktivitas</strong>
                          </div>
                        </div>

                        {/* Kuis Diikuti */}
                        <div className="bg-gradient-to-br from-amber-50/80 to-white hover:to-amber-50 rounded-2xl p-3 border border-amber-200/80 flex items-center gap-2.5 transition-all text-left shadow-2xs">
                          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-extrabold text-amber-700 block uppercase tracking-wider truncate">Kuis Diikuti</span>
                            <strong className="text-xs font-extrabold text-slate-900 block truncate">{studentQuizSubmissions.length} Asesmen</strong>
                          </div>
                        </div>

                        {/* Tutor Bantuan (Scaffolding) */}
                        <div className="bg-gradient-to-br from-teal-50/80 to-white hover:to-teal-50 rounded-2xl p-3 border border-teal-200/80 flex items-center gap-2.5 transition-all text-left shadow-2xs">
                          <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-extrabold text-teal-700 block uppercase tracking-wider truncate">Bantuan Tutor</span>
                            <strong className="text-xs font-extrabold text-slate-900 block truncate">{totalScaffoldingUsed} Petunjuk</strong>
                          </div>
                        </div>

                        {/* Pencapaian Lencana */}
                        <div className="bg-gradient-to-br from-purple-50/80 to-white hover:to-purple-50 rounded-2xl p-3 border border-purple-200/80 flex items-center gap-2.5 transition-all text-left shadow-2xs">
                          <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-extrabold text-purple-700 block uppercase tracking-wider truncate">Pencapaian</span>
                            <strong className="text-xs font-extrabold text-slate-900 block truncate">
                              {studentCompletedSessions.length >= 3 ? 'Bintang 3 🌟' : studentCompletedSessions.length >= 1 ? 'Bintang 1 ⭐' : 'Pionir Belajar'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Uji Pemahaman Konsep Section with Soft Warm Theme */}
                    <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 rounded-3xl p-6 sm:p-7 text-slate-900 shadow-sm border-2 border-amber-200/90 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                      <div className="relative z-10 space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Asesmen Pemahaman Konsep • Literasi & Numerasi</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1E293B]">
                          Uji Pemahaman Konsep {currentUser.isGroup ? 'Kelompok' : 'Murid'} 🎯
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          Kerjakan soal uji pemahaman literasi & numerasi berbasis HOTS untuk mengukur sejauh mana kamu memahami konsep sains dan matematika dari objek sekitar.
                        </p>
                      </div>
                      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                        <button
                          onClick={() => setStudentTab('quiz')}
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/30 transition-all cursor-pointer"
                        >
                          <Brain className="w-4 h-4 text-white" />
                          <span>Buka Uji Pemahaman</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Recent Portfolio Highlight */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#25324B] font-display flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-[#7C5CFC]" />
                          <span>Karya Terakhir Saya</span>
                        </h2>
                        <button
                          onClick={() => setStudentTab('portfolio')}
                          className="text-xs font-bold text-[#7C5CFC] hover:underline"
                        >
                          Lihat Semua Portofolio ({sessions.length})
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="bg-gradient-to-br from-slate-50/60 via-white to-blue-50/30 rounded-3xl p-4 border border-slate-200 shadow-2xs flex items-center gap-4 hover:shadow-md transition-all"
                          >
                            <img
                              src={s.image}
                              alt={s.imageLabel}
                              className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                                  {s.subject}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  📖 Rekam Nalar
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-[#25324B] truncate">
                                {s.imageLabel}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {s.answers.challengeAnswer || s.answers.reason}
                              </p>
                              <div className="pt-1 flex items-center gap-2">
                                <button
                                  onClick={() => handleLaunchPresentation(s)}
                                  className="text-[11px] font-bold text-[#7C5CFC] hover:underline flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-[#7C5CFC]" />
                                  <span>Putar Slide</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. STUDENT EXPLORE / MISSIONS TAB */}
                {studentTab === 'explore' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <h2 className="text-lg sm:text-xl font-bold text-[#25324B] font-display">
                            Pilih Misi Pembelajaran Kontekstual
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Setiap misi dirancang untuk mengasah penalaran literasi sains & numerasi kontekstual dari benda nyata di sekitarmu.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor="student-subject-filter" className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          Mapel:
                        </label>
                        <select
                          id="student-subject-filter"
                          value={studentSelectedSubjectId}
                          onChange={(e) => setStudentSelectedSubjectId(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                        >
                          <option value="all">📖 Semua Mapel</option>
                          {subjects.map((subj) => (
                            <option key={subj.id} value={subj.id}>
                              {subj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {missions
                        .filter((m) => studentSelectedSubjectId === 'all' || m.idMapel === studentSelectedSubjectId)
                        .map((m) => {
                          const isCurrent = activeMission ? m.id === activeMission.id : false;
                          const isNumeracy = m.targetCompetency === 'numeracy' || m.subject.toLowerCase().includes('matematika');
                          const isLiteracy = m.targetCompetency === 'literacy' || m.subject.toLowerCase().includes('bahasa') || m.subject.toLowerCase().includes('ipa');
                        return (
                          <div
                            key={m.id}
                            className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between space-y-4 ${
                              isCurrent
                                ? 'border-[#4F8EF7] bg-blue-50/40 ring-2 ring-blue-500/20 shadow-md'
                                : isNumeracy
                                ? 'bg-gradient-to-br from-sky-50/50 via-white to-blue-50/30 border-sky-200/80 hover:border-sky-300 shadow-2xs hover:shadow-md'
                                : isLiteracy
                                ? 'bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border-emerald-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md'
                                : 'bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 border-purple-200/80 hover:border-purple-300 shadow-2xs hover:shadow-md'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    {m.subject} • {m.grade}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    isNumeracy
                                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {isNumeracy ? '📐 Numerasi' : isLiteracy ? '🌱 Literasi Sains' : '🌟 Terpadu'}
                                  </span>
                                </div>
                                {isCurrent ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                                    Sedang Dipilih
                                  </span>
                                ) : m.isActive ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                    Diaktifkan Guru
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                    Belum Diaktifkan
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-bold text-[#25324B] leading-snug">
                                {m.title}
                              </h3>
                              <p className="text-xs text-slate-600 font-medium">
                                Materi: <strong className="text-slate-800">{m.material}</strong>
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {m.description}
                              </p>

                              {m.suggestedObjects && m.suggestedObjects.length > 0 && (
                                <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-[11px] text-slate-600 shadow-2xs">
                                  <strong className="text-slate-800 flex items-center gap-1">
                                    <span>📸 Ide Benda yang Bisa Difoto:</span>
                                  </strong>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {m.suggestedObjects.map((obj, oIdx) => (
                                      <span
                                        key={oIdx}
                                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                                      >
                                        {obj}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                              {m.isActive ? (
                                <button
                                  onClick={() => {
                                    setActiveMission(m);
                                    setIsCameraOpen(true);
                                  }}
                                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold text-xs flex items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer shadow-xs"
                                >
                                  <Camera className="w-4 h-4" />
                                  <span>Pilih Misi Ini & Mulai Foto</span>
                                </button>
                              ) : (
                                <div className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs text-center border border-slate-200">
                                  Misi Belum Diaktifkan oleh Guru
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. STUDENT PORTFOLIO TAB */}
                {studentTab === 'portfolio' && (
                  <PortfolioGallery
                    sessions={sessions}
                    onOpenSessionPresentation={(s) => handleLaunchPresentation(s)}
                    users={users}
                    currentUser={currentUser}
                    groups={groups}
                    groupObservations={groupObservations}
                  />
                )}

                {/* 4. STUDENT QUIZ TAB (Uji Pemahaman Konsep) */}
                {studentTab === 'quiz' && (
                  <StudentQuizHub
                    quizzes={conceptQuizzes}
                    currentUser={currentUser}
                    quizSubmissions={quizSubmissions}
                    onSubmitQuizResult={handleSubmitQuizResult}
                    missions={missions}
                    sessions={sessions}
                    subjects={subjects}
                  />
                )}

                {/* 5. STUDENT PRESENTATION STUDIO TAB */}
                {studentTab === 'present' && (
                  isPresentationAllowed ? (
                    <div className="space-y-4">
                      {presentationSettings.notesForStudents && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-900 flex items-start gap-3 text-left shadow-2xs">
                          <BookOpen className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold block">Petunjuk Khusus dari Guru:</span>
                            <p className="text-xs text-purple-800 leading-relaxed font-normal">
                              "{presentationSettings.notesForStudents}"
                            </p>
                          </div>
                        </div>
                      )}
                      <PresentationEditor
                        slides={
                          (() => {
                            const studentSession = sessions
                              .filter(s => s.studentId === currentUser?.id && s.status === 'completed')
                              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                            return studentSession?.presentation || [];
                          })()
                        }
                        onUpdateSlides={(newSlides) => {
                          // Find latest session and update it
                          const studentSession = sessions
                            .filter(s => s.studentId === currentUser?.id && s.status === 'completed')
                            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                          
                          if (studentSession) {
                            const updatedSession = { ...studentSession, presentation: newSlides };
                            setSessions(sessions.map(s => s.id === studentSession.id ? updatedSession : s));
                            dbUpsertSession(updatedSession).catch(console.error);
                          }
                        }}
                        onLaunchPresentation={() => {
                          const studentSession = sessions
                            .filter(s => s.studentId === currentUser?.id && s.status === 'completed')
                            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                          if (studentSession) {
                            setActiveSessionForViewer(studentSession);
                            setIsPlayingFullscreen(true);
                          }
                        }}
                        currentUser={currentUser}
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                        <Mic className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-[#25324B] font-display">
                        Fitur Presentasi Belum Diaktifkan untuk Akun Ini
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Guru mengatur fitur presentasi untuk mode: <strong className="text-purple-700 font-bold">{
                          presentationSettings.mode === 'group_only'
                            ? 'Khusus Kelompok Belajar'
                            : presentationSettings.mode === 'individual_only'
                            ? 'Khusus Akun Siswa Mandiri'
                            : 'Berkelompok & Individu'
                        }</strong>.
                      </p>
                      <button
                        onClick={() => setStudentTab('home')}
                        className="px-5 py-2.5 rounded-xl bg-[#4F8EF7] text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-blue-600 transition-colors"
                      >
                        Kembali ke Beranda
                      </button>
                    </div>
                  )
                )}

                {/* Fallback for other tabs (think, solve, reflect, achievement) */}
                {(studentTab === 'think' || studentTab === 'solve' || studentTab === 'reflect' || studentTab === 'achievement') && (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4F8EF7] mx-auto flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#25324B] font-display">
                      Mulai Petualangan Belajarmu!
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tahapan berpikir, penalaran, dan refleksi dimulai saat kamu memotret benda di sekitarmu.
                    </p>
                    <button
                      onClick={() => {
                        setActiveMission(null);
                        setIsCameraOpen(true);
                      }}
                      className="px-6 py-3 rounded-xl bg-[#4F8EF7] text-white font-bold text-xs flex items-center gap-2 mx-auto hover:bg-blue-600 transition-colors shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 Ambil Foto Objek Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      </main>

      {/* Student Bottom Navigation (Mobile & Quick access) */}
      {isAuthenticated && currentRole === 'student' && !isPlayingFullscreen && (
        <StudentBottomNav
          activeTab={studentTab}
          isPresentationAllowed={isPresentationAllowed}
          onSelectTab={(tab) => {
            setStudentTab(tab);
          }}
          hasActiveSession={Boolean(activeLearningBridge || isChallengeActive)}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onConfirmPhoto={handleConfirmPhoto}
        activeMission={activeMission}
        missions={missions}
        onSelectMission={(m) => setActiveMission(m)}
        activeMissionTitle={activeMission?.title}
        activeMissionSubject={activeMission?.subject}
        suggestedObjects={activeMission?.suggestedObjects || []}
      />

      {/* Scanning AI Animation */}
      {isScanning && currentCapturedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <AIScanningAnimation
            imageSrc={currentCapturedImage}
            onCancel={() => {
              setIsScanning(false);
            }}
          />
        </div>
      )}

      {/* 5-Question Student Reflection Modal */}
      {(() => {
        let objectTitle = 'Objek Pengamatan';
        let studentObservation = '';
        let studentQuestion = '';

        if (currentImageLabel) {
          const parts = currentImageLabel.split(' | ');
          parts.forEach(part => {
            if (part.startsWith('Objek: ')) {
              objectTitle = part.replace('Objek: ', '');
            } else if (part.startsWith('Hasil Pengamatan Siswa: ')) {
              studentObservation = part.replace('Hasil Pengamatan Siswa: ', '');
            } else if (part.startsWith('Pertanyaan Tambahan Siswa: ')) {
              studentQuestion = part.replace('Pertanyaan Tambahan Siswa: ', '');
            }
          });
        }

        const q1Text = studentObservation
          ? `Saya mengamati objek "${objectTitle}". Detail pengamatan saya: ${studentObservation}.${studentQuestion ? ` Saya juga penasaran tentang: ${studentQuestion}` : ''}`
          : `Saya mengamati objek "${objectTitle}" di lingkungan sekitar saya.`;

        return (
          <ReflectionModal
            isOpen={isReflectionOpen}
            onFinishReflection={handleFinishReflection}
            onClose={() => setIsReflectionOpen(false)}
            studentId={currentUser?.id}
            defaultValues={{
              q1Found: q1Text
            }}
          />
        );
      })()}

      {/* Fullscreen Presentation Mode Viewer */}
      {isPlayingFullscreen && (
        <PresentationViewer
          slides={
            activeSlides.length > 0
              ? activeSlides
              : sessions[0]?.presentation || []
          }
          onClose={() => setIsPlayingFullscreen(false)}
          peerQuestions={activeSessionForViewer?.peerQuestions || []}
          onAddPeerAnswer={handleAddPeerAnswer}
          presenterName={currentUser.name}
        />
      )}

      {/* Teacher: Mission Creator Modal */}
      <MissionCreatorModal
        isOpen={isNewMissionModalOpen}
        onClose={() => setIsNewMissionModalOpen(false)}
        editingMission={editingMission}
        subjects={subjects}
        onSaveMission={(savedMission) => {
          const exists = missions.some((m) => m.id === savedMission.id);
          let updatedMissions: LearningMission[];
          if (exists) {
            updatedMissions = missions.map((m) => (m.id === savedMission.id ? savedMission : m));
            if (activeMission && activeMission.id === savedMission.id) {
              setActiveMission(savedMission);
            }
            toast.success('Misi Diperbarui', `Misi "${savedMission.title}" berhasil diperbarui.`);
          } else {
            updatedMissions = [savedMission, ...missions];
            setActiveMission(savedMission);
            toast.success('Misi Ditambahkan', `Misi baru "${savedMission.title}" berhasil diterbitkan.`);
          }
          setMissions(updatedMissions);
          try {
            localStorage.setItem('narasa_missions_data_v3', JSON.stringify(updatedMissions));
          } catch (e) {}
        }}
      />

      {/* Teacher: Classroom Projector Presentation Modal */}
      <ClassroomPresentationModal
        isOpen={isClassroomProjectorOpen}
        onClose={() => setIsClassroomProjectorOpen(false)}
        sessions={sessions}
        onOpenProjector={(s) => {
          setActiveSessionForViewer(s);
          setActiveSlides(s.presentation);
          setIsPlayingFullscreen(true);
        }}
      />

      {/* Login & Role Switcher Pop-up Modal (Triggered by clicking Profile in Navbar) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleLogin}
        onLogout={handleLogout}
        onOpenCreateModal={(role) => {
          setAccountModalEditingUser(null);
          setAccountModalDefaultRole(role || 'student');
          setIsAccountModalOpen(true);
        }}
      />

      {/* Account Switcher & Overview Modal */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSwitchUser}
        onOpenCreateModal={(role) => {
          setAccountModalEditingUser(null);
          setAccountModalDefaultRole(role || 'student');
          setIsAccountModalOpen(true);
        }}
        onOpenEditModal={(u) => {
          setAccountModalEditingUser(u);
          setIsAccountModalOpen(true);
        }}
      />

      {/* User Account Add / Edit Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountModalEditingUser(null);
        }}
        onSave={(data) => {
          if (data.id) {
            handleUpdateUser(data as UserProfile);
          } else {
            handleAddUser(data);
          }
        }}
        editingUser={accountModalEditingUser}
        defaultRole={accountModalDefaultRole}
        currentUser={currentUser}
      />

      {/* Modern Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
