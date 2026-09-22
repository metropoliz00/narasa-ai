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
  X
} from 'lucide-react';

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
          if (filtered.length !== parsed.length) {
            try {
              localStorage.setItem('narasa_users_data', JSON.stringify(filtered));
            } catch (e) {}
          }
          return filtered;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SYSTEM_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedUserId = localStorage.getItem('narasa_active_user_id');
      if (savedUserId && savedUserId !== 'user-teacher-2') {
        const found = INITIAL_SYSTEM_USERS.find(u => u.id === savedUserId && u.email !== 'maya.lestari@sdn01nusantara.sch.id');
        if (found) return found;
      }
    } catch (e) {}
    return INITIAL_SYSTEM_USERS[0];
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser.role);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Login & Account Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalEditingUser, setAccountModalEditingUser] = useState<UserProfile | null>(null);
  const [accountModalDefaultRole, setAccountModalDefaultRole] = useState<UserRole>('student');

  // Missions & Sessions state
  const [missions, setMissions] = useState<LearningMission[]>(DEFAULT_MISSIONS);
  const [sessions, setSessions] = useState<StudentActivitySession[]>([INITIAL_COMPLETED_SESSION]);
  const [activeMission, setActiveMission] = useState<LearningMission>(DEFAULT_MISSIONS[0]);

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

        const activeUsersList = remoteUsers || [];
        if (activeUsersList.length > 0) {
          const savedUserId = localStorage.getItem('narasa_active_user_id');
          const found = activeUsersList.find(u => u.id === savedUserId);
          if (found) {
            setCurrentUser(found);
            setCurrentRole(found.role);
            setIsAuthenticated(true);
          } else {
            setCurrentUser(activeUsersList[0]);
            setCurrentRole(activeUsersList[0].role);
            setIsAuthenticated(true);
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

  // Active Presentation States
  const [activeSlides, setActiveSlides] = useState<PresentationSlide[]>(INITIAL_COMPLETED_SESSION.presentation);
  const [isPlayingFullscreen, setIsPlayingFullscreen] = useState(false);
  const [activeSessionForViewer, setActiveSessionForViewer] = useState<StudentActivitySession | null>(INITIAL_COMPLETED_SESSION);

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
    const newUser: UserProfile = {
      ...userData,
      id: `user-${userData.role}-${Date.now()}`
    };
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
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      setCurrentRole(updatedUser.role);
    }
    try {
      localStorage.setItem('narasa_users_data', JSON.stringify(updated));
    } catch (e) {}
    toast.success('Profil Diperbarui', `Perubahan data "${updatedUser.name}" berhasil disimpan.`);
    // Background cloud database persist
    dbUpsertUser(updatedUser).catch((e) => console.warn('Supabase update user:', e));
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
    setCurrentUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('narasa_active_user_id', user.id);
    } catch (e) {}
    if (!suppressToast) {
      const cleanName = user.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim();
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

    try {
      // Call AI Vision Analysis
      const bridgeResult = await AIClientService.analyzeImage(
        imageDataUrl,
        activeMission,
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
      const tempSession: StudentActivitySession = {
        id: `session-${Date.now()}`,
        studentId: currentUser.id,
        studentName: currentUser.name,
        missionId: activeMission.id,
        missionTitle: activeMission.title,
        subject: activeMission.subject,
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
            avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80',
            question: `Apakah konsep ${activeMission.material} ini juga bisa kamu temukan di benda lain di rumahmu?`,
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
        presentation: generatedSlides.length > 0 ? generatedSlides : INITIAL_COMPLETED_SESSION.presentation
      };

      setSessions([finalSession, ...sessions]);
      if (isAuthenticated) {
        dbUpsertSession(finalSession).catch((err) => {
          console.warn('Gagal menyimpan karya portofolio ke Supabase:', err);
        });
      }
      setActiveSlides(finalSession.presentation);
      setActiveSessionForViewer(finalSession);
      setActiveLearningBridge(null);

      if (!isAuthenticated) {
        setIsPlayingFullscreen(true);
      } else if (currentRole === 'student') {
        setStudentTab('present');
      }

      toast.success(
        'Eksplorasi Selesai!',
        'Slide presentasi otomatis telah dirangkum dan siap ditampilkan.'
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
            'Jam Dinding Analog Kelas V'
          );
        }}
        onStartExploration={() => setIsCameraOpen(true)}
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
                    Misi: {activeMission.title}
                  </span>
                </div>
                <ChallengeStep
                  questions={activeLearningBridge.questions}
                  learningBridge={activeLearningBridge}
                  photoUrl={currentCapturedImage}
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
                      Misi: {activeMission.title}
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
              />
            )}

            {/* ==================== ADMIN VIEW (School Admin & Central Admin) ==================== */}
            {(currentRole === 'admin' || currentRole === 'school_admin' || currentRole === 'central_admin') && (
              <AdminDashboard
                users={users}
                currentUser={currentUser}
                missions={missions}
                sessions={sessions}
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
            {/* 1. STUDENT HOME TAB */}
            {studentTab === 'home' && (
                  <div className="space-y-6 text-left">
                    {/* Hero Student Banner (With Relevant Literacy & Numeracy Visual Background on Light Theme) */}
                    <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden group border border-slate-200/90 bg-white">
                      {/* Panoramic Background Image - High Visibility */}
                      <img
                        src={studentBannerBg}
                        alt="Eksplorasi Literasi dan Numerasi Murid"
                        className="absolute inset-0 w-full h-full object-cover object-right sm:object-center group-hover:scale-102 transition-transform duration-700 opacity-80 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      {/* Crisp Light White Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent sm:w-3/4 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/30 pointer-events-none" />

                      <div className="relative z-10 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs backdrop-blur-sm">
                            <span>Halo, {currentUser.name.replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim()}! 👋</span>
                          </div>
                          {currentUser.isGroup ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs backdrop-blur-sm">
                              👥 Akun Kelompok Belajar ({currentUser.groupMembers?.length || 0} Anggota)
                            </span>
                          ) : (
                            <SchoolClassBadge classNameStr={currentUser.className} schoolNameStr={currentUser.schoolName} size="md" />
                          )}
                        </div>

                        {currentUser.isGroup && currentUser.groupMembers && currentUser.groupMembers.length > 0 && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">Anggota Tim:</span>
                            {currentUser.groupMembers.map((m, mIdx) => (
                              <span key={mIdx} className="px-2 py-0.5 rounded-md bg-white/95 border border-amber-200 text-amber-900 text-[11px] font-medium shadow-xs">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}

                        <h1 className="text-xl sm:text-3xl font-bold font-display leading-tight text-[#1E293B]">
                          Foto Lingkungan Sekitar, Bangun Penalaran!
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-700 max-w-xl leading-relaxed">
                          Misi aktifmu: <strong className="text-blue-700">{activeMission.title}</strong> ({activeMission.subject}). Potret benda nyata di sekitarmu dan temukan keteraturan sains serta matematikanya!
                        </p>
                      </div>

                      {/* 5-Step Process Explainer (Clean Light Pills) */}
                      <div className="relative z-10 mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-slate-700 text-[11px] font-semibold">
                        <div className="py-1.5 px-2 rounded-lg bg-white/95 border border-slate-200 shadow-xs backdrop-blur-xs">1. Foto Misi 📸</div>
                        <div className="py-1.5 px-2 rounded-lg bg-white/95 border border-slate-200 shadow-xs backdrop-blur-xs">2. Hubungkan Konsep 🔗</div>
                        <div className="py-1.5 px-2 rounded-lg bg-white/95 border border-slate-200 shadow-xs backdrop-blur-xs">3. Nalar Kritis 💡</div>
                        <div className="py-1.5 px-2 rounded-lg bg-white/95 border border-slate-200 shadow-xs backdrop-blur-xs">4. Refleksi 🤔</div>
                        <div className="py-1.5 px-2 rounded-lg bg-white/95 border border-slate-200 shadow-xs backdrop-blur-xs">5. Presentasi 🎤</div>
                      </div>
                    </div>

                    {/* Active Learning Mission Card (Photo Action is inside this mission) */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                            <BookOpen className="w-5 h-5" />
                          </span>
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-[#25324B] font-display leading-none">
                              Misi Belajar Aktif
                            </h2>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Dari Guru: Pak Dedy
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setStudentTab('explore')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <span>Pilih Misi Lain</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {activeMission.subject}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {activeMission.grade} • {activeMission.phase}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-[#25324B]">
                            {activeMission.title}
                          </h3>
                          <p className="text-xs text-slate-600">
                            Materi: <strong>{activeMission.material}</strong>
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Tujuan: {activeMission.tp}
                          </p>

                          {activeMission.suggestedObjects && activeMission.suggestedObjects.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold text-slate-600 block mb-1">
                                Rekomendasi Benda Sekitar yang Bisa Difoto:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeMission.suggestedObjects.map((obj, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                                  >
                                    {obj}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => setIsCameraOpen(true)}
                            className="w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl bg-[#4F8EF7] hover:bg-blue-600 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all"
                          >
                            <Camera className="w-5 h-5" />
                            <span>Ambil Foto untuk Misi Ini</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Uji Pemahaman Konsep Section with White Theme & Literacy-Numeracy Background */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 text-slate-900 shadow-sm border border-slate-200/90 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                      {/* Background Image: Literacy & Numeracy */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <img
                          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80"
                          alt="Literasi dan Numerasi Pendidikan Dasar"
                          className="w-full h-full object-cover object-right opacity-25 group-hover:scale-102 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        {/* Soft White Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/75 md:w-3/4 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/40 pointer-events-none" />
                      </div>

                      <div className="relative z-10 space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Asesmen Pemahaman Konsep & Skor Langsung</span>
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
                          className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
                            className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-all"
                          >
                            <img
                              src={s.image}
                              alt={s.imageLabel}
                              className="w-20 h-20 rounded-2xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <span className="text-[10px] font-bold text-blue-600 uppercase">
                                {s.subject}
                              </span>
                              <h3 className="text-sm font-bold text-[#25324B] truncate">
                                {s.imageLabel}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {s.answers.challengeAnswer}
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
                        <h2 className="text-lg sm:text-xl font-bold text-[#25324B] font-display">
                          Pilih Misi Pembelajaran
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Setiap misi dirancang oleh guru dengan tujuan pembelajaran dan kriteria kurikulum yang jelas. Pilih misi untuk mulai memotret objek.
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
                          const isCurrent = m.id === activeMission.id;
                        return (
                          <div
                            key={m.id}
                            className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
                              isCurrent
                                ? 'border-[#4F8EF7] ring-2 ring-blue-500/10 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                  {m.subject} • {m.grade}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Sedang Aktif
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-bold text-[#25324B] leading-snug">
                                {m.title}
                              </h3>
                              <p className="text-xs text-slate-600">
                                Materi: <strong>{m.material}</strong>
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {m.description}
                              </p>

                              {m.suggestedObjects && m.suggestedObjects.length > 0 && (
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
                                  <strong>Ide Benda yang Bisa Difoto:</strong>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {m.suggestedObjects.map((obj, oIdx) => (
                                      <span
                                        key={oIdx}
                                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                                      >
                                        {obj}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  setActiveMission(m);
                                  setIsCameraOpen(true);
                                }}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white font-bold text-xs flex items-center justify-center gap-2 hover:shadow-md transition-all"
                              >
                                <Camera className="w-4 h-4" />
                                <span>Pilih Misi & Mulai Foto</span>
                              </button>
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
                          activeSlides.length > 0
                            ? activeSlides
                            : sessions[0]?.presentation || []
                        }
                        onUpdateSlides={setActiveSlides}
                        onLaunchPresentation={() => setIsPlayingFullscreen(true)}
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
                      onClick={() => setIsCameraOpen(true)}
                      className="px-6 py-3 rounded-xl bg-[#4F8EF7] text-white font-bold text-xs flex items-center gap-2 mx-auto hover:bg-blue-600 transition-colors shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 Ambil Foto Objek Sekarang</span>
                    </button>
                  </div>
                )}
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
        activeMissionTitle={activeMission.title}
        activeMissionSubject={activeMission.subject}
        suggestedObjects={activeMission.suggestedObjects}
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
          if (exists) {
            setMissions(missions.map((m) => (m.id === savedMission.id ? savedMission : m)));
            if (activeMission.id === savedMission.id) {
              setActiveMission(savedMission);
            }
            toast.success('Misi Diperbarui', `Misi "${savedMission.title}" berhasil diperbarui.`);
          } else {
            setMissions([savedMission, ...missions]);
            setActiveMission(savedMission);
            toast.success('Misi Ditambahkan', `Misi baru "${savedMission.title}" berhasil diterbitkan.`);
          }
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
